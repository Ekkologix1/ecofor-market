import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      type: "NATURAL" | "EMPRESA"
      role: "USER" | "ADMIN" | "VENDEDOR"
      validated: boolean
    } & DefaultSession["user"]
  }

  interface User {
    type: "NATURAL" | "EMPRESA"
    role: "USER" | "ADMIN" | "VENDEDOR"
    validated: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    type: "NATURAL" | "EMPRESA"
    role: "USER" | "ADMIN" | "VENDEDOR"
    validated: boolean
  }
}

// UserSession interface for services
export interface UserSession {
  id: string
  type: "NATURAL" | "EMPRESA"
}