import { decryptData } from "@/lib/encryprion"
import { ApiRequest, requireMethod, withApi } from "@/lib/middleware"
import clientPromise from "@/lib/mongodb"
import { NextApiResponse } from "next"

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ['GET'])

    const client = await clientPromise
    const db = client.db('settings')
    const roles = await db.collection('roles').find().toArray()
    return res.status(200).json(roles.map(role => ({
        uuid: role.uuid,
        name: decryptData(role.name),
    })))

}

export default withApi(handler, {
    requiredPermissions: ['viewCrewMembers', 'manageCrewMembers'],
    allowWildcardPermission: true,
})