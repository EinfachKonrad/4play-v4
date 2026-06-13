import { type DefaultSession } from "next-auth"
import { type JWT as DefaultJWT } from "next-auth/jwt"
import type { User as DefaultUser } from "next-auth"

type CrewType = "internal" | "external"

declare module "next-auth" {
  interface User {
    type?: CrewType
    firstName?: string
    lastName?: string
    uid?: string
    roleUid?: string
    mustChangePassword?: boolean
    permissions?: string[]
  }

  interface Session {
    user: {
      type?: CrewType
      firstName?: string
      lastName?: string
      uid?: string
      roleUid?: string
      mustChangePassword?: boolean
      permissions?: string[]
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    type?: CrewType
    firstName?: string
    lastName?: string
    uid?: string
    roleUid?: string
    mustChangePassword?: boolean
    permissions?: string[]
  }
}
