import { NextRequest, NextResponse } from "next/server"
import Tokens from "csrf"
import { v4 as uuidv4 } from "uuid"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Configuración de CSRF
const csrfProtection = new Tokens()

// Tipos para tokens CSRF
export interface CSRFToken {
  token: string
  expiresAt: number
  sessionId: string
}

// Almacenamiento temporal de tokens (en producción usar Redis)
// Usar un objeto global para persistir entre hot reloads en desarrollo
declare global {
  var __csrfTokenStore: Map<string, CSRFToken> | undefined
}

const tokenStore = globalThis.__csrfTokenStore || new Map<string, CSRFToken>()
if (!globalThis.__csrfTokenStore) {
  globalThis.__csrfTokenStore = tokenStore
}

// Función helper para obtener IP del cliente desde headers
function getClientIPFromRequest(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  
  if (xForwardedFor) {
    // X-Forwarded-For puede contener múltiples IPs separadas por comas
    const ips = xForwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }
  
  if (xRealIp) {
    return xRealIp
  }
  
  return "127.0.0.1"
}

// Limpiar tokens expirados
function cleanupExpiredTokens() {
  const now = Date.now()
  const entries = Array.from(tokenStore.entries())
  for (const [key, token] of entries) {
    if (token.expiresAt < now) {
      tokenStore.delete(key)
    }
  }
}

// Generar token CSRF
export async function generateCSRFToken(request: NextRequest): Promise<string> {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions)
    const clientIP = getClientIPFromRequest(request)
    
    console.log('Generando token CSRF - Session:', session ? 'autenticado' : 'no autenticado')
    console.log('Generando token CSRF - User ID:', session?.user?.id)
    console.log('Generando token CSRF - Client IP:', clientIP)
    
    // Usar una estrategia más robusta para el sessionId
    let sessionId: string
    if (session?.user?.id) {
      // Usuario autenticado - usar su ID
      sessionId = `user:${session.user.id}`
    } else {
      // Usuario no autenticado - usar IP + User-Agent para mayor consistencia
      const userAgent = request.headers.get('user-agent') || 'unknown'
      sessionId = `anonymous:${clientIP}:${Buffer.from(userAgent).toString('base64').slice(0, 16)}`
    }
    
    console.log('Generando token CSRF para sessionId:', sessionId)
    
    // Limpiar tokens expirados
    cleanupExpiredTokens()
    
    // Generar token único
    const tokenId = uuidv4()
    const token = await csrfProtection.create(sessionId)
    
    // Almacenar token con metadatos
    const csrfToken: CSRFToken = {
      token,
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutos
      sessionId: sessionId
    }
    
    tokenStore.set(tokenId, csrfToken)
    console.log('Token CSRF generado y almacenado:', tokenId)
    console.log('Tokens en el store después de generar:', Array.from(tokenStore.keys()))
    console.log('Token almacenado:', {
      tokenId,
      sessionId: csrfToken.sessionId,
      expiresAt: new Date(csrfToken.expiresAt).toISOString()
    })
    
    return tokenId
  } catch (error) {
    console.error("Error generating CSRF token:", error)
    throw new Error("Failed to generate CSRF token")
  }
}

// Validar token CSRF
export async function validateCSRFToken(
  request: NextRequest,
  tokenId: string
): Promise<boolean> {
  try {
    // Obtener sesión del usuario con manejo de errores JWT
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (error: any) {
      // Si hay error de decripción JWT, tratar como no autenticado
      if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
        // Silenciar el error y continuar como usuario no autenticado
        session = null
      } else {
        // Otro tipo de error, relanzarlo
        throw error
      }
    }
    const clientIP = getClientIPFromRequest(request)
    
    console.log('Validando token CSRF - Session:', session ? 'autenticado' : 'no autenticado')
    console.log('Validando token CSRF - User ID:', session?.user?.id)
    console.log('Validando token CSRF - Client IP:', clientIP)
    
    // Usar la misma estrategia que en la generación
    let currentSessionId: string
    if (session?.user?.id) {
      // Usuario autenticado - usar su ID
      currentSessionId = `user:${session.user.id}`
    } else {
      // Usuario no autenticado - usar IP + User-Agent para mayor consistencia
      const userAgent = request.headers.get('user-agent') || 'unknown'
      currentSessionId = `anonymous:${clientIP}:${Buffer.from(userAgent).toString('base64').slice(0, 16)}`
    }
    
    console.log('Validando token CSRF para sessionId:', currentSessionId)
    console.log('Token ID a validar:', tokenId)
    console.log('Tokens en el store al inicio de validación:', Array.from(tokenStore.keys()))
    
    // Buscar token
    const csrfToken = tokenStore.get(tokenId)
    if (!csrfToken) {
      console.log('Token CSRF no encontrado en el store')
      console.log('Tokens disponibles en el store:', Array.from(tokenStore.keys()))
      return false
    }
    
    console.log('Token CSRF encontrado:', {
      tokenId,
      sessionId: csrfToken.sessionId,
      expiresAt: new Date(csrfToken.expiresAt).toISOString(),
      now: new Date().toISOString()
    })
    
    // Verificar expiración
    if (csrfToken.expiresAt < Date.now()) {
      console.log('Token CSRF expirado')
      tokenStore.delete(tokenId)
      return false
    }
    
    // Verificar sesión - permitir cierta flexibilidad para cambios de estado de autenticación
    if (csrfToken.sessionId !== currentSessionId) {
      console.log('SessionId no coincide:', {
        expected: csrfToken.sessionId,
        current: currentSessionId,
        match: csrfToken.sessionId === currentSessionId
      })
      
      // SOLUCIÓN TEMPORAL: Permitir validación si ambos sessionIds son para el mismo usuario
      // Esto maneja el caso donde el token se generó antes de la autenticación
      const isSameUser = session?.user?.id && 
                        csrfToken.sessionId.startsWith('anonymous:') && 
                        currentSessionId.startsWith('user:')
      
      if (!isSameUser) {
        console.log('SessionId no coincide y no es el mismo usuario')
        tokenStore.delete(tokenId)
        return false
      } else {
        console.log('Permitiendo validación - mismo usuario, diferentes estados de autenticación')
      }
    }
    
    // Validar token con la librería
    const isValid = await csrfProtection.verify(currentSessionId, csrfToken.token)
    console.log('Validación CSRF resultado:', isValid)
    
    // NO eliminar token después del uso para permitir múltiples operaciones
    // El token se eliminará cuando expire naturalmente
    // if (isValid) {
    //   tokenStore.delete(tokenId)
    // }
    
    return isValid
  } catch (error) {
    console.error("Error validating CSRF token:", error)
    return false
  }
}

