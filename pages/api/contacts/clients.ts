import {
    ApiRequest,
    BadRequestError,
    ConflictError,
    NotFoundError,
    requireMethod,
    withApi,
} from "@/lib/middleware";
import clientPromise from "@/lib/mongodb";
import { decryptData, encryptData } from "@/lib/encryprion";
import Client from "@/types/contacts/clients";
import { NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

function encryptIfPlain(value: string) {
    const decrypted = decryptData(value);
    return decrypted !== value ? value : encryptData(value);
}

function encryptStringsDeep<T>(value: T): T {
    if (typeof value === "string") {
        return encryptIfPlain(value) as T;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => encryptStringsDeep(entry)) as T;
    }

    if (value && typeof value === "object" && !(value instanceof Date)) {
        const result: Record<string, unknown> = {};

        for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
            result[key] = encryptStringsDeep(nestedValue);
        }

        return result as T;
    }

    return value;
}

function decryptStringsDeep<T>(value: T): T {
    if (typeof value === "string") {
        return decryptData(value) as T;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => decryptStringsDeep(entry)) as T;
    }

    if (value && typeof value === "object" && !(value instanceof Date)) {
        const result: Record<string, unknown> = {};

        for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
            result[key] = decryptStringsDeep(nestedValue);
        }

        return result as T;
    }

    return value;
}

function sanitizeClientForResponse(client: Record<string, unknown>) {
    const safe = { ...client };
    delete (safe as any)._id;
    delete (safe as any).integrations;
    return decryptStringsDeep(safe);
}

function getUidFromQuery(query: string | string[] | undefined) {
    if (!query) {
        throw new BadRequestError("uid is required");
    }

    return Array.isArray(query) ? query[0] : query;
}

function getUidFilter(uid: string) {
    const encryptedUid = encryptIfPlain(uid);

    if (encryptedUid === uid) {
        return { uid };
    }

    // Backward-compatible: match either encrypted or legacy plain uid.
    return { $or: [{ uid: encryptedUid }, { uid }] };
}

function ensurePayloadObject(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new BadRequestError("Request body must be a JSON object");
    }
}

function getHistoryEntry(event: string, updatedBy: string) {
    return {
        date: new Date(),
        event,
        updatedBy,
    };
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    const client = await clientPromise
    const db = client.db('contacts')
    const collection = db.collection<Client>('clients')

    if (req.method === 'GET') {
        const clients = await collection.find().toArray()
        return res.status(200).json(clients.map(client => {
            return sanitizeClientForResponse(client as Record<string, unknown>)
        }))
    }

    if (req.method === 'POST') {
        ensurePayloadObject(req.body)

        const payload = req.body as Record<string, unknown>
        if (typeof payload.name !== 'string' || payload.name.trim() === '') {
            throw new BadRequestError('name is required')
        }

        const uid = typeof payload.uid === 'string' && payload.uid.trim() !== ''
            ? payload.uid.trim()
            : uuidv4()

        const existing = await collection.findOne(getUidFilter(uid))
        if (existing) {
            throw new ConflictError('Client with this uid already exists', { uid })
        }

        const newClient: Client = {
            uid,
            name: payload.name.trim(),
            companyUid: typeof payload.companyUid === 'string' ? payload.companyUid : undefined,
            address: Array.isArray(payload.address) ? payload.address as Client['address'] : undefined,
            emails: Array.isArray(payload.emails) ? payload.emails as Client['emails'] : [],
            phoneNumbers: Array.isArray(payload.phoneNumbers) ? payload.phoneNumbers as Client['phoneNumbers'] : [],
            contactPersons: Array.isArray(payload.contactPersons) ? payload.contactPersons as Client['contactPersons'] : undefined,
            integrations: payload.integrations as Client['integrations'],
            history: Array.isArray(payload.history) && payload.history.length > 0
                ? payload.history as Client['history']
                : [getHistoryEntry('created', req.user?.uid ?? 'unknown')],
        }

        await collection.insertOne(encryptStringsDeep(newClient))
        return res.status(201).json(sanitizeClientForResponse(newClient as unknown as Record<string, unknown>))
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
        ensurePayloadObject(req.body)
        const uid = getUidFromQuery(req.query.uid)
        const payload = { ...(req.body as Record<string, unknown>) }

        delete payload._id
        delete payload.integrations
        delete payload.uid
        delete payload.history

        if (Object.keys(payload).length === 0) {
            throw new BadRequestError('No updatable fields provided')
        }

        const updated = await collection.findOneAndUpdate(
            getUidFilter(uid),
            {
                $set: encryptStringsDeep(payload),
                $push: { history: encryptStringsDeep(getHistoryEntry('updated', req.user?.uid ?? 'unknown')) },
            },
            { returnDocument: 'after' }
        )

        if (!updated) {
            throw new NotFoundError('Client not found')
        }

        return res.status(200).json(sanitizeClientForResponse(updated as unknown as Record<string, unknown>))
    }

    if (req.method === 'DELETE') {
        const uid = getUidFromQuery(req.query.uid)
        const deleted = await collection.findOneAndDelete(getUidFilter(uid))

        if (!deleted) {
            throw new NotFoundError('Client not found')
        }

        return res.status(200).json({ message: 'Client deleted successfully' })
    }


}


export default withApi(handler, {
    requiredPermissionsByMethod: {
        GET: ['viewClients'],
        POST: ['viewClients', 'manageClients'],
        PUT: ['viewClients', 'manageClients'],
        PATCH: ['viewClients', 'manageClients'],
        DELETE: ['viewClients', 'manageClients'],
    },
    allowWildcardPermission: true,
})