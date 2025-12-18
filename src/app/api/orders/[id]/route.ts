import { authOptions, withCSRFProtection, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import { OrderStatus } from "@prisma/client"





// src/app/api/orders/[id]/route.ts








// Interfaces para tipos
interface OrderWhereCondition {
  id: string
  userId?: string
}

interface OrderUpdateData {
  status: OrderStatus
  updatedAt: Date
  trackingNumber?: string
  trackingUrl?: string
  estimatedDate?: Date
  shippingDate?: Date
  deliveredDate?: Date
  processedBy?: string
  processedAt?: Date
}

// Esquema para actualizar estado del pedido (solo admins/vendedores)
const updateOrderStatusSchema = z.object({
  status: z.enum([
    "RECIBIDO", "VALIDANDO", "APROBADO", "PREPARANDO", 
    "LISTO", "EN_RUTA", "ENTREGADO", "COTIZACION", 
    "CANCELADO", "RECHAZADO", "EN_ESPERA"
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  estimatedDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  shippingDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET - Obtener detalles de un pedido específico
export async function GET(
  request: NextRequest, 
  { params }: RouteParams
) {
  try {
    // Obtener sesión con manejo seguro de errores JWT
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (error: any) {
      // Si hay error de decripción JWT, retornar error 401
      if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
        return NextResponse.json(
          { 
            error: "Sesión inválida. Por favor, cierra sesión y vuelve a iniciar sesión.",
            code: "INVALID_SESSION"
          },
          { status: 401 }
        )
      }
      // Otro tipo de error, relanzarlo
      throw error
    }

    if (!session || !session.user.validated) {
      return NextResponse.json(
        { error: "Usuario no autorizado o no validado" },
        { status: 401 }
      )
    }

    const { id: orderId } = await params

    // Construir condiciones de búsqueda
    const whereCondition: OrderWhereCondition = {
      id: orderId
    }

    // Si no es admin/vendedor, solo puede ver sus propios pedidos
    if (session.user.role === 'USER') {
      whereCondition.userId = session.user.id
    }

    // Buscar el pedido con toda la información relacionada
    const order = await prisma.order.findUnique({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true,
            phone: true,
            company: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                mainImage: true,
                images: true,
                unit: true,
                brand: true,
                category: {
                  select: {
                    name: true,
                    slug: true
                  }
                },
                stock: true,
                active: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        statusHistory: {
          include: {
            order: {
              select: {
                orderNumber: true
              }
            }
          },
          orderBy: {
            changedAt: 'desc'
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Log de actividad para tracking
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "order_viewed",
        description: `Consultó detalles del pedido ${order.orderNumber}`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          viewedBy: session.user.role
        }
      }
    })

    return NextResponse.json({
      order
    })

  } catch (error) {
    console.error("Error fetching order details:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado del pedido (solo admins/vendedores)
async function patchOrderHandler(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.validated) {
      return NextResponse.json(
        { error: "Usuario no autorizado o no validado" },
        { status: 401 }
      )
    }

    // Solo admins y vendedores pueden actualizar pedidos
    if (session.user.role === 'USER') {
      return NextResponse.json(
        { error: "No tienes permisos para actualizar pedidos" },
        { status: 403 }
      )
    }

    const { id: orderId } = await params
    const body = await request.json()
    const validatedData = updateOrderStatusSchema.parse(body)

    // Verificar que el pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Validar transición de estado (opcional - agregar lógica de negocio)
    const currentStatus = existingOrder.status
    const newStatus = validatedData.status

    // Preparar datos de actualización
    const updateData: OrderUpdateData = {
      status: newStatus,
      updatedAt: new Date()
    }

    // Campos opcionales
    if (validatedData.trackingNumber !== undefined) {
      updateData.trackingNumber = validatedData.trackingNumber
    }
    if (validatedData.trackingUrl !== undefined) {
      updateData.trackingUrl = validatedData.trackingUrl
    }
    if (validatedData.estimatedDate !== undefined) {
      updateData.estimatedDate = validatedData.estimatedDate
    }
    if (validatedData.shippingDate !== undefined) {
      updateData.shippingDate = validatedData.shippingDate
    }

    // Campos automáticos según el estado
    if (newStatus === 'EN_RUTA' && !validatedData.shippingDate) {
      updateData.shippingDate = new Date()
    }
    if (newStatus === 'ENTREGADO') {
      updateData.deliveredDate = new Date()
    }
    if (newStatus === 'APROBADO' && !updateData.processedBy) {
      updateData.processedBy = session.user.id
      updateData.processedAt = new Date()
    }

    // Actualizar en una transacción
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Actualizar el pedido
      const order = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  mainImage: true
                }
              }
            }
          }
        }
      })

      // 2. Crear entrada en historial de estados
      await tx.orderStatusHistory.create({
        data: {
          orderId: orderId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          changedBy: session.user.id,
          reason: validatedData.reason || `Estado actualizado por ${session.user.role.toLowerCase()}`,
          notes: validatedData.notes
        }
      })

      // 3. Log de actividad
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "order_updated",
          description: `Actualizó pedido ${existingOrder.orderNumber} de ${currentStatus} a ${newStatus}`,
          metadata: {
            orderId: orderId,
            orderNumber: existingOrder.orderNumber,
            fromStatus: currentStatus,
            toStatus: newStatus,
            reason: validatedData.reason,
            updatedBy: session.user.role
          }
        }
      })

      return order
    })

    // TODO: Aquí se pueden agregar notificaciones por email/WhatsApp
    // sendOrderStatusNotification(updatedOrder, newStatus)

    return NextResponse.json({
      message: `Pedido actualizado a estado: ${newStatus}`,
      order: updatedOrder
    })

  } catch (error) {
    console.error("Error updating order:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar pedido (solo el usuario propietario o admins)
async function deleteOrderHandler(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.validated) {
      return NextResponse.json(
        { error: "Usuario no autorizado o no validado" },
        { status: 401 }
      )
    }

    const { id: orderId } = await params
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'Cancelado por el usuario'

    // Buscar el pedido
    const whereCondition: OrderWhereCondition = {
      id: orderId
    }

    // Si no es admin, solo puede cancelar sus propios pedidos
    if (session.user.role === 'USER') {
      whereCondition.userId = session.user.id
    }

    const order = await prisma.order.findUnique({
      where: whereCondition,
      include: {
        items: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que se puede cancelar (no debe estar EN_RUTA o ENTREGADO)
    if (['EN_RUTA', 'ENTREGADO', 'CANCELADO'].includes(order.status)) {
      return NextResponse.json(
        { error: `No se puede cancelar un pedido en estado ${order.status}` },
        { status: 400 }
      )
    }

    // Cancelar en una transacción
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // 1. Actualizar estado a CANCELADO
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELADO',
          cancelReason: reason,
          updatedAt: new Date()
        }
      })

      // 2. Restaurar stock si era una compra
      if (order.type === 'COMPRA') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          })
        }
      }

      // 3. Crear entrada en historial
      await tx.orderStatusHistory.create({
        data: {
          orderId: orderId,
          fromStatus: order.status,
          toStatus: 'CANCELADO',
          changedBy: session.user.id,
          reason: reason,
          notes: `Cancelado por ${session.user.role === 'USER' ? 'el cliente' : 'administrador'}`
        }
      })

      // 4. Log de actividad
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "order_cancelled",
          description: `Canceló pedido ${order.orderNumber}`,
          metadata: {
            orderId: orderId,
            orderNumber: order.orderNumber,
            reason: reason,
            cancelledBy: session.user.role
          }
        }
      })

      return updatedOrder
    })

    return NextResponse.json({
      message: "Pedido cancelado exitosamente",
      order: cancelledOrder
    })

  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrappers con protección CSRF
function createPatchWrapper() {
  return async (request: NextRequest, { params }: RouteParams) => {
    return withCSRFProtection(
      async (req) => patchOrderHandler(req, { params }),
      { requireAuth: true }
    )(request)
  }
}

function createDeleteWrapper() {
  return async (request: NextRequest, { params }: RouteParams) => {
    return withCSRFProtection(
      async (req) => deleteOrderHandler(req, { params }),
      { requireAuth: true }
    )(request)
  }
}

export const PATCH = createPatchWrapper()
export const DELETE = createDeleteWrapper()