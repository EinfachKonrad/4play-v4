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
import RentalItem from "@/types/equipment/rentalItem";
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

function sanitizeRentalItemForResponse(item: Record<string, unknown>) {
    const safe = { ...item };
    delete (safe as any)._id;
    return decryptStringsDeep(safe);
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ["GET", "POST", "PUT", "PATCH", "DELETE"]);

    const client = await clientPromise;
    const db = client.db("equipment");
    const collection = db.collection<RentalItem>("rentalItems");

    if (req.method === "GET") {
        const rawId = req.query.id ?? req.query.uid;

        if (rawId) {
            const id = getIdFromQuery(rawId);
            const rentalItem = await collection.findOne(getIdFilter(id));

            if (!rentalItem) {
                throw new NotFoundError("Rental item not found");
            }

            return res.status(200).json(sanitizeRentalItemForResponse(rentalItem as Record<string, unknown>));
        }

        const rentalItems = await collection.find().toArray();
        return res.status(200).json(rentalItems.map((item) => sanitizeRentalItemForResponse(item as Record<string, unknown>)));
    }

    if (req.method === "POST") {
        ensurePayloadObject(req.body);

        const payload = req.body as Partial<RentalItem>;
        if (typeof payload.id !== "string" || payload.id.trim() === "") {
            throw new BadRequestError("id is required");
        }
        if (typeof payload.model !== "string" || payload.model.trim() === "") {
            throw new BadRequestError("model is required");
        }
        if (typeof payload.path !== "string" || payload.path.trim() === "") {
            throw new BadRequestError("path is required");
        }
        if (!Array.isArray(payload.companies)) {
            throw new BadRequestError("companies must be an array");
        }

        const existing = await collection.findOne(getIdFilter(payload.id));
        if (existing) {
            throw new ConflictError("Rental item with this id already exists", { id: payload.id });
        }

        const newRentalItem = {
            ...payload,
            id: payload.id.trim(),
            model: payload.model.trim(),
            path: payload.path.trim(),
        } as RentalItem;

        await collection.insertOne(encryptStringsDeep(newRentalItem));
        return res.status(201).json(sanitizeRentalItemForResponse(newRentalItem as unknown as Record<string, unknown>));
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
            throw new NotFoundError("Rental item not found");
        }

        return res.status(200).json(sanitizeRentalItemForResponse(updated as unknown as Record<string, unknown>));
    }

    const id = getIdFromQuery((req.query.id ?? req.query.uid) as string | string[] | undefined);
    const deleted = await collection.findOneAndDelete(getIdFilter(id));

    if (!deleted) {
        throw new NotFoundError("Rental item not found");
    }

    return res.status(200).json({ message: "Rental item deleted successfully" });
}

export default withApi(handler, {
    requiredPermissionsByMethod: {
        GET: ["viewExternalEquipment"],
        POST: ["viewExternalEquipment", "manageExternalEquipment"],
        PUT: ["viewExternalEquipment", "manageExternalEquipment"],
        PATCH: ["viewExternalEquipment", "manageExternalEquipment"],
        DELETE: ["viewExternalEquipment", "manageExternalEquipment"],
    },
    allowWildcardPermission: true,
});
