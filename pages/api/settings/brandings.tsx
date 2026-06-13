import { decryptData, encryptData } from "@/lib/encryprion";
import { ApiRequest, BadRequestError, NotFoundError, getUidFromQuery, requireMethod, withApi } from "@/lib/middleware";
import clientPromise from "@/lib/mongodb";
import { NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

type BrandingHistoryEntry = {
    date: Date
    event: string
    description: string
    updatedBy: string
}

type BrandingDocument = {
    uid: string
    history: BrandingHistoryEntry[]
    updatedAt?: Date
}


// GET /api/settings/brandings
// GET /api/settings/brandings?uid=
// POST /api/settings/brandings
// PUT /api/settings/brandings?uid=
// DELETE /api/settings/brandings?uid=

function encryptIfPlain(value: string) {
    const decrypted = decryptData(value)
    return decrypted !== value ? value : encryptData(value)
}

function transformStringsDeep(value: unknown, transform: (input: string) => string): unknown {
    if (typeof value === 'string') {
        return transform(value)
    }

    if (Array.isArray(value)) {
        return value.map((entry) => transformStringsDeep(entry, transform))
    }

    if (value && typeof value === 'object') {
        if (value instanceof Date) {
            return value
        }

        const transformed: Record<string, unknown> = {}
        for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
            transformed[key] = transformStringsDeep(entry, transform)
        }
        return transformed
    }

    return value
}

function buildUidQuery(uid: string) {
    return { uid: { $in: [uid, encryptIfPlain(uid)] } }
}

function buildResponseBranding(
    branding: Record<string, unknown>,
    options?: { includeIntegrations?: boolean; includeLexwareIntegration?: boolean }
): Record<string, unknown> {
    const response = transformStringsDeep({ ...branding }, (value) => String(decryptData(value))) as Record<string, unknown>
    delete response._id

    if (options?.includeIntegrations === false) {
        delete response.integrations
    }

    if (options?.includeLexwareIntegration === false) {
        const integrations = response.integrations
        if (integrations && typeof integrations === 'object' && !Array.isArray(integrations)) {
            delete (integrations as Record<string, unknown>).lexware
        }
    }

    return response
}

function canAccessLexwareIntegration(req: ApiRequest): boolean {
    const permissions = req.user?.permissions ?? []
    return (
        permissions.includes('*')
        || permissions.includes('useLexwareIntegration')
    )
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

    const includeLexwareIntegration = canAccessLexwareIntegration(req)

    const client = await clientPromise
    const db = client.db('settings')
    const collection = db.collection<BrandingDocument>('brandings')

    if (req.method === 'GET') {
        const rawUid = req.query.uid
        const uid = rawUid ? (Array.isArray(rawUid) ? rawUid[0] : rawUid) : undefined

        if (uid) {
            const branding = await collection.findOne(buildUidQuery(uid))
            if (!branding) {
                throw new NotFoundError('Branding not found')
            }
            return res
                .status(200)
                .json(
                    buildResponseBranding(branding as Record<string, unknown>, {
                        includeLexwareIntegration,
                    })
                )
        }

        const brandings = await collection.find().toArray()
        return res
            .status(200)
            .json(
                brandings.map((branding) =>
                    buildResponseBranding(branding as Record<string, unknown>, { includeIntegrations: false })
                )
            )
    }

    if (req.method === 'POST') {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            throw new BadRequestError('Request body must be a JSON object')
        }

        const data = req.body as Record<string, unknown>
        if (typeof data.name !== 'string' || data.name.trim() === '' || !data.address || typeof data.address !== 'object') {
            throw new BadRequestError('Name and address are required')
        }

        const newBranding = {
            ...data,
            uid: uuidv4(),
            history: [
                {
                    date: new Date(),
                    event: 'created',
                    description: `provided data: ${JSON.stringify(data)}`,
                    updatedBy: req.user?.uid ?? 'unknown',
                },
            ],
        }

        const encryptedBranding = transformStringsDeep(newBranding, encryptIfPlain) as BrandingDocument
        await collection.insertOne(encryptedBranding)
        return res
            .status(201)
            .json(buildResponseBranding(encryptedBranding as Record<string, unknown>, { includeLexwareIntegration }))
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
        const uid = getUidFromQuery(req.query.uid)

        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            throw new BadRequestError('Request body must be a JSON object')
        }

        const updates = { ...(req.body as Record<string, unknown>) }
        delete updates.uid
        delete updates.history

        const encryptedUpdates = transformStringsDeep(updates, encryptIfPlain) as Record<string, unknown>
        const encryptedHistoryEntry = transformStringsDeep(
            {
                date: new Date(),
                event: req.method === 'PUT' ? 'replaced' : 'updated',
                description: `provided updates: ${JSON.stringify(updates)}`,
                updatedBy: req.user?.uid ?? 'unknown',
            },
            encryptIfPlain
        ) as BrandingHistoryEntry

        const result = await collection.findOneAndUpdate(
            buildUidQuery(uid),
            {
                $set: {
                    ...encryptedUpdates,
                    updatedAt: new Date(),
                },
                $push: { history: encryptedHistoryEntry },
            },
            { returnDocument: 'after' }
        )

        if (!result) {
            throw new NotFoundError('Branding not found')
        }

        return res
            .status(200)
            .json(buildResponseBranding(result as Record<string, unknown>, { includeLexwareIntegration }))
    }

    if (req.method === 'DELETE') {
        const uid = getUidFromQuery(req.query.uid)
        const result = await collection.deleteOne(buildUidQuery(uid))

        if (result.deletedCount === 0) {
            throw new NotFoundError('Branding not found')
        }

        return res.status(200).json({ message: 'Branding deleted' })
    }
}

export default withApi(handler, {
    requiredPermissionsByMethod: {
        GET: ['viewBrandingSettings'],
        POST: ['viewBrandingSettings', 'manageBrandingSettings'],
        PUT: ['viewBrandingSettings', 'manageBrandingSettings'],
        PATCH: ['viewBrandingSettings', 'manageBrandingSettings'],
        DELETE: ['viewBrandingSettings', 'manageBrandingSettings'],
    },
    allowWildcardPermission: true  
})