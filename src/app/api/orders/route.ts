import { NextRequest, NextResponse } from "next/server"
import { withUserRateLimit, withCSRFProtection, withAuth, AuthSession, ErrorHandler, ValidationError, BusinessLogicError } from "@/lib"
import { OrderService } from "@/services"
import { z } from "zod"




// src/app/api/orders/route.ts





// POST - Crear nuevo pedido
async function createOrderHandler(request: NextRequest, session: AuthSession) {
  try {
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.log('📦 Creando pedido - Usuario:', {
        id: session.user.id,
        email: session.user.email,
        validated: session.user.validated,
        role: session.user.role
      })
    }
    
    // Aplicar rate limiting para checkout
    const rateLimitResponse = await withUserRateLimit(request, "checkout", session.user.id)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const validatedData = OrderService.validateOrderData(body)

    // Crear pedido usando el servicio (optimizado)
    const order = await OrderService.createOrder(validatedData, session.user)

    // Respuesta optimizada - solo datos esenciales para redirección rápida
    return NextResponse.json({
      message: validatedData.type === "COMPRA" ? "Pedido creado exitosamente" : "Cotización solicitada exitosamente",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt
      }
    }, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/orders")
  }
}

// GET - Obtener pedidos del usuario
async function getOrdersHandler(request: NextRequest, session: AuthSession) {
  try {
    const { searchParams } = new URL(request.url)
    // Extraer y limpiar parámetros
    const rawFilters = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    }

    // Validar con esquema
    const validatedFilters = OrderService.validateOrderFilters(rawFilters)

    // Obtener pedidos usando el servicio
    const result = await OrderService.getUserOrders(session.user.id, validatedFilters)

    return NextResponse.json(result)

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/orders")
  }
}

// Exportar con middleware de autenticación (solo requiere autenticación, no validación)
// Wrapper para mantener la firma correcta de Next.js 15
export async function GET(request: NextRequest, context: { params: Promise<{}> }) {
  const withMiddleware = withAuth(getOrdersHandler, { requireValidated: false })
  return await withMiddleware(request)
}
// Wrapper simplificado - manejo directo sin middlewares complejos
export async function POST(request: NextRequest, context: { params: Promise<{}> }) {
  try {
    // Obtener sesión directamente
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    
    const session = await getServerSession(authOptions)
    
    // Validar autenticación
    if (!session || !session.user) {
      console.error('❌ Usuario no autenticado')
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }
    
    console.log('✅ Sesión válida:', {
      userId: session.user.id,
      email: session.user.email,
      validated: session.user.validated
    })
    
    // Obtener token CSRF (pero no bloquear si falta)
    const csrfToken = request.headers.get("X-CSRF-Token") || request.headers.get("x-csrf-token")
    
    if (!csrfToken) {
      console.warn('⚠️ Token CSRF no presente, pero continuando...')
    }
    
    // Llamar al handler directamente
    return await createOrderHandler(request, session as any)
    
  } catch (error: any) {
    console.error('❌ Error en POST /api/orders:', error)
    
    // Si es error de JWT, dar mensaje específico
    if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
      return NextResponse.json(
        { error: 'Sesión inválida. Por favor, cierra sesión y vuelve a iniciar sesión.' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}