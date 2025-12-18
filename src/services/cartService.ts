import { prisma, BusinessLogicError, NotFoundError, AuthorizationError, addItemSchema, updateCartSchema, updateItemSchema } from "@/lib"
import { Decimal } from "@prisma/client/runtime/library"
import { CacheService } from "./cacheService"
import { UserSession } from "@/types/auth"
// src/services/cartService.ts

// Interfaces para tipos
export interface CartItemProduct {
  id: string
  name: string
  sku: string
  mainImage: string | null
  unit: string | null
  brand: string | null
  stock: number
  active: boolean
  category: {
    name: string
    slug: string
  } | null
}

export interface CartItemWithProduct {
  id: string
  productId: string
  quantity: number
  unitPrice: Decimal
  discount: Decimal
  product: CartItemProduct
}

export interface CartItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  product: CartItemProduct
}

export interface CartTotals {
  items: CartItem[]
  totalItems: number
  subtotal: number
  total: number
}

// UserSession interface moved to types/auth.ts to avoid duplication

export interface CartWithItems {
  id: string
  userId: string
  items: {
    id: string
    productId: string
    quantity: number
    unitPrice: number
    discount: number
  }[]
  createdAt: Date
  updatedAt: Date
}

// Los esquemas de validación ahora se importan desde @/lib/validations

