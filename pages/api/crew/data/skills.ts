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

    // Fetch unwound skill records, then decrypt & dedupe server-side.
    const pipeline: any[] = [
        { $project: { skillTags: 1 } },
    ]

    const rows = await db.collection('crewmembers').aggregate(pipeline).toArray()

    const skillsSet = new Set<string>()

    for (const row of rows) {
        const skills = row?.skillTags
        if (!skills) continue

        skills.forEach((skill: any) => {
            const decSkill = decryptData(skill)
            if (decSkill && typeof decSkill === 'string') skillsSet.add(decSkill)
        })
    }

    const skills = Array.from(skillsSet).sort()
    return res.status(200).json(skills)
}

export default withApi(handler, {})
