import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withApiRateLimit, initializeRateLimiterForDevelopment } from '@/lib/rateLimiter'

// Rutas que requieren rate limiting
const protectedRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/orders',
  '/api/cart',
  '/api/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Inicializar rate limiter solo cuando se necesite (lazy loading)
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Para rutas de autenticación específicas, usar sus propios limiters
    if (pathname.startsWith('/api/auth/')) {
      // Inicializar rate limiter para desarrollo si es necesario
      if (process.env.NODE_ENV === 'development') {
        initializeRateLimiterForDevelopment()
      }
      return NextResponse.next()
    }

    // Para otras rutas API, aplicar rate limiting general
    const rateLimitResponse = await withApiRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
