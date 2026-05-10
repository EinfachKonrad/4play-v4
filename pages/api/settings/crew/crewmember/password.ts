import { ApiRequest, withApi } from "@/lib/middleware";
import { NextApiResponse } from "next";

async function handler(req: ApiRequest, res: NextApiResponse) {
    return res.status(200).json({ message: "Password update endpoint - implementation pending" });
}

export default withApi(handler, {})
