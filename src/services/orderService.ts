import { OrderStatus, OrderType } from "@prisma/client"
import { prisma, BusinessLogicError, NotFoundError, orderItemSchema, createOrderSchema, orderFiltersSchema, executePaginatedQuery, type PaginatedResponse, SHIPPING, ORDER, calculateShippingCost, generateOrderPrefix } from "@/lib"
import { PrismaDecimal, toNumber } from "@/types"
import { UserSession } from "@/types/auth"
// src/services/orderService.ts



// Interfaces para tipos
export interface OrderWhereCondition {
  userId: string
  status?: OrderStatus
  type?: OrderType
}

export interface Product {
  id: string
  name: string
  sku: string
  basePrice: PrismaDecimal // Decimal from Prisma
  wholesalePrice?: PrismaDecimal | null // Decimal from Prisma
  stock: number
  active: boolean
  unit?: string | null
}

export interface OrderItem {
  productId: string
  quantity: number
  unitPrice: number
  discount: number
}

export interface CreateOrderData {
  type: "COMPRA" | "COTIZACION"
  items: OrderItem[]
  shippingAddress: string
  billingAddress?: string
  shippingMethod: keyof typeof SHIPPING.METHODS
  shippingCity?: string
  shippingZone?: string
  customerNotes?: string
  estimatedDate?: Date
}

export interface OrderFilters {
  status?: OrderStatus
  type?: OrderType
  page: number
  limit: number
}

// UserSession interface moved to types/auth.ts to avoid duplication

// Los esquemas de validación ahora se importan desde @/lib/validations

