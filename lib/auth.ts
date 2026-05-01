import { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '../pages/api/auth/[...nextauth]'

export async function getSession(req: NextApiRequest, res: NextApiResponse) {
  return await auth(req, res)
}

export function withApiAuthRequired(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession(req, res)

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    return handler(req, res)
  }
}
