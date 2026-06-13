// GET /api/calendar/events - Get all events
// GET /api/calendar/events?uid= - Get event by uid
// POST /api/calendar/events - Create a new event
// PUT/PATCH /api/calendar/events?uid= - Update an existing event by uid
// DELETE /api/calendar/events?uid= - Delete an event by uid

import Event from '@/types/calendar/event'
import { decryptData, encryptData } from '@/lib/encryprion'
import {
    ApiRequest,
    BadRequestError,
    getUidFromQuery,
    requireMethod,
    withApi,
} from '@/lib/middleware'
import clientPromise from '@/lib/mongodb'
import { NextApiResponse } from 'next'
import { v4 as uuidv4 } from 'uuid'

type EventProject = Event['projects'][number]
type StoredEventDocument = Record<string, unknown> & {
    uid?: string
    createdAt?: Date
    updatedAt?: Date
}

type ProjectSectionKey = 'calculation' | 'equipment' | 'crew' | 'timetable'

const PROJECT_SECTION_PERMISSIONS: Record<
    ProjectSectionKey,
    { view: string; manage: string }
> = {
    calculation: {
        view: 'viewEventCalculation',
        manage: 'manageEventCalculation',
    },
    equipment: {
        view: 'viewEventEquipment',
        manage: 'manageEventEquipment',
    },
    crew: {
        view: 'viewEventCrew',
        manage: 'manageEventCrew',
    },
    timetable: {
        view: 'viewEventTimetable',
        manage: 'manageEventTimetable',
    },
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseDate(value: unknown, fieldName: string) {
    const parsed = new Date(value as string | number | Date)
    if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestError(`Invalid ${fieldName}`)
    }
    return parsed
}

function optionalString(value: unknown, fieldName: string) {
    if (value == null || value === '') {
        return undefined
    }
    if (typeof value !== 'string') {
        throw new BadRequestError(`${fieldName} must be a string`)
    }
    return value.trim()
}

function requiredString(value: unknown, fieldName: string) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new BadRequestError(`${fieldName} is required`)
    }
    return value.trim()
}

function parseNumber(value: unknown, fieldName: string, fallback = 0) {
    if (value == null || value === '') {
        return fallback
    }

    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
        throw new BadRequestError(`${fieldName} must be a valid number`)
    }

    return parsed
}

function defaultEquipment(): EventProject['equipment'] {
    return {
        groups: [],
    }
}

function defaultCrew(): EventProject['crew'] {
    return {
        positions: [],
        bookedCrew: [],
    }
}

function defaultTimetable(): EventProject['timetable'] {
    return {
        events: [],
    }
}

function defaultCalculation(): EventProject['calculation'] {
    return {
        importEquipment: true,
        importCrew: true,
        positions: [],
    }
}

