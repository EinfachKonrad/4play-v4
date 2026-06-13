import Appointment from '@/types/calendar/appointment'
import { decryptData, encryptData } from '@/lib/encryprion'
import { ApiRequest, BadRequestError, getUidFromQuery, requireMethod, withApi } from '@/lib/middleware'
import clientPromise from "@/lib/mongodb";
import { NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";


// GET /api/calendar/appointments - Get all appointments
// GET /api/calendar/appointments?uid= - Get appointment by uid
// POST /api/calendar/appointments - Create a new appointment
// PUT/PATCH /api/calendar/appointments?uid= - Update an existing appointment by uid
// DELETE /api/calendar/appointments?uid= - Delete an appointment by uid

type RepeatUnit = NonNullable<Appointment['repeat']>['unit']
type StoredAppointment = Omit<Appointment, 'date' | 'repeat'> & {
    date: {
        start: Date | string
        end: Date | string
    }
    repeat?: Omit<NonNullable<Appointment['repeat']>, 'unit' | 'endDate'> & {
        unit: RepeatUnit | string
        endDate?: Date | string
    }
    title?: string

    history: Array<{
        date: Date;
        event: string;
        description?: string;
        updatedBy: string;
    }>;
}

const REPEAT_UNITS: RepeatUnit[] = ['day', 'week', 'month', 'year']
const ENCRYPTED_STRING_FIELDS = ['uid', 'eventUid', 'name', 'description', 'location'] as const

function encryptIfPlain(value: string) {
    const decrypted = decryptData(value)
    return decrypted !== value ? value : encryptData(value)
}

function decryptField(value: unknown) {
    if (typeof value !== 'string') {
        return value
    }

    try {
        return decryptData(value)
    } catch {
        return value
    }
}

function parseDate(value: unknown, fieldName: string) {
    const parsed = new Date(value as string | number | Date)
    if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestError(`Invalid ${fieldName}`)
    }
    return parsed
}

function parseRepeat(repeat: unknown) {
    if (repeat == null) {
        return undefined
    }

    if (typeof repeat !== 'object' || Array.isArray(repeat)) {
        throw new BadRequestError('Repeat must be an object')
    }

    const input = repeat as Record<string, unknown>
    const interval = Number(input.interval)
    const unit = input.unit

    if (!Number.isFinite(interval) || interval <= 0) {
        throw new BadRequestError('Repeat interval must be a positive number')
    }

    if (typeof unit !== 'string' || !REPEAT_UNITS.includes(unit as RepeatUnit)) {
        throw new BadRequestError('Repeat unit is invalid')
    }

    const normalizedRepeat: NonNullable<Appointment['repeat']> = {
        interval,
        unit: unit as RepeatUnit,
    }

    if (input.iterations != null && input.iterations !== '') {
        const iterations = Number(input.iterations)
        if (!Number.isInteger(iterations) || iterations <= 0) {
            throw new BadRequestError('Repeat iterations must be a positive integer')
        }
        normalizedRepeat.iterations = iterations
    }

    if (input.endDate != null && input.endDate !== '') {
        normalizedRepeat.endDate = parseDate(input.endDate, 'repeat endDate')
    }

    return normalizedRepeat
}

function parseCrew(crew: unknown) {
    if (crew == null) {
        return undefined
    }

    if (!Array.isArray(crew)) {
        throw new BadRequestError('Crew must be an array')
    }

    return crew.map((member, index) => {
        if (!member || typeof member !== 'object' || Array.isArray(member) || typeof (member as { uid?: unknown }).uid !== 'string') {
            throw new BadRequestError(`Crew entry at index ${index} must contain a uid`)
        }

        return {
            uid: (member as { uid: string }).uid,
        }
    })
}

function buildQueryByUid(uid: string) {
    return { uid: { $in: [uid, encryptIfPlain(uid)] } }
}

function encryptAppointment(appointment: Appointment): StoredAppointment {
    const encryptedAppointment: StoredAppointment = {
        ...appointment,
        date: {
            start: encryptIfPlain(parseDate(appointment.date.start, 'date.start').toISOString()),
            end: encryptIfPlain(parseDate(appointment.date.end, 'date.end').toISOString()),
        },
        repeat: appointment.repeat
            ? {
                  ...appointment.repeat,
                  unit: encryptIfPlain(appointment.repeat.unit) as RepeatUnit,
                  ...(appointment.repeat.endDate ? { endDate: parseDate(appointment.repeat.endDate, 'repeat endDate') } : {}),
              }
            : undefined,
        crew: appointment.crew?.map((member) => ({
            uid: member.uid,
        })),
        history: [
            ...(appointment as StoredAppointment).history,
            {
                date: new Date(),
                event: 'updated',
                description: `data provided: ${JSON.stringify(appointment)}`,
                updatedBy: '',
            },
        ],
    }
    const encryptedRecord = encryptedAppointment as unknown as Record<string, unknown>

    for (const field of ENCRYPTED_STRING_FIELDS) {
        const fieldValue = encryptedAppointment[field]
        if (typeof fieldValue === 'string') {
            encryptedRecord[field] = encryptIfPlain(fieldValue)
        }
    }

    return encryptedAppointment
}

