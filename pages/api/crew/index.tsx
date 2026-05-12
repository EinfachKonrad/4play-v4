import { decryptData } from "@/lib/encryprion";
import { ApiRequest, withApi } from "@/lib/middleware";
import clientPromise from "@/lib/mongodb";
import CrewMember from "@/types/crewMember";
import { NextApiResponse } from "next";

// GET /api/crew
// GET /api/crew?type=internal
// GET /api/crew?type=external

async function handler(req: ApiRequest, res: NextApiResponse) {
    const userPermissions = req.user?.permissions || []

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const client = await clientPromise
    const db = client.db('settings')

    if (req.query.type === 'internal') {
        const members = await db.collection<CrewMember>('crewmembers').find({ type: 'internal' }).toArray()
        const filteredMembers = members.map(member => {
            if (!userPermissions.includes('viewCrewMembers')) {
                const { uuid, firstName, lastName } = member
                return { uuid, firstName, lastName }
            }
            return member
        })
        return res.status(200).json(filteredMembers)
    }

    if (req.query.type === 'external') {
        const members = await db.collection<CrewMember>('crewmembers').find({ type: 'external' }).toArray()
        const filteredMembers = members.map(member => {
            if (!userPermissions.includes('viewCrewMembers')) {
                const { uuid, firstName, lastName } = member
                return { uuid, firstName, lastName }
            }
            return member
        })
        return res.status(200).json(filteredMembers)
    }

    const members = await db.collection<CrewMember>('crewmembers').find().toArray()
    const filteredMembers = members.map(member => {
        if (!userPermissions.includes('viewCrewMembers')) {
            return { 
                uuid: member.uuid,
                firstName: decryptData(member.firstName),
                lastName: decryptData(member.lastName),
                type: decryptData(member.type)
            }
        }
        return member
    })
    return res.status(200).json(filteredMembers)
}

export default withApi(handler, {})