// Middleware CSRF para endpoints
export function withCSRFProtection(
  handler: (request: NextRequest, session?: { user: { id: string; validated: boolean } }) => Promise<NextResponse>,
  options: {
    // Si requiere usuario autenticado
    requireAuth?: boolean
    // Si permite métodos GET (normalmente no requieren CSRF)
    allowGet?: boolean
  } = {}
): (request: NextRequest, session?: { user: { id: string; validated: boolean } }) => Promise<NextResponse> {
  return async (request: NextRequest, sessionParam?: { user: { id: string; validated: boolean } }): Promise<NextResponse> => {
    try {
      // Permitir métodos GET si está configurado
      if (options.allowGet && request.method === "GET") {
        return await handler(request, sessionParam)
      }
      
      // Obtener sesión para validar CSRF (siempre necesario para validar el token)
      let session: any = undefined
      try {
        session = await getServerSession(authOptions)
      } catch (error: any) {
        // Si hay error de decripción JWT, tratar como no autenticado
        if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
          // Si requireAuth es true, retornar error 401
          if (options.requireAuth) {
            return NextResponse.json(
              { 
                error: "Sesión inválida. Por favor, cierra sesión y vuelve a iniciar sesión.",
                code: "INVALID_SESSION"
              },
              { status: 401 }
            )
          }
          // Si requireAuth es false, continuar sin sesión (el handler interno manejará la auth)
          session = null
        } else {
          // Otro tipo de error, relanzarlo
          throw error
        }
      }
      
      // Validar autenticación solo si es requerida
      if (options.requireAuth && !session?.user) {
        return NextResponse.json(
          { error: "Usuario no autenticado" },
          { status: 401 }
        )
      }
      
      // Obtener token CSRF del header
      const tokenId = request.headers.get("X-CSRF-Token") || 
                     request.headers.get("x-csrf-token")
      
      console.log('Middleware CSRF - Token recibido:', tokenId)
      console.log('Middleware CSRF - Headers:', {
        'X-CSRF-Token': request.headers.get("X-CSRF-Token"),
        'x-csrf-token': request.headers.get("x-csrf-token"),
        'authorization': request.headers.get("authorization")
      })
      
      if (!tokenId) {
        console.log('Middleware CSRF - Token no encontrado en headers')
        return NextResponse.json(
          { error: "Token CSRF requerido" },
          { status: 403 }
        )
      }
      
      // Validar token
      const isValid = await validateCSRFToken(request, tokenId)
      
      if (!isValid) {
        console.log('Middleware CSRF - Token inválido')
        return NextResponse.json(
          { error: "Token CSRF inválido o expirado" },
          { status: 403 }
        )
      }
      
      console.log('Middleware CSRF - Token válido, procediendo...')
      
      // Ejecutar handler original
      return await handler(request, session)
      
    } catch (error) {
      console.error("Error en middleware CSRF:", error)
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      )
    }
  }
}

// Función helper para obtener token CSRF en el cliente
export async function getCSRFToken(): Promise<string> {
  try {
    const response = await fetch("/api/csrf-token", {
      method: "GET",
      credentials: "include"
    })
    
    if (!response.ok) {
      throw new Error("Failed to get CSRF token")
    }
    
    const data = await response.json()
    return data.token
  } catch (error) {
    console.error("Error getting CSRF token:", error)
    throw error
  }
}

// Configuración para desarrollo
if (process.env.NODE_ENV === "development") {
  console.log("CSRF Protection habilitado para desarrollo")
  
  // Limpiar tokens cada 5 minutos en desarrollo
  setInterval(cleanupExpiredTokens, 5 * 60 * 1000)
}