function buildResponseAppointment(appointment: StoredAppointment & { _id?: unknown }): Appointment {
    const { _id, title, history, ...safe } = appointment
    const fallbackName = typeof safe.name === 'string' ? safe.name : title

    return {
        uid: String(decryptField(safe.uid)),
        ...(safe.eventUid ? { eventUid: String(decryptField(safe.eventUid)) } : {}),
        name: typeof fallbackName === 'string' ? String(decryptField(fallbackName)) : '',
        description: typeof safe.description === 'string' ? String(decryptField(safe.description)) : '',
        location: typeof safe.location === 'string' ? String(decryptField(safe.location)) : '',
        date: {
            start: parseDate(decryptField(safe.date?.start), 'date.start'),
            end: parseDate(decryptField(safe.date?.end), 'date.end'),
        },
        ...(safe.repeat
            ? {
                  repeat: {
                      interval: Number(safe.repeat.interval),
                      unit: String(decryptField(safe.repeat.unit)) as RepeatUnit,
                      ...(safe.repeat.iterations != null ? { iterations: Number(safe.repeat.iterations) } : {}),
                      ...(safe.repeat.endDate ? { endDate: parseDate(safe.repeat.endDate, 'repeat endDate') } : {}),
                  },
              }
            : {}),
        ...(Array.isArray(safe.crew)
            ? {
                  crew: safe.crew.map((member) => ({
                      uid: String(decryptField(member.uid)),
                  })),
              }
            : {}),
    }
}

function parseAppointmentBody(body: unknown, requireName = false): Partial<Appointment> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new BadRequestError('Request body must be a JSON object')
    }

    const input = body as Record<string, unknown>
    const parsed: Partial<Appointment> = {}

    if (Object.prototype.hasOwnProperty.call(input, 'name') || Object.prototype.hasOwnProperty.call(input, 'title')) {
        const rawName = typeof input.name === 'string' ? input.name : typeof input.title === 'string' ? input.title : undefined
        if (!rawName || rawName.trim() === '') {
            throw new BadRequestError('Appointment name is required')
        }
        parsed.name = rawName.trim()
    } else if (requireName) {
        throw new BadRequestError('Appointment name is required')
    }

    if (Object.prototype.hasOwnProperty.call(input, 'eventUid')) {
        if (input.eventUid == null || input.eventUid === '') {
            parsed.eventUid = undefined
        } else if (typeof input.eventUid === 'string') {
            parsed.eventUid = input.eventUid.trim()
        } else {
            throw new BadRequestError('eventUid must be a string')
        }
    }

    if (Object.prototype.hasOwnProperty.call(input, 'description')) {
        if (typeof input.description !== 'string') {
            throw new BadRequestError('description must be a string')
        }
        parsed.description = input.description
    }

    if (Object.prototype.hasOwnProperty.call(input, 'location')) {
        if (typeof input.location !== 'string') {
            throw new BadRequestError('location must be a string')
        }
        parsed.location = input.location
    }

    if (Object.prototype.hasOwnProperty.call(input, 'date')) {
        if (!input.date || typeof input.date !== 'object' || Array.isArray(input.date)) {
            throw new BadRequestError('date must be an object')
        }

        const date = input.date as Record<string, unknown>
        parsed.date = {
            start: parseDate(date.start, 'date.start'),
            end: parseDate(date.end, 'date.end'),
        }
    } else if (requireName) {
        throw new BadRequestError('Appointment date is required')
    }

    if (Object.prototype.hasOwnProperty.call(input, 'repeat')) {
        parsed.repeat = parseRepeat(input.repeat)
    }

    if (Object.prototype.hasOwnProperty.call(input, 'crew')) {
        parsed.crew = parseCrew(input.crew)
    }

    return parsed
}

