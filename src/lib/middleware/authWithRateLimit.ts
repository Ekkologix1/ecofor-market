import { NextRequest, NextResponse } from "next/server"
import { withAuth, AuthSession, AuthMiddlewareOptions } from "./auth"
import { withUserRateLimit } from "@/lib/rateLimiter"

/**
 * Middleware que combina autenticación y rate limiting
 * Aplica rate limiting basado en el usuario autenticado
 */
export function withAuthAndRateLimit(
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>,
  rateLimitType: "checkout" | "upload" | "api",
  options: AuthMiddlewareOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Primero aplicar autenticación
      const authHandler = withAuth(handler, options)
      const authResponse = await authHandler(request)
      
      // Si hay error de autenticación, retornarlo
      if (authResponse.status !== 200) {
        return authResponse
      }

      // 2. Obtener la sesión para aplicar rate limiting
      const { getValidatedSession } = await import("./auth")
      const { session, error } = await getValidatedSession(options)
      
      if (error || !session) {
        return error || NextResponse.json(
          { error: "Error de autenticación" },
          { status: 401 }
        )
      }

      // 3. Aplicar rate limiting basado en el tipo
      let rateLimitResponse: NextResponse | null = null
      
      if (rateLimitType === "checkout" || rateLimitType === "upload") {
        rateLimitResponse = await withUserRateLimit(request, rateLimitType, session.user.id)
      } else if (rateLimitType === "api") {
        const { withApiRateLimit } = await import("@/lib/rateLimiter")
        rateLimitResponse = await withApiRateLimit(request)
      }

      if (rateLimitResponse) {
        return rateLimitResponse
      }

      // 4. Si todo está bien, ejecutar el handler original
      return await handler(request, session)

    } catch (error) {
      console.error("Error en middleware de autenticación con rate limiting:", error)
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware específico para endpoints de carrito con rate limiting
 * En desarrollo, no aplica rate limiting para el carrito
 */
export function withCartRateLimit(
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // En desarrollo, solo aplicar autenticación sin rate limiting
      if (process.env.NODE_ENV === "development") {
        const authHandler = withAuth(handler, options)
        return await authHandler(request)
      }
      
      // En producción, aplicar rate limiting de API (más permisivo que checkout)
      return withAuthAndRateLimit(handler, "api", options)(request)
    } catch (error) {
      console.error("Error en middleware de carrito:", error)
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware específico para endpoints de upload con rate limiting
 */
export function withUploadRateLimit(
  handler: (request: NextRequest, session: AuthSession) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return withAuthAndRateLimit(handler, "upload", options)
}