function normalizeEquipment(input: unknown, fieldName: string): EventProject['equipment'] {
    if (input == null) {
        return defaultEquipment()
    }
    if (!isRecord(input)) {
        throw new BadRequestError(`${fieldName} must be an object`)
    }

    const groups = Array.isArray(input.groups) ? input.groups : []

    return {
        groups: groups.map((group, groupIndex) => {
            if (!isRecord(group)) {
                throw new BadRequestError(`${fieldName}.groups[${groupIndex}] must be an object`)
            }

            const bookingDurationInput = isRecord(group.bookingDuration)
                ? group.bookingDuration
                : {}
            const accountingInput = isRecord(bookingDurationInput.accountingDuration)
                ? bookingDurationInput.accountingDuration
                : {}
            const bookingDates = Array.isArray(bookingDurationInput.dates)
                ? bookingDurationInput.dates
                : []
            const bookedEquipment = Array.isArray(group.bookedEquipment)
                ? group.bookedEquipment
                : []

            return {
                name: requiredString(group.name, `${fieldName}.groups[${groupIndex}].name`),
                bookingDuration: {
                    entireProject: Boolean(bookingDurationInput.entireProject),
                    ...(bookingDates.length > 0
                        ? {
                              dates: bookingDates.map((dateRange, dateIndex) => {
                                  if (!isRecord(dateRange)) {
                                      throw new BadRequestError(`${fieldName}.groups[${groupIndex}].bookingDuration.dates[${dateIndex}] must be an object`)
                                  }

                                  return {
                                      start: parseDate(dateRange.start, `${fieldName}.groups[${groupIndex}].bookingDuration.dates[${dateIndex}].start`).toISOString(),
                                      end: parseDate(dateRange.end, `${fieldName}.groups[${groupIndex}].bookingDuration.dates[${dateIndex}].end`).toISOString(),
                                  }
                              }),
                          }
                        : {}),
                    accountingDuration: {
                        entireProject: Boolean(accountingInput.entireProject),
                        ...(accountingInput.days != null && accountingInput.days !== ''
                            ? {
                                  days: parseNumber(
                                      accountingInput.days,
                                      `${fieldName}.groups[${groupIndex}].bookingDuration.accountingDuration.days`
                                  ),
                              }
                            : {}),
                    },
                },
                bookedEquipment: bookedEquipment.map((equipment, equipmentIndex) => {
                    if (!isRecord(equipment)) {
                        throw new BadRequestError(`${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}] must be an object`)
                    }

                    const equipmentName = optionalString(
                        equipment.name,
                        `${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].name`
                    )
                    const versionUid = optionalString(
                        equipment.versionUid,
                        `${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].versionUid`
                    )

                    return {
                        uid: requiredString(
                            equipment.uid,
                            `${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].uid`
                        ),
                        ...(equipmentName ? { name: equipmentName } : {}),
                        quantity: parseNumber(
                            equipment.quantity,
                            `${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].quantity`
                        ),
                        ...(versionUid ? { versionUid } : {}),
                        ...(Array.isArray(equipment.optionalContent)
                            ? {
                                  optionalContent: equipment.optionalContent.map((value, contentIndex) =>
                                      requiredString(
                                          value,
                                          `${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].optionalContent[${contentIndex}]`
                                      )
                                  ),
                              }
                            : {}),
                        ...(Array.isArray(equipment.elements)
                            ? {
                                  elements: equipment.elements.map((element, elementIndex) => {
                                      if (!isRecord(element)) {
                                          throw new BadRequestError(`${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].elements[${elementIndex}] must be an object`)
                                      }

                                      const status = requiredString(
                                          element.status,
                                          `${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].elements[${elementIndex}].status`
                                      )
                                      if (!['packed', 'checked', 'returned'].includes(status)) {
                                          throw new BadRequestError(`${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].elements[${elementIndex}].status is invalid`)
                                      }

                                      return {
                                          uid: requiredString(
                                              element.uid,
                                              `${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].elements[${elementIndex}].uid`
                                          ),
                                          status: status as 'packed' | 'checked' | 'returned',
                                          updatedBy: requiredString(
                                              element.updatedBy,
                                              `${fieldName}.groups[${groupIndex}].bookedEqipment[${equipmentIndex}].elements[${elementIndex}].updatedBy`
                                          ),
                                      }
                                  }),
                              }
                            : {}),
                    }
                }),
            }
        }),
    }
}