async function handler(req: ApiRequest, res: NextApiResponse) {
	requireMethod(req, res, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

    const client = await clientPromise
    const db = client.db('calendar')

	if (req.method === 'GET') {
        const { uid } = req.query
        if (uid) {
            const appointment = await db.collection<StoredAppointment>('appointments').findOne(buildQueryByUid(getUidFromQuery(uid)))
            if (!appointment) {
                return res.status(404).json({ error: 'Appointment not found' })
            }
            return res.status(200).json(buildResponseAppointment(appointment))
        } else {
            const appointments = await db.collection<StoredAppointment>('appointments').find({}).toArray()
            return res.status(200).json(appointments.map(buildResponseAppointment))
        }
	}

    if (req.method === 'POST') {
        const payload = parseAppointmentBody(req.body, true)
        const newAppointment: Appointment = {
            uid: uuidv4(),
            name: payload.name!,
            description: payload.description ?? '',
            location: payload.location ?? '',
            date: payload.date!,
            ...(payload.eventUid ? { eventUid: payload.eventUid } : {}),
            ...(payload.repeat ? { repeat: payload.repeat } : {}),
            ...(payload.crew ? { crew: payload.crew } : {}),
        }

        const encryptedAppointment = {
            ...encryptAppointment(newAppointment),
            createdAt: new Date(),
            history: [
                {
                    date: new Date(),
                    event: 'Appointment created',
                    description: `data provided: ${JSON.stringify(payload)}`,
                    updatedBy: req.user?.uid ?? '',
                },
            ],
        }
        await db.collection<StoredAppointment>('appointments').insertOne(encryptedAppointment)
        return res.status(201).json(newAppointment)
    }

    if (['PUT', 'PATCH'].includes(req.method!)) {
        const uid = getUidFromQuery(req.query.uid)
        const payload = parseAppointmentBody(req.body)
        const updateData: Partial<Appointment> = {}
        const unsetData: Record<string, ''> = {}

        if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
            updateData.name = payload.name
            unsetData.title = ''
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
            updateData.description = payload.description ?? ''
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'location')) {
            updateData.location = payload.location ?? ''
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'date')) {
            updateData.date = payload.date
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'eventUid')) {
            if (payload.eventUid) {
                updateData.eventUid = payload.eventUid
            } else {
                unsetData.eventUid = ''
            }
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'repeat')) {
            if (payload.repeat) {
                updateData.repeat = payload.repeat
            } else {
                unsetData.repeat = ''
            }
        }
        if (Object.prototype.hasOwnProperty.call(payload, 'crew')) {
            if (payload.crew) {
                updateData.crew = payload.crew
            } else {
                unsetData.crew = ''
            }
        }

        const updateOperation: { $set: Record<string, unknown>; $unset?: Record<string, ''> } = {
            $set: {
                ...encryptAppointment({
                    uid,
                    name: updateData.name ?? '',
                    description: updateData.description ?? '',
                    location: updateData.location ?? '',
                    date: updateData.date ?? { start: new Date(), end: new Date() },
                    ...(updateData.eventUid ? { eventUid: updateData.eventUid } : {}),
                    ...(updateData.repeat ? { repeat: updateData.repeat } : {}),
                    ...(updateData.crew ? { crew: updateData.crew } : {}),
                }),
                updatedAt: new Date(),
            },
        }

        delete updateOperation.$set.uid
        if (!Object.prototype.hasOwnProperty.call(updateData, 'name')) delete updateOperation.$set.name
        if (!Object.prototype.hasOwnProperty.call(updateData, 'description')) delete updateOperation.$set.description
        if (!Object.prototype.hasOwnProperty.call(updateData, 'location')) delete updateOperation.$set.location
        if (!Object.prototype.hasOwnProperty.call(updateData, 'date')) delete updateOperation.$set.date
        if (!Object.prototype.hasOwnProperty.call(updateData, 'eventUid')) delete updateOperation.$set.eventUid
        if (!Object.prototype.hasOwnProperty.call(updateData, 'repeat')) delete updateOperation.$set.repeat
        if (!Object.prototype.hasOwnProperty.call(updateData, 'crew')) delete updateOperation.$set.crew

        if (Object.keys(unsetData).length > 0) {
            updateOperation.$unset = unsetData
        }

        if (Object.keys(updateOperation.$set).length === 1 && !updateOperation.$unset) {
            throw new BadRequestError('No valid fields provided for update')
        }

        const result = await db.collection<StoredAppointment>('appointments').updateOne(buildQueryByUid(uid), updateOperation)
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Appointment not found' })
        }
        return res.status(200).json({ message: 'Appointment updated' })
    }

    if (req.method === 'DELETE') {
        const uid = getUidFromQuery(req.query.uid)
        const result = await db.collection<StoredAppointment>('appointments').deleteOne(buildQueryByUid(uid))
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Appointment not found' })
        }
        return res.status(200).json({ message: 'Appointment deleted' })
    }

	return res.status(501).json({ error: 'Not implemented' })
}

export default withApi(handler, {
	requiredPermissionsByMethod: {
		GET: ['viewAppointments'],
		POST: ['viewAppointments', 'manageAppointments'],
		PUT: ['viewAppointments', 'manageAppointments'],
		PATCH: ['viewAppointments', 'manageAppointments'],
		DELETE: ['viewAppointments', 'manageAppointments'],
	},
	allowWildcardPermission: true,
})