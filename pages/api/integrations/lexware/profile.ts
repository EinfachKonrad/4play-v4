import { NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'
import Company from '@/types/settings/branding'
import { decryptData, encryptData } from '@/lib/encryprion'
import {
    ApiRequest,
    BadRequestError,
    NotFoundError,
    requireMethod,
    withApi,
    getUidFromQuery,
} from '@/lib/middleware'

// GET /api/integrations/lexware/profile?uid=brandingUid
// --> 200: { organizationId, brandingName, taxType, smallBusiness }
// --> 404: { error: "Company configuration not found" }
// --> 400: { error: "Lexware integration is not enabled for this branding" }
// --> 400: { error: "API key for Lexware integration is not set" }
// --> 500: { error: "Failed to fetch Lexware profile" }
// --> 500: { error: "Internal server error" }

async function fetchLexwareProfile(apiKey: string) {
    try {
        const response = await fetch('https://api.lexware.io/v1/profile', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                "Accept": "application/json"
            }
            })
        if (!response.ok) {
            throw new Error(`Lexware API responded with status ${response.status}`)
        }
        const data = await response.json()
        return {
            organizationId: data.organizationId,
            companyName: data.companyName,
            taxType: data.taxType,
            smallBusiness: data.smallBusiness
        }
    } catch (error) {
        console.error('Error fetching Lexware profile:', error)
        throw new Error('Failed to fetch Lexware profile')
    }
}



async function handler(req: ApiRequest, res: NextApiResponse) {
    requireMethod(req, res, ['GET'])

    try {
        const uid = getUidFromQuery(req.query.uid)
        const client = await clientPromise
        const db = client.db('settings')
        const branding = await db.collection<Company>('brandings').findOne({ uid: encryptData(uid) })

        if (!branding) {
            throw new NotFoundError('Company configuration not found')
        }

        if (!branding.integrations.lexware.enabled) {
            throw new BadRequestError('Lexware integration is not enabled for this branding')
        }

        if (!branding.integrations.lexware.apiKey) {
            throw new BadRequestError('API key for Lexware integration is not set')
        }

        const profile = await fetchLexwareProfile(decryptData(branding.integrations.lexware.apiKey))
        return res.status(200).json(profile)
    } catch (error) {
        console.error('[lexwareIntegration] Failed to fetch Lexware profile:', error)
        throw error
    }
}

export default withApi(handler, {
    requiredPermissions: ['useLexwareIntegration', 'accessCompanySettings'],
    allowWildcardPermission: true,
})