function normalizeCrew(input: unknown, fieldName: string): EventProject['crew'] {
    if (input == null) {
        return defaultCrew()
    }
    if (!isRecord(input)) {
        throw new BadRequestError(`${fieldName} must be an object`)
    }

    const positions = Array.isArray(input.positions) ? input.positions : []
    const bookedCrew = Array.isArray(input.bookedCrew) ? input.bookedCrew : []

    return {
        positions: positions.map((position, positionIndex) => {
            if (!isRecord(position)) {
                throw new BadRequestError(`${fieldName}.positions[${positionIndex}] must be an object`)
            }

            const dates = Array.isArray(position.dates) ? position.dates : []

            return {
                uid: requiredString(position.uid, `${fieldName}.positions[${positionIndex}].uid`),
                dates: dates.map((dateEntry, dateIndex) => {
                    if (!isRecord(dateEntry)) {
                        throw new BadRequestError(`${fieldName}.positions[${positionIndex}].dates[${dateIndex}] must be an object`)
                    }

                    return {
                        uid: requiredString(
                            dateEntry.uid,
                            `${fieldName}.positions[${positionIndex}].dates[${dateIndex}].uid`
                        ),
                        start: parseDate(
                            dateEntry.start,
                            `${fieldName}.positions[${positionIndex}].dates[${dateIndex}].start`
                        ),
                        end: parseDate(
                            dateEntry.end,
                            `${fieldName}.positions[${positionIndex}].dates[${dateIndex}].end`
                        ),
                        ...(dateEntry.minCrew != null && dateEntry.minCrew !== ''
                            ? {
                                  minCrew: parseNumber(
                                      dateEntry.minCrew,
                                      `${fieldName}.positions[${positionIndex}].dates[${dateIndex}].minCrew`
                                  ),
                              }
                            : {}),
                    }
                }),
            }
        }),
        bookedCrew: bookedCrew.map((member, memberIndex) => {
            if (!isRecord(member)) {
                throw new BadRequestError(`${fieldName}.bookedCrew[${memberIndex}] must be an object`)
            }

            const dates = Array.isArray(member.dates) ? member.dates : []

            return {
                uid: requiredString(member.uid, `${fieldName}.bookedCrew[${memberIndex}].uid`),
                dates: dates.map((dateEntry, dateIndex) => {
                    if (!isRecord(dateEntry)) {
                        throw new BadRequestError(`${fieldName}.bookedCrew[${memberIndex}].dates[${dateIndex}] must be an object`)
                    }

                    const positionUid = optionalString(
                        dateEntry.positionUid,
                        `${fieldName}.bookedCrew[${memberIndex}].dates[${dateIndex}].positionUid`
                    )

                    return {
                        dateUid: requiredString(
                            dateEntry.dateUid,
                            `${fieldName}.bookedCrew[${memberIndex}].dates[${dateIndex}].dateUid`
                        ),
                        ...(positionUid ? { positionUid } : {}),
                    }
                }),
            }
        }),
    }
}

function normalizeTimetable(input: unknown, fieldName: string): EventProject['timetable'] {
    if (input == null) {
        return defaultTimetable()
    }
    if (!isRecord(input)) {
        throw new BadRequestError(`${fieldName} must be an object`)
    }

    const events = Array.isArray(input.events) ? input.events : []

    return {
        events: events.map((event, eventIndex) => {
            if (!isRecord(event)) {
                throw new BadRequestError(`${fieldName}.events[${eventIndex}] must be an object`)
            }

            const description = optionalString(
                event.description,
                `${fieldName}.events[${eventIndex}].description`
            )

            return {
                name: requiredString(event.name, `${fieldName}.events[${eventIndex}].name`),
                ...(description ? { description } : {}),
                start: parseDate(event.start, `${fieldName}.events[${eventIndex}].start`),
                end: parseDate(event.end, `${fieldName}.events[${eventIndex}].end`),
            }
        }),
    }
}

