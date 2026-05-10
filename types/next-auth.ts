import { type DefaultSession, type DefaultUser } from "next-auth"
import { type JWT as DefaultJWT } from "next-auth/jwt"

type CrewType = "internal" | "external"

declare module "next-auth" {
  interface User extends DefaultUser {
    type?: CrewType
    firstName?: string
    lastName?: string
    uuid?: string
    roleUuid?: string
    mustChangePassword?: boolean
    permissions?: string[]
  }

  interface Session {
    user: {
      type?: CrewType
      firstName?: string
      lastName?: string
      mustChangePassword?: boolean
      permissions?: string[]
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    type?: CrewType
    firstName?: string
    lastName?: string
    uuid?: string
    roleUuid?: string
    mustChangePassword?: boolean
    permissions?: string[]
  }
}