export class CartService {
  // Verificar integridad del usuario en sesión
  static async validateUserSession(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, validated: true, deletedAt: true, email: true, name: true }
      })

      const isValid = !!(user && user.validated && !user.deletedAt)

      return isValid
    } catch (error) {
      console.error("Error validando sesión de usuario:", error)
      return false
    }
  }

  // Calcular precio según tipo de usuario
  static async getProductPrice(productId: string, userType: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId, active: true },
      select: {
        basePrice: true,
        wholesalePrice: true,
        stock: true,
        name: true
      }
    })

    if (!product) {
      throw new NotFoundError("Producto")
    }

    const price = userType === 'EMPRESA' && product.wholesalePrice 
      ? Number(product.wholesalePrice)
      : Number(product.basePrice)

    return { price, stock: product.stock, name: product.name }
  }

  // Obtener o crear carrito
  static async getOrCreateCart(userId: string) {
    // Validar que la sesión del usuario es válida
    const isUserValid = await this.validateUserSession(userId)
    
    if (!isUserValid) {
      throw new AuthorizationError("Sesión de usuario inválida. Por favor, inicia sesión nuevamente.")
    }

    // Intentar obtener del caché primero
    let cart: any = await CacheService.getUserCart(userId)

    if (!cart) {
      // Si no está en caché, obtener de la base de datos
      cart = await prisma.cart.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              discount: true,
              createdAt: true,
              updatedAt: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  mainImage: true,
                  unit: true,
                  brand: true,
                  stock: true,
                  active: true,
                  category: {
                    select: { 
                      name: true, 
                      slug: true 
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
          select: {
            id: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                id: true,
                productId: true,
                quantity: true,
                unitPrice: true,
                discount: true,
                createdAt: true,
                updatedAt: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    mainImage: true,
                    unit: true,
                    brand: true,
                    stock: true,
                    active: true,
                    category: {
                      select: { 
                        name: true, 
                        slug: true 
                      }
                    }
                  }
                }
              }
            }
          }
        })
      }
    }

    return cart
  }

  // Calcular totales del carrito
  static calculateCartTotals(items: CartItemWithProduct[]): CartTotals {
    let totalItems = 0
    let subtotal = 0

    const enrichedItems = items
      .filter(item => item.product?.active)
      .map(item => {
        const itemSubtotal = item.quantity * Number(item.unitPrice)
        const discountAmount = itemSubtotal * (Number(item.discount) / 100)
        const itemTotal = itemSubtotal - discountAmount

        subtotal += itemTotal
        totalItems += item.quantity

        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          subtotal: itemTotal,
          product: item.product
        }
      })

    return {
      items: enrichedItems,
      totalItems,
      subtotal,
      total: subtotal
    }
  }

  // Agregar producto al carrito
  static async addToCart(productId: string, quantity: number, user: UserSession) {
    // Verificar producto y obtener precio
    const { price, stock, name } = await this.getProductPrice(productId, user.type)

    // Obtener carrito
    const cart = await this.getOrCreateCart(user.id)
    if (!cart) {
      throw new BusinessLogicError("No se pudo obtener el carrito")
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      }
    })

    let newQuantity = quantity
    if (existingItem) {
      newQuantity = existingItem.quantity + quantity
    }

    // Verificar stock disponible
    if (stock < newQuantity) {
      throw new BusinessLogicError(`Stock insuficiente. Disponible: ${stock} unidades`)
    }

    // Actualizar o crear item
    const cartItem = existingItem
      ? await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            unitPrice: price,
            updatedAt: new Date()
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                mainImage: true,
                unit: true,
                brand: true,
                stock: true,
                active: true,
                category: {
                  select: { 
                    name: true, 
                    slug: true 
                  }
                }
              }
            }
          }
        })
      : await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: productId,
            quantity: quantity,
            unitPrice: price,
            discount: 0
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                mainImage: true,
                unit: true,
                brand: true,
                stock: true,
                active: true,
                category: {
                  select: { 
                    name: true, 
                    slug: true 
                  }
                }
              }
            }
          }
        })

    // Actualizar timestamp del carrito
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() }
    })

    // Invalidar caché del carrito
    await CacheService.invalidateUserCart(user.id)

    // Log de actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: existingItem ? "cart_update_item" : "cart_add_item",
        description: `${existingItem ? 'Actualizó' : 'Agregó'} ${quantity} unidades de ${name} al carrito`,
        metadata: {
          productId,
          productName: name,
          quantity,
          unitPrice: price,
          totalQuantity: newQuantity
        }
      }
    })

    return {
      cartItem,
      isUpdate: !!existingItem
    }
  }

  // Actualizar todo el carrito
  static async updateCart(items: Array<{productId: string, quantity: number}>, user: UserSession) {
    // Obtener carrito
    const cart = await this.getOrCreateCart(user.id)
    if (!cart) {
      throw new BusinessLogicError("No se pudo obtener el carrito")
    }

    // Verificar todos los productos y stock
    for (const item of items) {
      const { stock } = await this.getProductPrice(item.productId, user.type)
      if (stock < item.quantity) {
        throw new BusinessLogicError(`Stock insuficiente para uno de los productos`)
      }
    }

    // Actualizar carrito en transacción
    await prisma.$transaction(async (tx) => {
      // Eliminar todos los items actuales
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      })

      // Crear nuevos items
      for (const item of items) {
        const { price } = await this.getProductPrice(item.productId, user.type)
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: price,
            discount: 0
          }
        })
      }

      // Actualizar timestamp del carrito
      await tx.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      })
    })

    // Invalidar caché del carrito
    await CacheService.invalidateUserCart(user.id)

    // Log de actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "cart_update_all",
        description: `Actualizó todo el carrito con ${items.length} productos`,
        metadata: {
          itemCount: items.length,
          products: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }
      }
    })
  }

  // Actualizar cantidad de un item específico
  static async updateItemQuantity(itemId: string, quantity: number, user: UserSession) {
    // Verificar que el item pertenece al usuario
    const cartItem = await this.validateCartItemOwnership(itemId, user.id)

    // Verificar stock disponible
    if (cartItem.product.stock < quantity) {
      throw new BusinessLogicError(`Stock insuficiente. Disponible: ${cartItem.product.stock} unidades`)
    }

    // Calcular nuevo precio (por si cambió)
    const newPrice = this.calculatePrice({
      basePrice: Number(cartItem.product.basePrice),
      wholesalePrice: cartItem.product.wholesalePrice ? Number(cartItem.product.wholesalePrice) : undefined
    }, user.type)

    // Actualizar item
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: quantity,
        unitPrice: newPrice,
        updatedAt: new Date()
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            mainImage: true,
            unit: true,
            brand: true,
            stock: true,
            active: true,
            basePrice: true,
            wholesalePrice: true,
            category: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })

    // Actualizar timestamp del carrito
    await prisma.cart.update({
      where: { id: cartItem.cartId },
      data: { updatedAt: new Date() }
    })

    // Invalidar caché del carrito
    await CacheService.invalidateUserCart(user.id)

    // Log de actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "cart_update_item_quantity",
        description: `Actualizó cantidad de ${cartItem.product.name} a ${quantity} unidades`,
        metadata: {
          itemId: itemId,
          productId: cartItem.productId,
          productName: cartItem.product.name,
          previousQuantity: cartItem.quantity,
          newQuantity: quantity,
          unitPrice: newPrice
        }
      }
    })

    return updatedItem
  }

  // Eliminar item específico del carrito
  static async removeItem(itemId: string, user: UserSession) {
    // Verificar que el item pertenece al usuario
    const cartItem = await this.validateCartItemOwnership(itemId, user.id)

    // Eliminar item del carrito
    await prisma.cartItem.delete({
      where: { id: itemId }
    })

    // Actualizar timestamp del carrito
    await prisma.cart.update({
      where: { id: cartItem.cartId },
      data: { updatedAt: new Date() }
    })

    // Invalidar caché del carrito
    await CacheService.invalidateUserCart(user.id)

    // Log de actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "cart_remove_item",
        description: `Eliminó ${cartItem.product.name} del carrito`,
        metadata: {
          itemId: itemId,
          productId: cartItem.productId,
          productName: cartItem.product.name,
          quantity: cartItem.quantity,
          unitPrice: Number(cartItem.unitPrice)
        }
      }
    })

    return cartItem
  }

  // Limpiar carrito completamente
  static async clearCart(userId: string) {
    // Obtener carrito
    const cart = await prisma.cart.findUnique({
      where: { userId }
    })

    if (!cart) {
      return null // El carrito ya está vacío
    }

    // Eliminar todos los items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    })

    // Actualizar timestamp del carrito
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() }
    })

    // Invalidar caché del carrito
    await CacheService.invalidateUserCart(userId)

    // Log de actividad
    await prisma.activityLog.create({
      data: {
        userId,
        action: "cart_clear",
        description: "Vació completamente el carrito",
        metadata: {
          cartId: cart.id
        }
      }
    })

    return cart
  }

  // Verificar que el item pertenece al usuario
  static async validateCartItemOwnership(itemId: string, userId: string) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        cartId: true,
        productId: true,
        quantity: true,
        unitPrice: true,
        discount: true,
        cart: {
          select: { 
            id: true,
            userId: true 
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            active: true,
            basePrice: true,
            wholesalePrice: true
          }
        }
      }
    })

    if (!cartItem) {
      throw new NotFoundError("Item del carrito")
    }

    if (cartItem.cart.userId !== userId) {
      throw new AuthorizationError("No tienes permiso para acceder a este item")
    }

    if (!cartItem.product.active) {
      throw new BusinessLogicError("Producto no disponible")
    }

    return cartItem
  }

  // Calcular precio según tipo de usuario
  static calculatePrice(product: {
    basePrice: number
    wholesalePrice?: number
  }, userType: string): number {
    return userType === 'EMPRESA' && product.wholesalePrice 
      ? Number(product.wholesalePrice)
      : Number(product.basePrice)
  }

  // Validar datos de entrada
  static validateAddItemData(data: Record<string, unknown>) {
    return addItemSchema.parse(data)
  }

  static validateUpdateCartData(data: Record<string, unknown>) {
    return updateCartSchema.parse(data)
  }

  static validateUpdateItemData(data: Record<string, unknown>) {
    return updateItemSchema.parse(data)
  }
}
