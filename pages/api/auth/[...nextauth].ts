import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { compare } from "bcryptjs"
import type { NextApiRequest, NextApiResponse } from "next"
import { NextRequest } from "next/server.js"

import clientPromise from "../../../lib/mongodb"
import { decryptData, encryptData } from "../../../hooks/useEncryprion"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailRaw = typeof credentials?.email === "string" ? credentials.email : ""
        const password = typeof credentials?.password === "string" ? credentials.password : ""
        const email = emailRaw.trim().toLowerCase()

        if (!email || !password) {
          return null
        }

        const client = await clientPromise
        const userPromise = client
          .db("settings")
          .collection("crewmembers")
          .findOne({ email: encryptData(email) })

        const [user] = await Promise.all([
          userPromise,
        ])

        if (!user || typeof user.passwordHash !== "string") {
          return null
        }

        const isValid = await compare(password, user.passwordHash)

        if (!isValid) {
          return null
        }

        console.log('[NextAuth] User from DB:', {
          email,
          uuid: user.uuid,
          role: user.roleUuid,
          mustChangePassword: user.mustChangePassword
        })

        return {
          id: user._id.toString(),
          email,
          type: typeof user.type === "string" ? decryptData(user.type) : user.type,
          firstName: typeof user.firstName === "string" ? decryptData(user.firstName) : user.firstName,
          lastName: typeof user.lastName === "string" ? decryptData(user.lastName) : user.lastName,
          uuid: typeof user.uuid === "string" ? decryptData(user.uuid) : user.uuid,
          roleUuid: typeof user.roleUuid === "string" ? decryptData(user.roleUuid) : "crew",
          mustChangePassword: user.mustChangePassword || false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add UUID, role, and mustChangePassword to token when user signs in
      if (user) {
        token.type = user.type
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.uuid = user.uuid
        token.roleUuid = user.roleUuid
        token.mustChangePassword = user.mustChangePassword
        console.log('[NextAuth JWT] Token updated:', {
          type: token.type,
          firstName: token.firstName,
          lastName: token.lastName,
          uuid: token.uuid,
          roleUuid: token.roleUuid,
          mustChangePassword: token.mustChangePassword
        })
      }
      return token
    },
    async session({ session, token }) {
      // Add UUID, role, and mustChangePassword to session
      if (session?.user) {
        session.user.type = token.type
        session.user.firstName = token.firstName
        session.user.lastName = token.lastName
        session.user.uuid = token.uuid
        session.user.roleUuid = token.roleUuid
        session.user.mustChangePassword = token.mustChangePassword ?? false
        // Always fetch fresh mustChangePassword value from DB to ensure it's up-to-date
        // This is important after password changes
        if (typeof token.uuid === "string" && token.uuid.length > 0) {
          try {
            const client = await clientPromise
            const user = await client.db("settings").collection("crewmembers").findOne({ uuid: encryptData(token.uuid) })
            
            if (user) {
              session.user.mustChangePassword = user.mustChangePassword || false
            } else {
              session.user.mustChangePassword = false
            }
          } catch (error: unknown) {
            // eslint-disable-next-line no-console
            ;(console.error as any)('[NextAuth Session] Error fetching mustChangePassword:', error)
            session.user.mustChangePassword = false
          }
        } else {
          session.user.mustChangePassword = false
        }
        
        console.log('[NextAuth Session] Session updated:', {
          email: session.user.email,
          type: session.user.type,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          uuid: session.user.uuid,
          roleUuid: session.user.roleUuid,
          mustChangePassword: session.user.mustChangePassword
        })
      }
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
})

// Pages Router adapter: convert Node.js req/res to Web API Request/Response
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { GET, POST } = handlers
  const handlerFn = req.method === "POST" ? POST : GET

  const protocol = (req.headers["x-forwarded-proto"] as string | undefined) ?? "http"
  const host = req.headers.host ?? "localhost"
  const url = new URL(req.url!, `${protocol}://${host}`)

  const webHeaders = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value) continue
    if (Array.isArray(value)) {
      value.forEach((v) => webHeaders.append(key, v))
    } else {
      webHeaders.set(key, value)
    }
  }

  // Disable body auto-parsing: we stream the raw body so NextAuth can read it
  const chunks: Buffer[] = []
  for await (const chunk of req as unknown as AsyncIterable<Buffer>) {
    chunks.push(chunk)
  }
  const rawBody = Buffer.concat(chunks)

  const request = new NextRequest(url.toString(), {
    method: req.method,
    headers: webHeaders,
    body: rawBody.length > 0 ? rawBody : undefined,
  })

  const response = await handlerFn(request as Parameters<typeof handlerFn>[0])

  res.status(response.status)
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      res.appendHeader("set-cookie", value)
    } else {
      res.setHeader(key, value)
    }
  })
  res.end(Buffer.from(await response.arrayBuffer()))
}

// Tell Next.js not to parse the body — we do it manually above
export const config = {
  api: {
    bodyParser: false,
  },
}
