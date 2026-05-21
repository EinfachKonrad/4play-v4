import { NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'
import { ApiRequest, requireMethod, withApi } from '@/lib/middleware'
import { decryptData } from '@/lib/encryprion'

// GET /api/crew/data/licenses?type=...
// Returns an array of unique license names for the given license type

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ['GET'])

    const typeQuery = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type

    const client = await clientPromise
    const db = client.db('settings')

    // Fetch unwound license records, then decrypt & dedupe server-side.
    const pipeline: any[] = [
        { $unwind: '$licenses' },
        { $project: { 'licenses.type': 1, 'licenses.name': 1 } },
    ]

    const rows = await db.collection('crewmembers').aggregate(pipeline).toArray()

    const namesSet = new Set<string>()

    for (const row of rows) {
        const lic = row?.licenses
        if (!lic) continue

        const decType = decryptData(lic.type)
        const decName = decryptData(lic.name)

        if (typeQuery && typeof typeQuery === 'string' && typeQuery.length > 0) {
            if (decType !== typeQuery) continue
        }

        if (decName && typeof decName === 'string') namesSet.add(decName)
    }

    const names = Array.from(namesSet).sort()
    return res.status(200).json(names)
}

export default withApi(handler, {})
