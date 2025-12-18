import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Tipos para roles de usuario
export type UserRole = "USER" | "ADMIN" | "VENDEDOR"

// Tipos para tipos de usuario
export type UserType = "NATURAL" | "EMPRESA"

// Interfaz para sesión de usuario
export interface AuthUser {
  id: string
  email: string
  name: string
  type: UserType
  role: UserRole
  validated: boolean
}

// Interfaz para sesión extendida
export interface AuthSession {
  user: AuthUser
}

// Opciones de configuración para el middleware
export interface AuthMiddlewareOptions {
  // Si requiere que el usuario esté validado
  requireValidated?: boolean
  // Roles permitidos (si no se especifica, permite cualquier rol)
  allowedRoles?: UserRole[]
  // Tipos de usuario permitidos (si no se especifica, permite cualquier tipo)
  allowedTypes?: UserType[]
  // Si requiere autenticación básica (solo sesión válida)
  requireAuth?: boolean
}

// Respuestas de error estandarizadas
export const AuthErrors = {
  UNAUTHORIZED: {
    error: "Usuario no autorizado",
    status: 401
  },
  NOT_VALIDATED: {
    error: "Usuario no validado. Contacta al administrador para activar tu cuenta.",
    status: 403
  },
  INSUFFICIENT_ROLE: {
    error: "No tienes permisos suficientes para realizar esta acción",
    status: 403
  },
  INVALID_USER_TYPE: {
    error: "Tipo de usuario no válido para esta operación",
    status: 403
  }
} as const

/**
 * Middleware de autenticación y autorización
 * Proporciona validación consistente para todas las rutas protegidas
 */
export function withAuth(
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Obtener sesión con manejo de errores JWT
      let session
      try {
        session = await getServerSession(authOptions)
      } catch (error: any) {
        // Si hay error de decripción JWT (token inválido), tratar como no autenticado
        if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
          // Solo loguear en desarrollo y no saturar la consola
          if (process.env.NODE_ENV === "development") {
            console.warn('⚠️  Token JWT inválido detectado. Limpia las cookies del navegador.')
          }
          // Retornar error 401 en lugar de 500
          if (options.requireAuth !== false) {
            return NextResponse.json(
              { 
                error: "Sesión inválida. Por favor, cierra sesión y vuelve a iniciar sesión.",
                code: "INVALID_SESSION"
              },
              { status: 401 }
            )
          }
          // Si no requiere auth, continuar con session = null
          session = null
        } else {
          // Otro tipo de error, relanzarlo
          throw error
        }
      }

      // 2. Validar autenticación básica
      if (options.requireAuth !== false) {
        if (!session?.user) {
          return NextResponse.json(
            AuthErrors.UNAUTHORIZED,
            { status: AuthErrors.UNAUTHORIZED.status }
          )
        }
      }

      // 3. Validar que el usuario esté validado
      if (options.requireValidated !== false) {
        if (!session?.user?.validated) {
          return NextResponse.json(
            AuthErrors.NOT_VALIDATED,
            { status: AuthErrors.NOT_VALIDATED.status }
          )
        }
      }

      // 4. Validar roles permitidos
      if (options.allowedRoles && options.allowedRoles.length > 0) {
        if (!session?.user?.role || !options.allowedRoles.includes(session.user.role)) {
          return NextResponse.json(
            AuthErrors.INSUFFICIENT_ROLE,
            { status: AuthErrors.INSUFFICIENT_ROLE.status }
          )
        }
      }

      // 5. Validar tipos de usuario permitidos
      if (options.allowedTypes && options.allowedTypes.length > 0) {
        if (!session?.user?.type || !options.allowedTypes.includes(session.user.type)) {
          return NextResponse.json(
            AuthErrors.INVALID_USER_TYPE,
            { status: AuthErrors.INVALID_USER_TYPE.status }
          )
        }
      }

      // 6. Ejecutar el handler original con la sesión validada
      return await handler(request, session as AuthSession)

    } catch (error) {
      console.error("Error en middleware de autenticación:", error)
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware para rutas que solo requieren autenticación básica
 * (sin validación de usuario)
 */
export function withBasicAuth(
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>
) {
  return withAuth(handler, { requireValidated: false })
}

/**
 * Middleware para rutas de administrador
 * Requiere rol ADMIN
 */
export function withAdminAuth(
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: ["ADMIN"] })
}

