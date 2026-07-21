import { ApiRequest, withApi } from "@/lib/middleware";
import clientPromise from "@/lib/mongodb";
import { encryptData } from "@/lib/encryprion";
import CrewMember from "@/types/crewMember";
import { compare, hash } from "bcryptjs";
import { NextApiResponse } from "next";

// POST /api/settings/crew/crewmember/password?uid=crewmemberUuid
// Body: { currentPassword: string, newPassword: string }

function normalizeUid(value: string | undefined): string | undefined {
    if (!value) {
        return undefined
    }

    const trimmed = value.trim()
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
        return undefined
    }

    return trimmed
}

function normalizeEmail(value: string | undefined): string | undefined {
    if (!value) {
        return undefined
    }

    const trimmed = value.trim().toLowerCase()
    return trimmed || undefined
}

async function handler(req: ApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { currentPassword, newPassword } = req.body
        const rawUid = typeof req.query.uid === 'string'
            ? req.query.uid
            : Array.isArray(req.query.uid)
                ? req.query.uid[0]
                : undefined
        const uid = normalizeUid(rawUid) ?? normalizeUid(req.user?.uid)
        const email = normalizeEmail(req.user?.email)

        if (!uid && !email) {
            return res.status(400).json({ error: 'uid is required' })
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' })
        }

        // Call the function to change the password
        try {
            const client = await clientPromise
            const db = client.db('settings')
            let member: CrewMember | null = null

            if (uid) {
                const encryptedUid = encryptData(uid)
                member = await db.collection<CrewMember>('crewmembers').findOne({ uid: encryptedUid })
                if (!member) {
                    member = await db.collection<CrewMember>('crewmembers').findOne({ uid })
                }
            }

            if (!member && email) {
                const encryptedEmail = encryptData(email)
                member = await db.collection<CrewMember>('crewmembers').findOne({ email: encryptedEmail })
                if (!member) {
                    member = await db.collection<CrewMember>('crewmembers').findOne({ email })
                }
            }

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
            await db.collection<CrewMember>('crewmembers').updateOne(
                { uid: member.uid },
                { $set: { passwordHash: newPasswordHash, mustChangePassword: false } }
            )
            return res.status(200).json({ message: 'Password changed successfully' })
        } catch (error) {
            return res.status(400).json({ error: error instanceof Error ? error.message : 'An error occurred' })
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' })
    }
}

export default withApi(handler, {})