function normalizeCalculation(input: unknown, fieldName: string): EventProject['calculation'] {
    if (input == null) {
        return defaultCalculation()
    }
    if (!isRecord(input)) {
        throw new BadRequestError(`${fieldName} must be an object`)
    }

    const positions = Array.isArray(input.positions) ? input.positions : []

    return {
        importEquipment: Boolean(input.importEquipment),
        importCrew: Boolean(input.importCrew),
        positions: positions.map((position, positionIndex) => {
            if (!isRecord(position)) {
                throw new BadRequestError(`${fieldName}.positions[${positionIndex}] must be an object`)
            }

            const linked = isRecord(position.linked) ? position.linked : undefined
            const discount = isRecord(position.discount) ? position.discount : undefined
            const name = optionalString(position.name, `${fieldName}.positions[${positionIndex}].name`)
            const category = optionalString(
                position.category,
                `${fieldName}.positions[${positionIndex}].category`
            )

            if (linked) {
                const linkedType = requiredString(
                    linked.type,
                    `${fieldName}.positions[${positionIndex}].linked.type`
                )
                if (!['equipment', 'crew'].includes(linkedType)) {
                    throw new BadRequestError(`${fieldName}.positions[${positionIndex}].linked.type is invalid`)
                }
            }

            if (discount) {
                const discountType = requiredString(
                    discount.type,
                    `${fieldName}.positions[${positionIndex}].discount.type`
                )
                if (!['percentage', 'fixed'].includes(discountType)) {
                    throw new BadRequestError(`${fieldName}.positions[${positionIndex}].discount.type is invalid`)
                }
            }

            return {
                uid: requiredString(position.uid, `${fieldName}.positions[${positionIndex}].uid`),
                ...(name ? { name } : {}),
                ...(category ? { category } : {}),
                ...(linked
                    ? {
                          linked: {
                              type: requiredString(
                                  linked.type,
                                  `${fieldName}.positions[${positionIndex}].linked.type`
                              ) as 'equipment' | 'crew',
                              uid: requiredString(
                                  linked.uid,
                                  `${fieldName}.positions[${positionIndex}].linked.uid`
                              ),
                          },
                      }
                    : {}),
                quantity: parseNumber(
                    position.quantity,
                    `${fieldName}.positions[${positionIndex}].quantity`
                ),
                price: parseNumber(position.price, `${fieldName}.positions[${positionIndex}].price`),
                unit: requiredString(position.unit, `${fieldName}.positions[${positionIndex}].unit`),
                ...(discount
                    ? {
                          discount: {
                              type: requiredString(
                                  discount.type,
                                  `${fieldName}.positions[${positionIndex}].discount.type`
                              ) as 'percentage' | 'fixed',
                              value: parseNumber(
                                  discount.value,
                                  `${fieldName}.positions[${positionIndex}].discount.value`
                              ),
                          },
                      }
                    : {}),
            }
        }),
    }
}

function normalizeProject(input: unknown, index: number): EventProject {
    if (!isRecord(input)) {
        throw new BadRequestError(`projects[${index}] must be an object`)
    }

    const dates = Array.isArray(input.dates) ? input.dates : []
    const companyUid = optionalString(input.companyUid, `projects[${index}].companyUid`)
    const clientUid = optionalString(input.clientUid, `projects[${index}].clientUid`)

    return {
        uid: requiredString(input.uid, `projects[${index}].uid`),
        name: requiredString(input.name, `projects[${index}].name`),
        ...(companyUid ? { companyUid } : {}),
        ...(clientUid ? { clientUid } : {}),
        dates: dates.map((dateRange, dateIndex) => {
            if (!isRecord(dateRange)) {
                throw new BadRequestError(`projects[${index}].dates[${dateIndex}] must be an object`)
            }

            return {
                start: parseDate(dateRange.start, `projects[${index}].dates[${dateIndex}].start`).toISOString(),
                end: parseDate(dateRange.end, `projects[${index}].dates[${dateIndex}].end`).toISOString(),
            }
        }),
        equipment: normalizeEquipment(input.equipment, `projects[${index}].equipment`),
        crew: normalizeCrew(input.crew, `projects[${index}].crew`),
        timetable: normalizeTimetable(input.timetable, `projects[${index}].timetable`),
        calculation: normalizeCalculation(input.calculation, `projects[${index}].calculation`),
    }
}

function normalizeVenue(input: unknown): Event['venue'] | undefined {
    if (input == null) {
        return undefined
    }
    if (!isRecord(input)) {
        throw new BadRequestError('venue must be an object')
    }

    const name = optionalString(input.name, 'venue.name')
    const uid = optionalString(input.uid, 'venue.uid')

    if (!name && !uid) {
        return undefined
    }

    return {
        ...(name ? { name } : {}),
        ...(uid ? { uid } : {}),
    }
}

function normalizeEventPayload(input: unknown): Event {
    if (!isRecord(input)) {
        throw new BadRequestError('Request body must be a JSON object')
    }

    const clientUid = optionalString(input.clientUid, 'clientUid')
    const venue = normalizeVenue(input.venue)
    const projects = Array.isArray(input.projects) ? input.projects : []

    return {
        uid: requiredString(input.uid, 'uid'),
        companyUid: requiredString(input.companyUid, 'companyUid'),
        ...(clientUid ? { clientUid } : {}),
        name: requiredString(input.name, 'name'),
        description: typeof input.description === 'string' ? input.description.trim() : '',
        ...(venue ? { venue } : {}),
        projects: projects.map((project, index) => normalizeProject(project, index)),
    }
}

