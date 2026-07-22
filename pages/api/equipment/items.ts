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
import Item from "@/types/equipment/item";
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

function sanitizeItemForResponse(item: Record<string, unknown>) {
    const safe = { ...item };
    delete (safe as any)._id;
    return decryptStringsDeep(safe);
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ["GET", "POST", "PUT", "PATCH", "DELETE"]);

    const client = await clientPromise;
    const db = client.db("equipment");
    const collection = db.collection<Item>("items");

    if (req.method === "GET") {
        const rawId = req.query.id ?? req.query.uid;

        if (rawId) {
            const id = getIdFromQuery(rawId);
            const item = await collection.findOne(getIdFilter(id));

            if (!item) {
                throw new NotFoundError("Item not found");
            }

            return res.status(200).json(sanitizeItemForResponse(item as Record<string, unknown>));
        }

        const items = await collection.find().toArray();
        return res.status(200).json(items.map((item) => sanitizeItemForResponse(item as Record<string, unknown>)));
    }

    if (req.method === "POST") {
        ensurePayloadObject(req.body);

        const payload = req.body as Partial<Item>;
        if (typeof payload.id !== "string" || payload.id.trim() === "") {
            throw new BadRequestError("id is required");
        }
        if (typeof payload.model !== "string" || payload.model.trim() === "") {
            throw new BadRequestError("model is required");
        }
        if (typeof payload.path !== "string" || payload.path.trim() === "") {
            throw new BadRequestError("path is required");
        }
        if (typeof payload.purchasePrice !== "number" || Number.isNaN(payload.purchasePrice)) {
            throw new BadRequestError("purchasePrice must be a valid number");
        }
        if (typeof payload.dayRate !== "number" || Number.isNaN(payload.dayRate)) {
            throw new BadRequestError("dayRate must be a valid number");
        }
        if (!payload.stock || (payload.stock.trackingType !== "serial" && payload.stock.trackingType !== "bulk")) {
            throw new BadRequestError("stock.trackingType must be serial or bulk");
        }

        const existing = await collection.findOne(getIdFilter(payload.id));
        if (existing) {
            throw new ConflictError("Item with this id already exists", { id: payload.id });
        }

        const newItem = {
            ...payload,
            id: payload.id.trim(),
            model: payload.model.trim(),
            path: payload.path.trim(),
        } as Item;

        await collection.insertOne(encryptStringsDeep(newItem));
        return res.status(201).json(sanitizeItemForResponse(newItem as unknown as Record<string, unknown>));
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
            throw new NotFoundError("Item not found");
        }

        return res.status(200).json(sanitizeItemForResponse(updated as unknown as Record<string, unknown>));
    }

    const id = getIdFromQuery((req.query.id ?? req.query.uid) as string | string[] | undefined);
    const deleted = await collection.findOneAndDelete(getIdFilter(id));

    if (!deleted) {
        throw new NotFoundError("Item not found");
    }

    return res.status(200).json({ message: "Item deleted successfully" });
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