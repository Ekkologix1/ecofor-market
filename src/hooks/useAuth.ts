"use client"
// ============================================
// CUSTOM HOOK: useAuth
// Centraliza toda la lógica de autenticación y roles
// ============================================


import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ROUTES, USER_ROLES, USER_TYPES } from '@/lib/constants/dashboard'
// Definir tipo de sesión extendido para el hook
interface ExtendedUserSession {
  id: string
  name: string
  email: string
  type: string
  role: string
  validated: boolean
  user?: {
    id: string
    name: string
    email: string
    type: string
    role: string
    validated: boolean
  }
}
// Logger simple para el cliente
const clientLogger = {
  authStatus: (status: string, isAuthenticated: boolean, email?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] Status: ${status}, Authenticated: ${isAuthenticated}, Email: ${email || 'N/A'}`)
    }
  }
}

interface SessionUser {
  id: string
  name: string | null | undefined
  email: string | null | undefined
  role: string | undefined
  type: string | undefined
  validated: boolean | undefined
}

interface UseAuthReturn {
  session: ExtendedUserSession | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
  isAdmin: boolean
  isVendedor: boolean
  isUser: boolean
  isEmpresa: boolean
  isNatural: boolean
  isValidated: boolean
  userRole: string | undefined
  userType: string | undefined
  userName: string | null | undefined  // Acepta null
  userEmail: string | null | undefined  // Acepta null
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const router = useRouter()

  clientLogger.authStatus(status, !!session, session?.user?.email || undefined)

  // No redirigir automáticamente - dejar que cada página maneje su propia protección

  // Computar valores derivados
  const userRole = session?.user?.role
  const userType = session?.user?.type
  
  const isAdmin = userRole === USER_ROLES.ADMIN
  const isVendedor = userRole === USER_ROLES.VENDEDOR
  const isUser = userRole === USER_ROLES.USER
  
  const isEmpresa = userType === USER_TYPES.EMPRESA
  const isNatural = userType === USER_TYPES.NATURAL
  
  const isValidated = session?.user?.validated || false

  return {
    session: session as ExtendedUserSession | null,
    status,
    isLoading: status === 'loading',
    isAdmin,
    isVendedor,
    isUser,
    isEmpresa,
    isNatural,
    isValidated,
    userRole,
    userType,
    userName: session?.user?.name,
    userEmail: session?.user?.email,
  }
}