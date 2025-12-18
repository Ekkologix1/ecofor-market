import { authOptions, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { OrderStatus } from "@prisma/client"










// ============================================
// CONFIGURACIÓN DE TRANSICIONES VÁLIDAS
// ============================================

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECIBIDO: ['VALIDANDO', 'CANCELADO'],
  VALIDANDO: ['APROBADO', 'RECHAZADO', 'EN_ESPERA', 'CANCELADO'],
  APROBADO: ['PREPARANDO', 'CANCELADO', 'EN_ESPERA'],
  PREPARANDO: ['LISTO', 'EN_ESPERA', 'CANCELADO'],
  LISTO: ['EN_RUTA', 'ENTREGADO', 'EN_ESPERA'], // ← AGREGADO ENTREGADO
  EN_RUTA: ['ENTREGADO', 'EN_ESPERA'],
  ENTREGADO: [], // Estado final
  CANCELADO: [], // Estado final
  RECHAZADO: [], // Estado final
  EN_ESPERA: ['VALIDANDO', 'APROBADO', 'PREPARANDO', 'LISTO'],
  COTIZACION: ['RECIBIDO', 'RECHAZADO']
}

// Función para obtener transiciones válidas según método de envío
const getValidTransitions = (currentStatus: OrderStatus, shippingMethod: string): OrderStatus[] => {
  const baseTransitions = VALID_TRANSITIONS[currentStatus]
  
  // Normalizar el método de envío para comparación
  const normalizedMethod = shippingMethod.toUpperCase().replace(/\s+/g, '_')
  
  // Si es RETIRO_TIENDA y el estado actual es LISTO, omitir EN_RUTA
  if (normalizedMethod.includes('RETIRO') || normalizedMethod.includes('TIENDA')) {
    if (currentStatus === 'LISTO') {
      return baseTransitions.filter(status => status !== 'EN_RUTA')
    }
  }
  
  return baseTransitions
}

// Estados que requieren razón obligatoria
const REQUIRE_REASON: OrderStatus[] = ['CANCELADO', 'RECHAZADO', 'EN_ESPERA']

// Estados que requieren reposición de stock
const REQUIRE_STOCK_RETURN: OrderStatus[] = ['CANCELADO', 'RECHAZADO']

interface UpdateStatusRequest {
  newStatus: OrderStatus
  reason?: string
  notes?: string
  trackingNumber?: string
  estimatedDate?: string
  assignedTo?: string
  deliveryReceivedBy?: string
  deliveryReceivedRut?: string
}