export class OrderService {
  // Generar número de orden único
  static async generateOrderNumber(): Promise<string> {
    const prefix = generateOrderPrefix()
    
    // Obtener el último número de orden del año
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        orderNumber: 'desc'
      }
    })

    let nextNumber = 1
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `${prefix}${nextNumber.toString().padStart(ORDER.NUMBER.SEQUENCE_PADDING, '0')}`
  }

  // Verificar productos y stock
  static async validateProductsAndStock(items: OrderItem[]): Promise<{
    isValid: boolean
    error?: string
    products?: Product[]
  }> {
    const productIds = items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        active: true
      },
      select: {
        id: true,
        name: true,
        sku: true,
        basePrice: true,
        wholesalePrice: true,
        stock: true,
        active: true,
        unit: true
      }
    })

    if (products.length !== productIds.length) {
      return {
        isValid: false,
        error: "Algunos productos no están disponibles"
      }
    }

    // Verificar stock disponible
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product || product.stock < item.quantity) {
        return {
          isValid: false,
          error: `Stock insuficiente para ${product?.name || 'producto'}`
        }
      }
    }

    return {
      isValid: true,
      products
    }
  }

  // Calcular precios y totales
  static calculateOrderTotals(
    items: OrderItem[], 
    products: Product[], 
    userType: string,
    shippingMethod: string
  ) {
    let subtotal = 0
    let discountAmount = 0

    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)!
      
      // Usar precio base o mayorista según el tipo de usuario
      const basePrice = userType === 'EMPRESA' && product.wholesalePrice 
        ? toNumber(product.wholesalePrice)
        : toNumber(product.basePrice)

      const itemSubtotal = item.quantity * basePrice
      const itemDiscount = itemSubtotal * (item.discount / 100)
      const itemTotal = itemSubtotal - itemDiscount

      subtotal += itemTotal
      discountAmount += itemDiscount

      return {
        productId: item.productId,
        productSku: product.sku,
        productName: product.name,
        productUnit: product.unit,
        quantity: item.quantity,
        unitPrice: basePrice,
        discount: item.discount,
        subtotal: itemTotal
      }
    })

    // Calcular costo de envío usando función centralizada
    const shippingCost = calculateShippingCost(shippingMethod as keyof typeof SHIPPING.METHODS, subtotal)

    const total = subtotal + shippingCost

    return {
      orderItems,
      subtotal,
      discountAmount,
      shippingCost,
      total
    }
  }

  // Crear pedido
  static async createOrder(orderData: CreateOrderData, user: UserSession) {
    // Verificar productos y stock
    const validation = await this.validateProductsAndStock(orderData.items)
    if (!validation.isValid) {
      throw new BusinessLogicError(validation.error!)
    }

    // Calcular totales
    const totals = this.calculateOrderTotals(
      orderData.items, 
      validation.products!, 
      user.type,
      String(orderData.shippingMethod)
    )

    // Generar número de orden
    const orderNumber = await this.generateOrderNumber()

    // Crear pedido en una transacción
    const order = await prisma.$transaction(async (tx) => {
      // 1. Crear el pedido
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: ORDER.STATUS.RECIBIDO,
          type: orderData.type,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          shippingCost: totals.shippingCost,
          total: totals.total,
          shippingAddress: orderData.shippingAddress,
          billingAddress: orderData.billingAddress || orderData.shippingAddress,
          shippingMethod: orderData.shippingMethod,
          shippingCity: orderData.shippingCity,
          shippingZone: orderData.shippingZone,
          customerNotes: orderData.customerNotes,
          estimatedDate: orderData.estimatedDate
        }
      })

      // 2. Crear los items del pedido
      await tx.orderItem.createMany({
        data: totals.orderItems.map(item => ({
          ...item,
          orderId: newOrder.id,
          productUnit: item.productUnit || 'unidad' // Valor por defecto
        }))
      })

      // 3. Actualizar stock de productos (solo para compras, no cotizaciones)
      if (orderData.type === ORDER.TYPES.COMPRA) {
        for (const item of orderData.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        }
      }

      // 4. Crear historial de estado inicial
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: ORDER.STATUS.RECIBIDO,
          changedBy: user.id,
          reason: orderData.type === ORDER.TYPES.COMPRA ? "Pedido creado por el cliente" : "Cotización solicitada",
          notes: orderData.customerNotes
        }
      })

      // 5. Log de actividad
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: orderData.type === "COMPRA" ? "order_created" : "quote_requested",
          description: `${orderData.type.toLowerCase()} ${newOrder.orderNumber} creada`,
          metadata: {
            orderId: newOrder.id,
            orderNumber: newOrder.orderNumber,
            total: totals.total,
            itemCount: orderData.items.length
          }
        }
      })

      return newOrder
    })

    return order
  }

  // Obtener pedido con items
  static async getOrderWithItems(orderId: string) {
    return await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        subtotal: true,
        discountAmount: true,
        shippingCost: true,
        total: true,
        shippingAddress: true,
        billingAddress: true,
        shippingMethod: true,
        shippingCity: true,
        shippingZone: true,
        customerNotes: true,
        adminNotes: true,
        trackingNumber: true,
        trackingUrl: true,
        shippingDate: true,
        deliveredDate: true,
        estimatedDate: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            productSku: true,
            productName: true,
            productUnit: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            subtotal: true,
            notes: true,
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                mainImage: true,
                unit: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true,
            phone: true,
            company: true
          }
        }
      }
    })
  }

  // Obtener pedidos del usuario con filtros
  static async getUserOrders(userId: string, filters: OrderFilters): Promise<PaginatedResponse<any>> {
    // Construir condiciones de filtro
    const where: OrderWhereCondition = {
      userId
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.type) {
      where.type = filters.type
    }

    // Usar la función de paginación centralizada
    return await executePaginatedQuery(
      (options) => prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          type: true,
          subtotal: true,
          discountAmount: true,
          shippingCost: true,
          total: true,
          shippingAddress: true,
          shippingMethod: true,
          shippingCity: true,
          shippingZone: true,
          customerNotes: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              productSku: true,
              productName: true,
              productUnit: true,
              quantity: true,
              unitPrice: true,
              discount: true,
              subtotal: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  mainImage: true,
                  category: {
                    select: {
                      name: true,
                      slug: true
                    }
                  }
                }
              }
            }
          },
          statusHistory: {
            select: {
              id: true,
              toStatus: true,
              changedAt: true,
              reason: true
            },
            orderBy: {
              changedAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        ...options
      }),
      () => prisma.order.count({ where }),
      { page: filters.page, limit: filters.limit }
    )
  }

  // Validar datos de entrada
  static validateOrderData(data: Record<string, unknown>) {
    return createOrderSchema.parse(data)
  }

  static validateOrderFilters(data: Record<string, unknown>) {
    return orderFiltersSchema.parse(data)
  }
}
