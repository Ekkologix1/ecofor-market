import { PrismaClient, OrderStatus, ShippingMethod } from '@prisma/client'

/**
 * Utilidades para manejo de soft deletes y optimistic locking
 */

export class SoftDeleteService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Soft delete para usuarios
   */
  async softDeleteUser(userId: string, deletedBy?: string): Promise<void> {
    await this.prisma.user.update({
      where: { 
        id: userId,
        deletedAt: null // Solo usuarios no eliminados
      },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 }
      }
    })
  }

  /**
   * Soft delete para productos
   */
  async softDeleteProduct(productId: string): Promise<void> {
    await this.prisma.product.update({
      where: { 
        id: productId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 }
      }
    })
  }

  /**
   * Soft delete para categorías
   */
  async softDeleteCategory(categoryId: string): Promise<void> {
    // Primero verificar que no haya productos activos en esta categoría
    const activeProductsCount = await this.prisma.product.count({
      where: {
        categoryId,
        active: true,
        deletedAt: null
      }
    })

    if (activeProductsCount > 0) {
      throw new Error('No se puede eliminar una categoría que tiene productos activos')
    }

    await this.prisma.category.update({
      where: { 
        id: categoryId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 }
      }
    })
  }

  /**
   * Soft delete para pedidos
   */
  async softDeleteOrder(orderId: string): Promise<void> {
    await this.prisma.order.update({
      where: { 
        id: orderId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 }
      }
    })
  }

  /**
   * Restaurar usuario eliminado
   */
  async restoreUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { 
        id: userId,
        deletedAt: { not: null }
      },
      data: {
        deletedAt: null,
        version: { increment: 1 }
      }
    })
  }

  /**
   * Restaurar producto eliminado
   */
  async restoreProduct(productId: string): Promise<void> {
    await this.prisma.product.update({
      where: { 
        id: productId,
        deletedAt: { not: null }
      },
      data: {
        deletedAt: null,
        version: { increment: 1 }
      }
    })
  }
}

/**
 * Utilidades para Optimistic Locking
 */
export class OptimisticLockingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Actualizar usuario con verificación de versión
   */
  async updateUserWithVersion(
    userId: string, 
    version: number, 
    data: Partial<{
      name?: string
      email?: string
      phone?: string
      shippingAddress?: string
      billingAddress?: string
      company?: string
      businessType?: string
      validated?: boolean
    }>
  ): Promise<void> {
    const result = await this.prisma.user.updateMany({
      where: { 
        id: userId,
        version: version, // Solo actualizar si la versión coincide
        deletedAt: null
      },
      data: {
        ...data,
        version: { increment: 1 }
      }
    })

    if (result.count === 0) {
      throw new Error('El registro ha sido modificado por otro usuario. Por favor, recarga la página.')
    }
  }

  /**
   * Actualizar producto con verificación de versión
   */
  async updateProductWithVersion(
    productId: string, 
    version: number, 
    data: Partial<{
      name?: string
      sku?: string
      basePrice?: number
      wholesalePrice?: number
      stock?: number
      unit?: string
      categoryId?: string
      description?: string
      mainImage?: string
      images?: string[]
    }>
  ): Promise<void> {
    const result = await this.prisma.product.updateMany({
      where: { 
        id: productId,
        version: version,
        deletedAt: null
      },
      data: {
        ...data,
        version: { increment: 1 }
      }
    })

    if (result.count === 0) {
      throw new Error('El producto ha sido modificado por otro usuario. Por favor, recarga la página.')
    }
  }

  /**
   * Actualizar pedido con verificación de versión
   */
  async updateOrderWithVersion(
    orderId: string, 
    version: number, 
    data: Partial<{
      status?: OrderStatus
      shippingMethod?: ShippingMethod
      shippingAddress?: string
      shippingCity?: string
      customerNotes?: string
      adminNotes?: string
      trackingNumber?: string
      trackingUrl?: string
      estimatedDate?: Date
      assignedToId?: string
    }>
  ): Promise<void> {
    const result = await this.prisma.order.updateMany({
      where: { 
        id: orderId,
        version: version,
        deletedAt: null
      },
      data: {
        ...data,
        version: { increment: 1 }
      }
    })

    if (result.count === 0) {
      throw new Error('El pedido ha sido modificado por otro usuario. Por favor, recarga la página.')
    }
  }
}

/**
 * Middleware de Prisma para filtrar automáticamente registros eliminados
 * Nota: $use no está disponible en Prisma 5+, se debe aplicar manualmente en las consultas
 */
export function softDeleteMiddleware(prisma: PrismaClient): void {
  // En Prisma 5+ el middleware $use fue removido
  // Se debe aplicar el filtro manualmente en cada consulta
  // Soft delete middleware registrado - aplicar filtros manualmente en consultas
}

/**
 * Utilidades para queries comunes con soft deletes
 */
export class QueryHelpers {
  constructor(private prisma: PrismaClient) {}

  /**
   * Obtener usuarios activos con filtros comunes
   */
  async getActiveUsers(filters: {
    type?: 'NATURAL' | 'EMPRESA'
    role?: 'USER' | 'ADMIN' | 'VENDEDOR'
    validated?: boolean
  } = {}) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...filters
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })
  }

  /**
   * Obtener productos activos con filtros comunes
   */
  async getActiveProducts(filters: {
    categoryId?: string
    featured?: boolean
    promotion?: boolean
    minPrice?: number
    maxPrice?: number
  } = {}) {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        active: true,
        ...filters,
        ...(filters.minPrice && { basePrice: { gte: filters.minPrice } }),
        ...(filters.maxPrice && { basePrice: { lte: filters.maxPrice } })
      },
      include: {
        category: true
      },
      orderBy: [
        { featured: 'desc' },
        { name: 'asc' }
      ]
    })
  }

  /**
   * Obtener pedidos activos con filtros comunes
   */
  async getActiveOrders(filters: {
    userId?: string
    status?: OrderStatus
    type?: 'COMPRA' | 'COTIZACION'
  } = {}) {
    return this.prisma.order.findMany({
      where: {
        deletedAt: null,
        ...filters
      },
      include: {
        user: true,
        items: {
          where: { deletedAt: null },
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