/**
 * Middleware para rutas de administrador y vendedor
 * Requiere rol ADMIN o VENDEDOR
 */
export function withStaffAuth(
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: ["ADMIN", "VENDEDOR"] })
}

/**
 * Middleware para rutas de usuario normal
 * Requiere rol USER
 */
export function withUserAuth(
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: ["USER"] })
}

/**
 * Middleware para rutas que requieren empresas
 * Requiere tipo EMPRESA
 */
export function withEmpresaAuth(
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedTypes: ["EMPRESA"] })
}

/**
 * Función helper para obtener sesión de forma segura (maneja errores JWT)
 * Útil para casos donde necesitas obtener la sesión sin middleware
 */
export async function getSafeSession(): Promise<{
  session: AuthSession | null
  error: Error | null
}> {
  try {
    const session = await getServerSession(authOptions)
    return {
      session: session as AuthSession | null,
      error: null
    }
  } catch (error: any) {
    // Si hay error de decripción JWT, retornar null sin error
    if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
      if (process.env.NODE_ENV === "development") {
        console.warn('⚠️  Token JWT inválido en getSafeSession. Limpia las cookies del navegador.')
      }
      return {
        session: null,
        error: null // No es un error crítico, solo sesión inválida
      }
    }
    // Otro tipo de error, retornarlo
    return {
      session: null,
      error: error
    }
  }
}

/**
 * Función helper para obtener información de sesión sin middleware
 * Útil para casos donde necesitas validación manual
 */
export async function getValidatedSession(options: AuthMiddlewareOptions = {}): Promise<{
  session: AuthSession | null
  error: NextResponse | null
}> {
  try {
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (error: any) {
      // Si hay error de decripción JWT (token inválido), tratar como no autenticado
      if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
        console.warn('⚠️  Token JWT inválido detectado en getValidatedSession.')
        // Retornar error 401
        if (options.requireAuth !== false) {
          return {
            session: null,
            error: NextResponse.json(
              { 
                error: "Sesión inválida. Por favor, cierra sesión y vuelve a iniciar sesión.",
                code: "INVALID_SESSION"
              },
              { status: 401 }
            )
          }
        }
        // Si no requiere auth, continuar con session = null
        session = null
      } else {
        // Otro tipo de error, relanzarlo
        throw error
      }
    }

    // Validar autenticación básica
    if (options.requireAuth !== false) {
      if (!session?.user) {
        return {
          session: null,
          error: NextResponse.json(
            AuthErrors.UNAUTHORIZED,
            { status: AuthErrors.UNAUTHORIZED.status }
          )
        }
      }
    }

    // Validar que el usuario esté validado
    if (options.requireValidated !== false) {
      if (!session?.user?.validated) {
        return {
          session: null,
          error: NextResponse.json(
            AuthErrors.NOT_VALIDATED,
            { status: AuthErrors.NOT_VALIDATED.status }
          )
        }
      }
    }

    // Validar roles permitidos
    if (options.allowedRoles && options.allowedRoles.length > 0) {
      if (!session?.user?.role || !options.allowedRoles.includes(session.user.role)) {
        return {
          session: null,
          error: NextResponse.json(
            AuthErrors.INSUFFICIENT_ROLE,
            { status: AuthErrors.INSUFFICIENT_ROLE.status }
          )
        }
      }
    }

    // Validar tipos de usuario permitidos
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      if (!session?.user?.type || !options.allowedTypes.includes(session.user.type)) {
        return {
          session: null,
          error: NextResponse.json(
            AuthErrors.INVALID_USER_TYPE,
            { status: AuthErrors.INVALID_USER_TYPE.status }
          )
        }
      }
    }

    return {
      session: session as AuthSession,
      error: null
    }

  } catch (error) {
    console.error("Error obteniendo sesión validada:", error)
    return {
      session: null,
      error: NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      )
    }
  }
}