function buildQueryByUid(uid: string) {
    return { uid: { $in: [uid, encryptIfPlain(uid)] } }
}

function canViewProjectSection(permissions: string[], section: ProjectSectionKey) {
    return (
        permissions.includes('*') ||
        permissions.includes(PROJECT_SECTION_PERMISSIONS[section].view) ||
        permissions.includes(PROJECT_SECTION_PERMISSIONS[section].manage)
    )
}

function canManageProjectSection(permissions: string[], section: ProjectSectionKey) {
    return permissions.includes('*') || permissions.includes(PROJECT_SECTION_PERMISSIONS[section].manage)
}

function serializeForStorage(value: unknown): unknown {
    if (value instanceof Date) {
        return encryptIfPlain(value.toISOString())
    }
    if (typeof value === 'string') {
        return encryptIfPlain(value)
    }
    if (Array.isArray(value)) {
        return value.map((entry) => serializeForStorage(entry))
    }
    if (isRecord(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, serializeForStorage(entry)])
        )
    }
    return value
}

function deserializeFromStorage(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((entry) => deserializeFromStorage(entry))
    }
    if (isRecord(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [key, deserializeFromStorage(entry)])
        )
    }
    return decryptField(value)
}

function sanitizeProjectForWrite(
    project: EventProject,
    permissions: string[],
    existingProject?: EventProject
): EventProject {
    return {
        uid: project.uid,
        name: project.name,
        ...(project.companyUid ? { companyUid: project.companyUid } : {}),
        ...(project.clientUid ? { clientUid: project.clientUid } : {}),
        dates: project.dates,
        equipment: canManageProjectSection(permissions, 'equipment')
            ? project.equipment
            : existingProject?.equipment ?? defaultEquipment(),
        crew: canManageProjectSection(permissions, 'crew')
            ? project.crew
            : existingProject?.crew ?? defaultCrew(),
        timetable: canManageProjectSection(permissions, 'timetable')
            ? project.timetable
            : existingProject?.timetable ?? defaultTimetable(),
        calculation: canManageProjectSection(permissions, 'calculation')
            ? project.calculation
            : existingProject?.calculation ?? defaultCalculation(),
    }
}

function sanitizeEventForWrite(event: Event, permissions: string[], existingEvent?: Event): Event {
    const existingProjectsByUid = new Map(
        (existingEvent?.projects ?? []).map((project) => [project.uid, project])
    )

    return {
        uid: event.uid,
        companyUid: event.companyUid,
        ...(event.clientUid ? { clientUid: event.clientUid } : {}),
        name: event.name,
        description: event.description,
        ...(event.venue ? { venue: event.venue } : {}),
        projects: event.projects.map((project) =>
            sanitizeProjectForWrite(project, permissions, existingProjectsByUid.get(project.uid))
        ),
    }
}

function getEventDateBoundaries(event: Event) {
    const values = event.projects.flatMap((project) => {
        const projectDates = project.dates.flatMap((dateRange) => [dateRange.start, dateRange.end])
        const timetableDates = project.timetable.events.flatMap((item) => [
            item.start.toISOString(),
            item.end.toISOString(),
        ])
        return [...projectDates, ...timetableDates]
    })

    if (values.length === 0) {
        return { start: undefined, end: undefined }
    }

    const sorted = values
        .map((value) => parseDate(value, 'event boundary').toISOString())
        .sort((left, right) => left.localeCompare(right))

    return {
        start: sorted[0],
        end: sorted[sorted.length - 1],
    }
}

function applyReadPermissions(event: Event, permissions: string[]) {
    const projects = event.projects.map((project) => ({
        uid: project.uid,
        name: project.name,
        ...(project.companyUid ? { companyUid: project.companyUid } : {}),
        ...(project.clientUid ? { clientUid: project.clientUid } : {}),
        dates: project.dates,
        ...(canViewProjectSection(permissions, 'equipment') ? { equipment: project.equipment } : {}),
        ...(canViewProjectSection(permissions, 'crew') ? { crew: project.crew } : {}),
        ...(canViewProjectSection(permissions, 'timetable') ? { timetable: project.timetable } : {}),
        ...(canViewProjectSection(permissions, 'calculation')
            ? { calculation: project.calculation }
            : {}),
    }))

    return event
}