// ============================================
// PATCH: Cambiar estado de pedido
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    
    // Verificar autenticación y rol
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'VENDEDOR')) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body: UpdateStatusRequest = await request.json()
    const { 
      newStatus, 
      reason, 
      notes, 
      trackingNumber, 
      estimatedDate, 
      assignedTo,
      deliveryReceivedBy,
      deliveryReceivedRut
    } = body

    // Validar que newStatus es válido
    if (!Object.values(OrderStatus).includes(newStatus)) {
      return NextResponse.json({ 
        error: "Estado inválido" 
      }, { status: 400 })
    }

    // Obtener pedido actual con items y productos
    const order = await prisma.order.findUnique({
      where: { id: resolvedParams.orderId },
      include: {
        user: true,
        items: {
          include: { 
            product: true 
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ 
        error: "Pedido no encontrado" 
      }, { status: 404 })
    }

    // Validar transición de estado usando la función que considera el método de envío
    const validTransitions = getValidTransitions(order.status, order.shippingMethod)
    if (!validTransitions.includes(newStatus)) {
      return NextResponse.json({ 
        error: `No se puede cambiar de ${order.status} a ${newStatus}`,
        currentStatus: order.status,
        attemptedStatus: newStatus,
        shippingMethod: order.shippingMethod
      }, { status: 400 })
    }

    // Validar razón obligatoria
    if (REQUIRE_REASON.includes(newStatus) && !reason) {
      return NextResponse.json({ 
        error: `Se requiere una razón para cambiar a estado ${newStatus}` 
      }, { status: 400 })
    }

    // VALIDACIÓN: Verificar stock al APROBAR
    if (newStatus === 'APROBADO') {
      const stockErrors: string[] = []
      
      for (const item of order.items) {
        if (item.product.stock < item.quantity) {
          stockErrors.push(
            `${item.productName}: Stock disponible ${item.product.stock}, solicitado ${item.quantity}`
          )
        }
      }

      if (stockErrors.length > 0) {
        return NextResponse.json({ 
          error: "Stock insuficiente",
          details: stockErrors
        }, { status: 400 })
      }
    }

    // Actualizar pedido con transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. REPOSICIÓN DE STOCK al cancelar o rechazar
      if (REQUIRE_STOCK_RETURN.includes(newStatus) && 
          ['APROBADO', 'PREPARANDO', 'LISTO', 'EN_RUTA'].includes(order.status)) {
        
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

        console.log(`[ORDER STATUS] Stock repuesto para pedido ${order.orderNumber}`)
      }

      // 2. DESCUENTO DE STOCK al aprobar
      if (newStatus === 'APROBADO') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        }

        console.log(`[ORDER STATUS] Stock descontado para pedido ${order.orderNumber}`)
      }

      // 3. Actualizar orden
      const updatedOrder = await tx.order.update({
        where: { id: resolvedParams.orderId },
        data: {
          status: newStatus,
          trackingNumber: trackingNumber || order.trackingNumber,
          estimatedDate: estimatedDate ? new Date(estimatedDate) : order.estimatedDate,
          processedBy: session.user.id,
          processedAt: new Date(),
          assignedTo: assignedTo || order.assignedTo,
          cancelReason: newStatus === 'CANCELADO' ? reason : order.cancelReason,
          adminNotes: notes || order.adminNotes,
          
          // Fechas específicas según estado
          ...(newStatus === 'EN_RUTA' && !order.shippingDate && { 
            shippingDate: new Date() 
          }),
          ...(newStatus === 'ENTREGADO' && !order.deliveredDate && { 
            deliveredDate: new Date() 
          }),
          ...(newStatus === 'APROBADO' && !order.approvedBy && {
            approvedBy: session.user.id,
            approvedAt: new Date()
          })
        },
        include: {
          user: true,
          items: {
            include: { product: true }
          }
        }
      })

      // 4. Crear registro en historial
      await tx.orderStatusHistory.create({
        data: {
          orderId: resolvedParams.orderId,
          fromStatus: order.status,
          toStatus: newStatus,
          changedBy: session.user.id,
          reason: reason || undefined,
          notes: notes ? `${notes}${deliveryReceivedBy ? `\nRecibido por: ${deliveryReceivedBy}${deliveryReceivedRut ? ` (RUT: ${deliveryReceivedRut})` : ''}` : ''}` : 
                 deliveryReceivedBy ? `Recibido por: ${deliveryReceivedBy}${deliveryReceivedRut ? ` (RUT: ${deliveryReceivedRut})` : ''}` : undefined,
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
        }
      })

      // 5. Registrar actividad del usuario
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'order_status_changed',
          description: `Cambió estado del pedido ${order.orderNumber} de ${order.status} a ${newStatus}`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            fromStatus: order.status,
            toStatus: newStatus,
            reason: reason || null,
            trackingNumber: trackingNumber || null,
            shippingMethod: order.shippingMethod
          },
          ipAddress: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
        }
      })

      return updatedOrder
    })

    console.log(`[ORDER STATUS] Pedido ${order.orderNumber}: ${order.status} → ${newStatus} (Método: ${order.shippingMethod})`)

    return NextResponse.json({
      success: true,
      order: {
        id: result.id,
        orderNumber: result.orderNumber,
        status: result.status,
        trackingNumber: result.trackingNumber,
        estimatedDate: result.estimatedDate,
        shippingDate: result.shippingDate,
        deliveredDate: result.deliveredDate
      },
      message: `Estado actualizado a ${newStatus}`
    })

  } catch (error) {
    console.error('[ORDER STATUS] Error:', error)
    return NextResponse.json(
      { 
        error: "Error al actualizar estado del pedido",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

// ============================================
// GET: Obtener historial de estados
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener historial de estados
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: resolvedParams.orderId },
      orderBy: { changedAt: 'desc' }
    })

    // Obtener información del pedido
    const order = await prisma.order.findUnique({
      where: { id: resolvedParams.orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true
      }
    })

    if (!order) {
      return NextResponse.json({ 
        error: "Pedido no encontrado" 
      }, { status: 404 })
    }

    return NextResponse.json({
      order,
      history
    })

  } catch (error) {
    console.error('[ORDER STATUS HISTORY] Error:', error)
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    )
  }
}