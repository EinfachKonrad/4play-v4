import {
    ApiRequest,
    BadRequestError,
    ConflictError,
    NotFoundError,
    requireMethod,
    withApi,
} from "@/lib/middleware";
import { decryptData, encryptData } from "@/lib/encryprion";
import clientPromise from "@/lib/mongodb";
import Bundle from "@/types/equipment/bundle";
import { NextApiResponse } from "next";

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

function ensurePayloadObject(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new BadRequestError("Request body must be a JSON object");
    }
}

function getIdFromQuery(query: string | string[] | undefined) {
    if (!query) {
        throw new BadRequestError("id is required");
    }

    return Array.isArray(query) ? query[0] : query;
}

function getIdFilter(id: string) {
    const encryptedId = encryptIfPlain(id);

    if (encryptedId === id) {
        return { id };
    }

    return { $or: [{ id: encryptedId }, { id }] };
}

function sanitizeBundleForResponse(bundle: Record<string, unknown>) {
    const safe = { ...bundle };
    delete (safe as any)._id;
    return decryptStringsDeep(safe);
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ["GET", "POST", "PUT", "PATCH", "DELETE"]);

    const client = await clientPromise;
    const db = client.db("equipment");
    const collection = db.collection<Bundle>("bundles");

    if (req.method === "GET") {
        const rawId = req.query.id ?? req.query.uid;

        if (rawId) {
            const id = getIdFromQuery(rawId);
            const bundle = await collection.findOne(getIdFilter(id));

            if (!bundle) {
                throw new NotFoundError("Bundle not found");
            }

            return res.status(200).json(sanitizeBundleForResponse(bundle as Record<string, unknown>));
        }

        const bundles = await collection.find().toArray();
        return res.status(200).json(bundles.map((bundle) => sanitizeBundleForResponse(bundle as Record<string, unknown>)));
    }

    if (req.method === "POST") {
        ensurePayloadObject(req.body);

        const payload = req.body as Partial<Bundle>;
        if (typeof payload.id !== "string" || payload.id.trim() === "") {
            throw new BadRequestError("id is required");
        }
        if (typeof payload.name !== "string" || payload.name.trim() === "") {
            throw new BadRequestError("name is required");
        }
        if (typeof payload.path !== "string" || payload.path.trim() === "") {
            throw new BadRequestError("path is required");
        }
        if (typeof payload.dayRate !== "number" || Number.isNaN(payload.dayRate)) {
            throw new BadRequestError("dayRate must be a valid number");
        }
        if (!Array.isArray(payload.contents)) {
            throw new BadRequestError("contents must be an array");
        }

        const existing = await collection.findOne(getIdFilter(payload.id));
        if (existing) {
            throw new ConflictError("Bundle with this id already exists", { id: payload.id });
        }

        const newBundle = {
            ...payload,
            id: payload.id.trim(),
            name: payload.name.trim(),
            path: payload.path.trim(),
        } as Bundle;

        await collection.insertOne(encryptStringsDeep(newBundle));
        return res.status(201).json(sanitizeBundleForResponse(newBundle as unknown as Record<string, unknown>));
    }

    if (req.method === "PUT" || req.method === "PATCH") {
        ensurePayloadObject(req.body);
        const id = getIdFromQuery((req.query.id ?? req.query.uid) as string | string[] | undefined);
        const payload = { ...(req.body as Record<string, unknown>) };

        delete payload._id;
        delete payload.id;

        if (Object.keys(payload).length === 0) {
            throw new BadRequestError("No updatable fields provided");
        }

        const updated = await collection.findOneAndUpdate(
            getIdFilter(id),
            { $set: encryptStringsDeep(payload) },
            { returnDocument: "after" }
        );

        if (!updated) {
            throw new NotFoundError("Bundle not found");
        }

        return res.status(200).json(sanitizeBundleForResponse(updated as unknown as Record<string, unknown>));
    }

    const id = getIdFromQuery((req.query.id ?? req.query.uid) as string | string[] | undefined);
    const deleted = await collection.findOneAndDelete(getIdFilter(id));

    if (!deleted) {
        throw new NotFoundError("Bundle not found");
    }

    return res.status(200).json({ message: "Bundle deleted successfully" });
}

export default withApi(handler, {
    requiredPermissionsByMethod: {
        GET: ["viewOwnEquipment"],
        POST: ["viewOwnEquipment", "manageOwnEquipent"],
        PUT: ["viewOwnEquipment", "manageOwnEquipent"],
        PATCH: ["viewOwnEquipment", "manageOwnEquipent"],
        DELETE: ["viewOwnEquipment", "manageOwnEquipent"],
    },
    allowWildcardPermission: true,
});