function buildEventFromStoredDocument(document: StoredEventDocument): Event {
    const { _id, createdAt, updatedAt, ...payload } = document
    void _id
    void createdAt
    void updatedAt
    return normalizeEventPayload(deserializeFromStorage(payload))
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

    const client = await clientPromise
    const db = client.db('calendar')
    const eventsCollection = db.collection<StoredEventDocument>('events')
    const userPermissions = req.user?.permissions ?? []

    if (req.method === 'GET') {
        const { uid } = req.query

        if (uid) {
            const storedEvent = await eventsCollection.findOne(buildQueryByUid(getUidFromQuery(uid)))
            if (!storedEvent) {
                return res.status(404).json({ error: 'Event not found' })
            }

            return res.status(200).json(
                applyReadPermissions(buildEventFromStoredDocument(storedEvent), userPermissions)
            )
        }

        const storedEvents = await eventsCollection.find({}).toArray()
        return res.status(200).json(
            storedEvents.map((storedEvent) =>
                applyReadPermissions(buildEventFromStoredDocument(storedEvent), userPermissions)
            )
        )
    }

    if (req.method === 'POST') {
        const requestedEvent = normalizeEventPayload({
            ...req.body,
            uid: uuidv4(),
            history: [
                {
                    date: new Date(),
                    event: 'created',
                    description: `provided data: ${JSON.stringify(req.body)}`,
                    updatedBy: req.user?.uid,
                }
            ]
        })
        const sanitizedEvent = sanitizeEventForWrite(requestedEvent, userPermissions)

        await eventsCollection.insertOne({
            ...(serializeForStorage(sanitizedEvent) as StoredEventDocument),
            createdAt: new Date(),
        })

        return res.status(201).json(applyReadPermissions(sanitizedEvent, userPermissions))
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
        const uid = getUidFromQuery(req.query.uid)
        const storedEvent = await eventsCollection.findOne(buildQueryByUid(uid))

        if (!storedEvent) {
            return res.status(404).json({ error: 'Event not found' })
        }

        const existingEvent = buildEventFromStoredDocument(storedEvent)
        const requestedEvent = normalizeEventPayload({
            ...existingEvent,
            ...req.body,
            uid,
        })
        const sanitizedEvent = sanitizeEventForWrite(requestedEvent, userPermissions, existingEvent)

        const replacement: StoredEventDocument = {
            ...storedEvent,
            history: [
                ...(Array.isArray(storedEvent.history) ? storedEvent.history : []),
                {
                    date: new Date(),
                    event: 'updated',
                    description: `provided data: ${JSON.stringify(req.body)}`,
                    updatedBy: req.user?.uid,
                }
            ],
        }

        delete replacement.companyUid
        delete replacement.clientUid
        delete replacement.name
        delete replacement.description
        delete replacement.venue
        delete replacement.projects
        delete replacement.uid

        const result = await eventsCollection.replaceOne(buildQueryByUid(uid), {
            ...replacement,
            uid: storedEvent.uid,
            ...(serializeForStorage(sanitizedEvent) as StoredEventDocument),
        })

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Event not found' })
        }

        return res.status(200).json(applyReadPermissions(sanitizedEvent, userPermissions))
    }

    if (req.method === 'DELETE') {
        const uid = getUidFromQuery(req.query.uid)
        const result = await eventsCollection.deleteOne(buildQueryByUid(uid))

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Event not found' })
        }

        return res.status(200).json({ message: 'Event deleted' })
    }

    return res.status(501).json({ error: 'Not implemented' })
}

export default withApi(handler, {
    requiredPermissionsByMethod: {
        GET: ['viewEvents'],
        POST: ['viewEvents', 'manageEvents'],
        PUT: ['viewEvents', 'manageEvents'],
        PATCH: ['viewEvents', 'manageEvents'],
        DELETE: ['viewEvents', 'manageEvents'],
    },
    allowWildcardPermission: true,
})