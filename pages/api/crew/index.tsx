import { ApiRequest, withApi } from "@/lib/middleware";
import { NextApiResponse } from "next";

// GET /api/crew
// GET /api/crew?type=intern
// GET /api/crew?type=extern

async function handler(req: ApiRequest, res: NextApiResponse) {
    const userPermissions = req.user?.permissions || []

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    
}

export default withApi(handler, {})