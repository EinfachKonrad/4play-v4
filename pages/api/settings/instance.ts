import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import Instance from "@/types/settings/instance";

// GET /api/settings/instance
// --> 200: { name, defaultLocale, support, design }
// --> 404: { error: "Instance configuration not found" }
// --> 500: { error: "Internal server error" }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Pick<Instance, "name" | "defaultLocale" | "support" | "design"> | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("settings");
    const instance = await db
      .collection<Instance>("instance")
      .findOne({ active: true }, { projection: { name: 1, defaultLocale: 1, support: 1, design: 1, _id: 0 } });

    if (!instance) {
      return res.status(404).json({ error: "Instance configuration not found" });
    }

    return res.status(200).json(instance);
  } catch (error) {
    console.error("Failed to fetch instance config:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
