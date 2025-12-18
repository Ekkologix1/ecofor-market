import { prisma, executePaginatedQuery, extractPaginationFromUrl } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { withStaffAuth, withAdminAuth, AuthSession } from "@/lib/middleware/auth"
import { OrderStatus } from "@prisma/client"
import { OrderWhereInput } from "@/types"

// ============================================
// GET: Listar todos los pedidos
// ============================================

async function getOrdersHandler(request: NextRequest, _session: AuthSession) {
  try {
    // Obtener parámetros de búsqueda desde URL
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as OrderStatus | null
    const search = searchParams.get('search')
    
    // Usar la función de paginación centralizada
    const pagination = extractPaginationFromUrl(searchParams)

    // Construir filtros
    const where: OrderWhereInput = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { company: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Obtener pedidos con paginación centralizada
    const ordersResult = await executePaginatedQuery(
      (options) => prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true,
              company: true
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        ...options
      }),
      () => prisma.order.count({ where }),
      pagination
    )

    // Calcular estadísticas por estado
    const allOrders = await prisma.order.findMany({
      select: {
        status: true
      }
    })

    const statsByStatus: Record<OrderStatus, number> = {
      RECIBIDO: 0,
      VALIDANDO: 0,
      APROBADO: 0,
      PREPARANDO: 0,
      LISTO: 0,
      EN_RUTA: 0,
      ENTREGADO: 0,
      COTIZACION: 0,
      CANCELADO: 0,
      RECHAZADO: 0,
      EN_ESPERA: 0
    }

    allOrders.forEach(order => {
      statsByStatus[order.status] = (statsByStatus[order.status] || 0) + 1
    })

    // Formatear respuesta
    const formattedOrders = ordersResult.data.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      shippingCity: order.shippingCity,
      shippingDate: order.shippingDate,
      deliveredDate: order.deliveredDate,
      estimatedDate: order.estimatedDate,
      trackingNumber: order.trackingNumber,
      customerNotes: order.customerNotes,
      adminNotes: order.adminNotes,
      processedBy: order.processedBy,
      assignedTo: order.assignedTo,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      user: order.user,
      _count: order._count
    }))

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      stats: {
        total: allOrders.length,
        byStatus: statsByStatus
      },
      pagination: ordersResult.pagination
    })

  } catch (error) {
    console.error('[ADMIN ORDERS] Error:', error)
    return NextResponse.json(
      { 
        error: "Error al obtener pedidos",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function GET(request: NextRequest, _context: { params: Promise<Record<string, never>> }) {
  const withMiddleware = withStaffAuth(getOrdersHandler)
  return await withMiddleware(request)
}

// ============================================
// POST: Crear pedido manual (admin)
// ============================================

async function createOrderHandler(request: NextRequest, session: AuthSession) {
  try {
    const body = await request.json()
    const { 
      userId, 
      items, 
      shippingAddress, 
      shippingMethod,
      customerNotes,
      type = 'COMPRA'
    } = body

    // Validaciones básicas
    if (!userId || !items || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ 
        error: "Datos incompletos" 
      }, { status: 400 })
    }

    // Verificar usuario
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ 
        error: "Usuario no encontrado" 
      }, { status: 404 })
    }

    // Generar número de pedido
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true }
    })

    let orderNumber: string
    if (lastOrder) {
      const match = lastOrder.orderNumber.match(/ECO-(\d{4})-(\d+)/)
      if (match) {
        const year = new Date().getFullYear()
        const lastNumber = parseInt(match[2])
        const newNumber = match[1] === year.toString() ? lastNumber + 1 : 1
        orderNumber = `ECO-${year}-${String(newNumber).padStart(3, '0')}`
      } else {
        orderNumber = `ECO-${new Date().getFullYear()}-001`
      }
    } else {
      orderNumber = `ECO-${new Date().getFullYear()}-001`
    }

    // Crear pedido con transacción
    const order = await prisma.$transaction(async (tx) => {
      // Calcular totales
      let subtotal = 0
      const orderItems = []

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        })

        if (!product) {
          throw new Error(`Producto ${item.productId} no encontrado`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}`)
        }

        const unitPrice = user.type === 'EMPRESA' && product.wholesalePrice
          ? Number(product.wholesalePrice)
          : Number(product.basePrice)

        const itemSubtotal = unitPrice * item.quantity

        orderItems.push({
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          productUnit: product.unit,
          quantity: item.quantity,
          unitPrice,
          discount: 0,
          subtotal: itemSubtotal
        })

        subtotal += itemSubtotal
      }

      // Crear orden
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'RECIBIDO',
          type,
          subtotal,
          discountAmount: 0,
          shippingCost: 0,
          total: subtotal,
          shippingAddress,
          shippingMethod,
          customerNotes,
          items: {
            create: orderItems
          }
        },
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      })

      // Registrar actividad
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'order_created_manual',
          description: `Creó pedido ${orderNumber} manualmente`,
          metadata: {
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            total: subtotal
          }
        }
      })

      return newOrder
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total)
      },
      message: 'Pedido creado exitosamente'
    })

  } catch (error) {
    console.error('[CREATE ORDER] Error:', error)
    return NextResponse.json(
      { 
        error: "Error al crear pedido",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// Exportar con middleware de autenticación de admin
export const POST = withAdminAuth(createOrderHandler)