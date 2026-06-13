// This file was made by god, ChatGPT and me working together in perfect harmony. Neighter of us really knows how it works, but it does.
// Please redo really soon!


import { NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'
import CrewMember from '@/types/crewMember'
import { decryptData, encryptData } from '@/lib/encryprion'
import {
    ApiRequest,
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    requireMethod,
    withApi,
} from '@/lib/middleware'

// GET /api/settings/crew/crewmember?uid=crewmemberUid
// Own profile: always allowed (authenticated)
// Other profiles: requires 'viewCrewMembers'
// --> 200: { crewmember data (passwordHash omitted, _id omitted, roleUid only with view permission) }
// --> 403: { error: "Forbidden: Insufficient permissions" }
// --> 404: { error: "Crew member not found" }
// --> 500: { error: "Internal server error" }

// PUT /api/settings/crew/crewmember?uid=crewmemberUid
// Body: { update fields }
// Own profile: requires 'manageOwnInformation' (roleUid cannot be changed, mustChangePassword requires viewCrewMembers + manageCrewMembers)
// Other profiles: requires 'viewCrewMembers' + 'manageCrewMembers'
// mustChangePassword: only updatable with 'viewCrewMembers' + 'manageCrewMembers'
// --> 200: { message: "Crew member updated successfully" }
// --> 400: { error: "..." }
// --> 403: { error: "Forbidden: Insufficient permissions" }
// --> 404: { error: "Crew member not found" }
// --> 500: { error: "Internal server error" }

const SENSITIVE_FIELDS = ['passwordHash'] as const
const ENCRYPTED_STRING_FIELDS = ['type', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'roleUid'] as const
const SERVER_MANAGED_FIELDS = ['createdAt', 'updatedAt'] as const

function encryptIfPlain(value: string) {
    const decrypted = decryptData(value)
    return decrypted !== value ? value : encryptData(value)
}

function encryptUpdatePayload(updates: Record<string, unknown>) {
    const encryptedUpdates: Record<string, unknown> = { ...updates }

    for (const field of ENCRYPTED_STRING_FIELDS) {
        if (typeof encryptedUpdates[field] === 'string') {
            encryptedUpdates[field] = encryptIfPlain(encryptedUpdates[field] as string)
        }
    }

    if (Array.isArray(encryptedUpdates.roles)) {
        encryptedUpdates.roles = encryptedUpdates.roles.map((role) =>
            typeof role === 'string' ? encryptIfPlain(role) : role
        )
    }

    // Encrypt license fields (type, name, validUntil) if present
    if (Array.isArray(encryptedUpdates.licenses)) {
        encryptedUpdates.licenses = encryptedUpdates.licenses.map((lic) => {
            if (lic && typeof lic === 'object') {
                const newLic: Record<string, unknown> = { ...lic }
                if (typeof newLic.type === 'string') newLic.type = encryptIfPlain(newLic.type as string)
                if (typeof newLic.name === 'string') newLic.name = encryptIfPlain(newLic.name as string)
                if (typeof newLic.validUntil === 'string') newLic.validUntil = encryptIfPlain(newLic.validUntil as string)
                return newLic
            }
            return lic
        })
    }

    return encryptedUpdates
}

function buildResponseMember(member: CrewMember, canViewRoleUid: boolean, canViewMustChangePassword: boolean = false) {
    const { _id, passwordHash, mustChangePassword, roleUid, ...safe } = member as CrewMember & { _id?: unknown }

    // Decrypt encrypted fields before returning to client
    const decryptField = (value: any) => {
        if (typeof value === 'string') {
            try {
                return decryptData(value)
            } catch {
                // If decryption fails, return original value (might be plain text)
                return value
            }
        }
        return value
    }

    return {
        ...safe,
        firstName: decryptField(safe.firstName),
        lastName: decryptField(safe.lastName),
        type: decryptField(safe.type),
        email: decryptField(safe.email),
        phone: decryptField(safe.phone),
        dateOfBirth: decryptField(safe.dateOfBirth),
        licenses: Array.isArray((safe as any).licenses)
            ? (safe as any).licenses.map((lic: any) => ({
                  ...lic,
                  type: decryptField(lic.type),
                  name: decryptField(lic.name),
                  validUntil: decryptField(lic.validUntil),
              }))
            : (safe as any).licenses,
        ...(canViewRoleUid ? { roleUid: roleUid } : {}),
        ...(canViewMustChangePassword ? { mustChangePassword } : {}),
    }
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ['GET', 'PUT'])

    const userUid = req.user!.uid
    const queryUid = typeof req.query.uid === 'string'
        ? req.query.uid
        : Array.isArray(req.query.uid)
            ? req.query.uid[0]
            : undefined
    const uid = queryUid || userUid

    if (!uid) {
        throw new BadRequestError('uid is required')
    }

    const userPermissions = req.user!.permissions
    const isOwnProfile = uid === userUid

    const hasWildcard = userPermissions.includes('*')
    const canViewOthers = hasWildcard || userPermissions.includes('viewCrewMembers')
    const canManageOwn = hasWildcard || userPermissions.includes('manageOwnInformation')
    const canManageOthers = canViewOthers && (hasWildcard || userPermissions.includes('manageCrewMembers'))

    if (req.method === 'GET') {
        if (!isOwnProfile && !canViewOthers) {
            throw new ForbiddenError('Missing required permission: viewCrewMembers')
        }

        const client = await clientPromise
        const db = client.db('settings')
        const encryptedUid = encryptIfPlain(uid)
        let member = await db.collection<CrewMember>('crewmembers').findOne({ uid: encryptedUid })

        // Backward-compatible fallback for rows where uid is stored plain.
        if (!member && encryptedUid !== uid) {
            member = await db.collection<CrewMember>('crewmembers').findOne({ uid })
        }

        if (!member) {
            throw new NotFoundError('Crew member not found')
        }

        return res.status(200).json(buildResponseMember(member, canViewOthers, canManageOthers))
    }

    if (req.method === 'PUT') {
        if (isOwnProfile && !canManageOwn) {
            throw new ForbiddenError('Missing required permission: manageOwnInformation')
        }
        if (!isOwnProfile && !canManageOthers) {
            throw new ForbiddenError('Missing required permissions: viewCrewMembers and manageCrewMembers')
        }

        const updates = req.body
        if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
            throw new BadRequestError('Request body must be a JSON object')
        }

        const forbidden = Object.keys(updates).filter(k => (SENSITIVE_FIELDS as readonly string[]).includes(k))
        if (forbidden.length > 0) {
            throw new BadRequestError('Cannot update sensitive fields via this endpoint', { forbidden })
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'mustChangePassword') && !canManageOthers) {
            throw new ForbiddenError('Missing required permissions to update mustChangePassword: viewCrewMembers and manageCrewMembers')
        }

        if (isOwnProfile && Object.prototype.hasOwnProperty.call(updates, 'roleUid')) {
            delete updates.roleUid; // Remove roleUid for self-updates
        }

        const clientUpdates = { ...(updates as Record<string, unknown>) }

        for (const field of SERVER_MANAGED_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(clientUpdates, field)) {
                delete clientUpdates[field]
            }
        }

        const encryptedUpdates = encryptUpdatePayload(clientUpdates)

        const client = await clientPromise
        const db = client.db('settings')
        const encryptedUid = encryptIfPlain(uid)
        let result = await db.collection<CrewMember>('crewmembers').updateOne(
            { uid: encryptedUid },
            { $set: { ...encryptedUpdates, updatedAt: new Date() } }
        )

        if (result.matchedCount === 0 && encryptedUid !== uid) {
            result = await db.collection<CrewMember>('crewmembers').updateOne(
                { uid },
                { $set: { ...encryptedUpdates, updatedAt: new Date() } }
            )
        }

        if (result.matchedCount === 0) {
            throw new NotFoundError('Crew member not found')
        }

        return res.status(200).json({ message: 'Crew member updated successfully' })
    }
}

export default withApi(handler, {
    allowWildcardPermission: true,
})

