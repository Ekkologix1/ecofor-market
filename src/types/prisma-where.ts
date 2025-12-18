// src/types/prisma-where.ts
// Tipos para cláusulas where de Prisma

import { Prisma } from '@prisma/client'
import { PrismaDecimal } from './prisma'

/**
 * Tipo para filtros de productos
 */
export interface ProductWhereInput {
  id?: string | Prisma.StringFilter
  name?: string | Prisma.StringFilter
  slug?: string | Prisma.StringFilter
  shortDescription?: string | Prisma.StringFilter
  sku?: string | Prisma.StringFilter
  categoryId?: string | Prisma.StringFilter
  basePrice?: number | Prisma.DecimalFilter
  wholesalePrice?: number | Prisma.DecimalNullableFilter
  stock?: number | Prisma.IntFilter
  brand?: string | Prisma.StringNullableFilter
  unit?: string | Prisma.StringFilter
  featured?: boolean | Prisma.BoolFilter
  active?: boolean | Prisma.BoolFilter
  category?: {
    slug?: string | Prisma.StringFilter
    name?: string | Prisma.StringFilter
  } | Prisma.CategoryWhereInput
  AND?: ProductWhereInput[]
  OR?: ProductWhereInput[]
}

/**
 * Tipo para filtros de órdenes - compatible con Prisma
 */
export type OrderWhereInput = Prisma.OrderWhereInput

/**
 * Tipo para filtros de usuarios
 */
export interface UserWhereInput {
  id?: string | Prisma.StringFilter
  email?: string | Prisma.StringFilter
  name?: string | Prisma.StringFilter
  type?: string | Prisma.StringFilter
  role?: string | Prisma.StringFilter
  validated?: boolean | Prisma.BoolFilter
  company?: string | Prisma.StringNullableFilter
  createdAt?: Date | Prisma.DateTimeFilter
  AND?: UserWhereInput[]
  OR?: UserWhereInput[]
}

/**
 * Tipo para filtros de categorías
 */
export interface CategoryWhereInput {
  id?: string | Prisma.StringFilter
  name?: string | Prisma.StringFilter
  slug?: string | Prisma.StringFilter
  active?: boolean | Prisma.BoolFilter
  AND?: CategoryWhereInput[]
  OR?: CategoryWhereInput[]
}

/**
 * Tipo para filtros de carrito
 */
export interface CartWhereInput {
  id?: string | Prisma.StringFilter
  userId?: string | Prisma.StringFilter
  createdAt?: Date | Prisma.DateTimeFilter
  updatedAt?: Date | Prisma.DateTimeFilter
  AND?: CartWhereInput[]
  OR?: CartWhereInput[]
}

/**
 * Tipo para filtros de items de carrito
 */
export interface CartItemWhereInput {
  id?: string | Prisma.StringFilter
  cartId?: string | Prisma.StringFilter
  productId?: string | Prisma.StringFilter
  quantity?: number | Prisma.IntFilter
  unitPrice?: number | Prisma.DecimalFilter
  AND?: CartItemWhereInput[]
  OR?: CartItemWhereInput[]
}

/**
 * Tipo para órdenes con información de usuario
 */
export interface OrderWithUser {
  id: string
  orderNumber: string
  status: string
  type: string
  subtotal: PrismaDecimal
  discountAmount: PrismaDecimal
  shippingCost: PrismaDecimal
  total: PrismaDecimal
  shippingAddress: string
  shippingMethod: string
  shippingCity: string | null
  shippingDate: Date | null
  deliveredDate: Date | null
  estimatedDate: Date | null
  customerNotes: string | null
  adminNotes: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  processedBy: string | null
  assignedTo: string | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
    type: string
    company: string | null
  }
  _count: {
    items: number
  }
}
