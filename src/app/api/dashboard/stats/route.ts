import { prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { withBasicAuth, AuthSession } from "@/lib/middleware/auth"



// src/app/api/dashboard/stats/route.ts




async function getDashboardStatsHandler(request: NextRequest, session: AuthSession) {
  // Dashboard stats API called
  
  try {
    // Ejecutar todas las consultas en paralelo para mayor velocidad
    const [activeOrdersCount, pendingQuotesCount, totalOrders] = await Promise.all([
      // Contar pedidos activos (no finalizados)
      // Estados activos: RECIBIDO, VALIDANDO, APROBADO, PREPARANDO, LISTO, EN_RUTA, EN_ESPERA
      // Estados finales: ENTREGADO, CANCELADO, RECHAZADO
      prisma.order.count({
        where: {
          userId: session.user.id,
          type: "COMPRA",
          status: {
            notIn: ["ENTREGADO", "CANCELADO", "RECHAZADO"]
          }
        }
      }),

      // Contar cotizaciones pendientes
      prisma.order.count({
        where: {
          userId: session.user.id,
          type: "COTIZACION",
          status: {
            notIn: ["ENTREGADO", "CANCELADO", "RECHAZADO"]
          }
        }
      }),

      // Contar total de pedidos
      prisma.order.count({
        where: {
          userId: session.user.id
        }
      })
    ])

    // Obtener el pedido más reciente
    const lastOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        orderNumber: true,
        status: true,
        createdAt: true,
        total: true
      }
    })

    const response = NextResponse.json({
      activeOrders: activeOrdersCount,
      pendingQuotes: pendingQuotesCount,
      totalOrders: totalOrders,
      lastOrder: lastOrder ? {
        orderNumber: lastOrder.orderNumber,
        status: lastOrder.status,
        createdAt: lastOrder.createdAt.toISOString(),
        total: Number(lastOrder.total)
      } : null
    })

    // Headers de caché para optimización
    response.headers.set('Cache-Control', 'private, max-age=300') // 5 minutos
    response.headers.set('ETag', `"${session.user.id}-${Date.now()}"`)
    
    return response

  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: session?.user?.id
    })
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function GET(request: NextRequest, context: { params: Promise<{}> }) {
  const withMiddleware = withBasicAuth(getDashboardStatsHandler)
  return await withMiddleware(request)
}