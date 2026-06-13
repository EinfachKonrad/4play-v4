import { withApi, getUidFromQuery } from '@/lib/middleware';
import clientPromise from '@/lib/mongodb';
import { compare, hash } from 'bcryptjs';
import { NextApiResponse } from 'next';
import crypto from 'crypto';

async function genNumericPassword(len = 12) {
  let s = '';
  while (s.length < len) s += String(crypto.randomInt(0, 10));
  return s.slice(0, len);
}

async function handler(req: any, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const targetUid = getUidFromQuery(req.query.uid);
  const { adminPassword } = req.body ?? {};
  if (!adminPassword) return res.status(400).json({ error: 'adminPassword is required' });

  try {
    const client = await clientPromise;
    const db = client.db('settings');

    // Verify admin password against the session user record
    const adminUid = req.user?.uid;
    if (!adminUid) return res.status(401).json({ error: 'Unauthorized' });

    const admin = await db.collection('crewmembers').findOne({ uid: adminUid });
    if (!admin || !admin.passwordHash) return res.status(403).json({ error: 'Admin account invalid' });

    const ok = await compare(adminPassword, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Admin password incorrect' });

    // Find target member
    const member = await db.collection('crewmembers').findOne({ uid: targetUid });
    if (!member) return res.status(404).json({ error: 'Crew member not found' });

    // Generate temporary numeric password
    const tempPassword = await genNumericPassword(12);
    const tempHash = await hash(tempPassword, 12);

    // Update target passwordHash and set mustChangePassword
    await db.collection('crewmembers').updateOne({ uid: targetUid }, { $set: { passwordHash: tempHash, mustChangePassword: true } });

    // Write audit log
    await db.collection('auditLogs').insertOne({
      actorUid: adminUid,
      action: 'resetPassword',
      targetUid,
      ts: new Date(),
    });

    // Return the temporary password (only once)
    return res.status(200).json({ success: true, tempPassword });

  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}

export default withApi(handler, { requiredPermissions: ['viewCrewMembers', 'manageCrewMembers'] });
