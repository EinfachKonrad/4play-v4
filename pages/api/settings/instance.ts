// PUBLIC ENDPOINT - AUTH OPTIONAL

import type { NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import Instance from "@/types/settings/instance";
import {
  ApiRequest,
  NotFoundError,
  requireMethod,
  withApi,
} from "@/lib/middleware";

// GET /api/settings/instance
// --> 200: { name, defaultLocale, support, design }
// --> 404: { error: "Instance configuration not found" }
// --> 500: { error: "Internal server error" }

async function handler(
  req: ApiRequest,
  res: NextApiResponse<Pick<Instance, "name" | "defaultLocale" | "support" | "design"> | { error: string }>
) {
  requireMethod(req, res, ["GET"]);

  try {
    const client = await clientPromise;
    const db = client.db("settings");
    const instance = await db
      .collection<Instance>("instance")
      .findOne({ active: true }, { projection: { name: 1, defaultLocale: 1, support: 1, design: 1, _id: 0 } });

    if (!instance) {
      throw new NotFoundError("Instance configuration not found");
    }

    return res.status(200).json(instance);
  } catch (error) {
    console.error("Failed to fetch instance config:", error);
    throw error;
  }
}

export default withApi(handler, {
  optionalAuth: true,
});
