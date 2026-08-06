import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      roleType?: string | null
      salonId?: string | null
      permissions?: string[]
      ownerName?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    roleType?: string | null
    salonId?: string | null
    permissions?: string[]
    ownerName?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    roleType?: string | null
    salonId?: string | null
    permissions?: string[]
    ownerName?: string | null
  }
}
