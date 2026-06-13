import { ApiRequest, withApi } from "@/lib/middleware";
import clientPromise from "@/lib/mongodb";
import CrewMember from "@/types/crewMember";
import { compare, hash } from "bcryptjs";
import { NextApiResponse } from "next";

// POST /api/settings/crew/crewmember/password?uid=crewmemberUuid
// Body: { currentPassword: string, newPassword: string }

async function handler(req: ApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { currentPassword, newPassword } = req.body
        const { uid } = req.query

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' })
        }

        // Call the function to change the password
        try {
            const client = await clientPromise
            const db = client.db('settings')
            const member = await db.collection<CrewMember>('crewmembers').findOne({ uid: uid })
            if (!member || !member.passwordHash) {
                return res.status(404).json({ error: 'Crew member not found' })
            }
            // Verify current password
            const isCurrentPasswordValid = await compare(currentPassword, member.passwordHash)
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ error: 'Current password is incorrect' })
            }
            // Update password
            const newPasswordHash = await hash(newPassword, 12)
            await db.collection<CrewMember>('crewmembers').updateOne({ uid: uid }, { $set: { passwordHash: newPasswordHash, mustChangePassword: false } })
            return res.status(200).json({ message: 'Password changed successfully' })
        } catch (error) {
            return res.status(400).json({ error: error instanceof Error ? error.message : 'An error occurred' })
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' })
    }
}

export default withApi(handler, {})
