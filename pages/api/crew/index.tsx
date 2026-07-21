import { decryptData, encryptData } from "@/lib/encryprion";
import { ApiRequest, withApi } from "@/lib/middleware";
import clientPromise from "@/lib/mongodb";
import CrewMember from "@/types/crewMember";
import { hash } from "bcryptjs";
import { NextApiResponse } from "next";
import crypto from "crypto";

// GET /api/crew
// GET /api/crew?type=internal
// GET /api/crew?type=external
// POST /api/crew

const defaultTimeclock: CrewMember['timeclock'] = {
    enabled: false,
    autoGrant: 'default',
    clockEntries: [],
}

function encryptIfPlain(value: string) {
    const decrypted = decryptData(value)
    return decrypted !== value ? value : encryptData(value)
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase()
}

function generateNumericPassword(length = 12) {
    let password = ''
    while (password.length < length) {
        password += String(crypto.randomInt(0, 10))
    }
    return password.slice(0, length)
}

type CrewMemberWithOptionalMongoId = CrewMember & { _id?: unknown }

function buildDecryptedMember(member: CrewMember): CrewMember {
    const { _id, passwordHash, ...safe } = member as CrewMemberWithOptionalMongoId

    return {
        ...safe,
        type: decryptData(safe.type) as CrewMember['type'],
        firstName: decryptData(safe.firstName) as string,
        lastName: decryptData(safe.lastName) as string,
        email: decryptData(safe.email) as CrewMember['email'],
        phone: decryptData(safe.phone) as CrewMember['phone'],
        dateOfBirth: decryptData(safe.dateOfBirth) as CrewMember['dateOfBirth'],
        roleUid: decryptData(safe.roleUid) as string,
        licenses: Array.isArray((safe as any).licenses)
            ? (safe as any).licenses.map((lic: any) => ({
                  ...lic,
                  type: decryptData(lic.type),
                  name: decryptData(lic.name),
                  validUntil: decryptData(lic.validUntil),
              }))
            : (safe as any).licenses,
    }
}

function buildLimitedMember(member: CrewMember) {
    const decrypted = buildDecryptedMember(member)
    const { uid, firstName, lastName, type } = decrypted
    return { uid, firstName, lastName, type }
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    const userPermissions = req.user?.permissions || []
    const canViewCrewMembers = userPermissions.includes('viewCrewMembers') || userPermissions.includes('*')

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const client = await clientPromise
    const db = client.db('settings')

    if (req.method === 'POST') {
        const body = req.body as Partial<CrewMember>
        const firstName = body.firstName?.trim()
        const lastName = body.lastName?.trim()
        const type = body.type
        const email = body.email ? normalizeEmail(body.email) : ''

        if (!firstName || !lastName || !email || (type !== 'internal' && type !== 'external')) {
            return res.status(400).json({ error: 'Missing or invalid required fields' })
        }

        const encryptedEmail = encryptIfPlain(email)
        const existingByEncryptedEmail = await db.collection<CrewMember>('crewmembers').findOne({ email: encryptedEmail })
        const existingByPlainEmail = encryptedEmail !== email
            ? await db.collection<CrewMember>('crewmembers').findOne({ email })
            : null

        if (existingByEncryptedEmail || existingByPlainEmail) {
            return res.status(409).json({ error: 'A crew member with this email already exists' })
        }

        const tempPassword = generateNumericPassword(12)
        const passwordHash = await hash(tempPassword, 12)
        const now = new Date()

        const payload: CrewMember & {
            passwordHash: string
            mustChangePassword: boolean
            locked: boolean
            createdAt: Date
            updatedAt: Date
        } = {
            uid: body.uid && typeof body.uid === 'string' && body.uid.trim() ? body.uid : crypto.randomUUID(),
            type: encryptIfPlain(type),
            firstName: encryptIfPlain(firstName),
            lastName: encryptIfPlain(lastName),
            email: encryptedEmail,
            phone: body.phone ? encryptIfPlain(body.phone) : undefined,
            dateOfBirth: body.dateOfBirth ? encryptIfPlain(new Date(body.dateOfBirth).toISOString()) as any : undefined,
            roleUid: encryptIfPlain(body.roleUid && body.roleUid.trim() ? body.roleUid : 'crew'),
            skillTags: Array.isArray(body.skillTags)
                ? body.skillTags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
                : [],
            calendarSubscriptions: Array.isArray(body.calendarSubscriptions) ? body.calendarSubscriptions : [],
            timeclock: body.timeclock ?? defaultTimeclock,
            licenses: Array.isArray(body.licenses)
                ? body.licenses.map((license) => ({
                    ...license,
                    type: encryptIfPlain(license.type),
                    name: encryptIfPlain(license.name),
                    validUntil: license.validUntil ? encryptIfPlain(new Date(license.validUntil).toISOString()) as any : undefined,
                }))
                : [],
            passwordHash,
            mustChangePassword: true,
            locked: false,
            createdAt: now,
            updatedAt: now,
        }

        await db.collection('crewmembers').insertOne(payload)
        return res.status(201).json({ success: true, uid: payload.uid, tempPassword })
    }

    const requestedType = req.query.type === 'internal' || req.query.type === 'external' ? req.query.type : undefined
    const members = await db.collection<CrewMember>('crewmembers').find().toArray()
    const responseMembers = members
        .map(member => canViewCrewMembers ? buildDecryptedMember(member) : buildLimitedMember(member))
        .filter(member => !requestedType || member.type === requestedType)

    return res.status(200).json(responseMembers)
}

export default withApi(handler, {
    requiredPermissionsByMethod: {
        POST: ['viewCrewMembers', 'manageCrewMembers'],
    },
    allowWildcardPermission: true,
})