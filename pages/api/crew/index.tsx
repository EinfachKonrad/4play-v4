import { decryptData } from "@/lib/encryprion";
import { ApiRequest, withApi } from "@/lib/middleware";
import clientPromise from "@/lib/mongodb";
import CrewMember from "@/types/crewMember";
import { NextApiResponse } from "next";

// GET /api/crew
// GET /api/crew?type=internal
// GET /api/crew?type=external

type CrewMemberWithOptionalMongoId = CrewMember & { _id?: unknown }

function buildDecryptedMember(member: CrewMember): CrewMember {
    const { _id, passwordHash, ...safe } = member as CrewMemberWithOptionalMongoId

    return {
        ...safe,
        type: decryptData(safe.type) as CrewMember['type'],
        firstName: decryptData(safe.firstName) as string,
        lastName: decryptData(safe.lastName) as string,
        email: decryptData(safe.email) as CrewMember['email'],
        phone: decryptData(safe.phone) as CrewMember['phone'],
        dateOfBirth: decryptData(safe.dateOfBirth) as CrewMember['dateOfBirth'],
        roleUid: decryptData(safe.roleUid) as string,
        licenses: Array.isArray((safe as any).licenses)
            ? (safe as any).licenses.map((lic: any) => ({
                  ...lic,
                  type: decryptData(lic.type),
                  name: decryptData(lic.name),
                  validUntil: decryptData(lic.validUntil),
              }))
            : (safe as any).licenses,
    }
}

function buildLimitedMember(member: CrewMember) {
    const decrypted = buildDecryptedMember(member)
    const { uid, firstName, lastName, type } = decrypted
    return { uid, firstName, lastName, type }
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    const userPermissions = req.user?.permissions || []
    const canViewCrewMembers = userPermissions.includes('viewCrewMembers') || userPermissions.includes('*')

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const client = await clientPromise
    const db = client.db('settings')

    const requestedType = req.query.type === 'internal' || req.query.type === 'external' ? req.query.type : undefined
    const members = await db.collection<CrewMember>('crewmembers').find().toArray()
    const responseMembers = members
        .map(member => canViewCrewMembers ? buildDecryptedMember(member) : buildLimitedMember(member))
        .filter(member => !requestedType || member.type === requestedType)

    return res.status(200).json(responseMembers)
}

export default withApi(handler, {})