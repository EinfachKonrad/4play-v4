import { decryptData } from "@/lib/encryprion";
import { ApiRequest, requireMethod, withApi } from "@/lib/middleware";
import clientPromise from "@/lib/mongodb";
import { NextApiResponse } from "next";

async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ['GET'])

    const client = await clientPromise
    const db = client.db('settings')
    const birthdays = await db.collection('crewmembers').find({}, { projection: { firstName: 1, lastName: 1, dateOfBirth: 1 } }).toArray()

    const decryptedBirthdays = birthdays.map(b => ({
        firstName: b.firstName ? decryptData(b.firstName) : '',
        lastName: b.lastName ? decryptData(b.lastName) : '',
        dateOfBirth: b.dateOfBirth ? decryptData(b.dateOfBirth) : null,
    })).filter(b => b.dateOfBirth)

    // Sort by month and day, ignoring year
    decryptedBirthdays.sort((a, b) => {
        const dateA = new Date(a.dateOfBirth!)
        const dateB = new Date(b.dateOfBirth!)
        const monthDayA = (dateA.getMonth() + 1) * 100 + dateA.getDate()
        const monthDayB = (dateB.getMonth() + 1) * 100 + dateB.getDate()
        return monthDayA - monthDayB
    })

    return res.status(200).json(decryptedBirthdays)

}

export default withApi(handler, {
    requiredPermissions: ['viewCrewNames'],
    allowWildcardPermission: true,
})