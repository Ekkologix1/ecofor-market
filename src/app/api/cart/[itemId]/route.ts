import { withCSRFProtection, ErrorHandler, NotFoundError } from "@/lib"
import { CartService } from "@/services"
import { NextRequest, NextResponse } from "next/server"
import { withBasicAuth, AuthSession } from "@/lib/middleware/auth"
import { z } from "zod"





// src/app/api/cart/[itemId]/route.ts







interface RouteParams {
  params: Promise<{
    itemId: string
  }>
}

// GET - Obtener detalles de un item específico del carrito
async function getCartItemHandler(
  request: NextRequest,
  { params }: RouteParams,
  session: AuthSession
) {
  try {
    const { itemId } = await params
    const cartItem = await CartService.validateCartItemOwnership(itemId, session.user.id)

    const itemSubtotal = cartItem.quantity * Number(cartItem.unitPrice)
    const discountAmount = itemSubtotal * (Number(cartItem.discount) / 100)
    const itemTotal = itemSubtotal - discountAmount

    return NextResponse.json({
      item: {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        unitPrice: Number(cartItem.unitPrice),
        discount: Number(cartItem.discount),
        subtotal: itemTotal,
        product: {
          id: cartItem.product.id,
          name: cartItem.product.name,
          sku: cartItem.product.sku,
          stock: cartItem.product.stock
        }
      }
    })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/cart/[itemId]")
  }
}

// PATCH - Actualizar cantidad de un item específico
async function updateCartItemHandler(
  request: NextRequest,
  { params }: RouteParams,
  session: AuthSession
) {
  try {
    const { itemId } = await params
    const body = await request.json()
    const { quantity } = CartService.validateUpdateItemData(body)

    // Actualizar cantidad usando el servicio
    const updatedItem = await CartService.updateItemQuantity(itemId, quantity, session.user)

    const itemSubtotal = quantity * Number(updatedItem.unitPrice)
    const discountAmount = itemSubtotal * (Number(updatedItem.discount) / 100)
    const itemTotal = itemSubtotal - discountAmount

    return NextResponse.json({
      message: "Cantidad actualizada exitosamente",
      item: {
        id: updatedItem.id,
        productId: updatedItem.productId,
        quantity: updatedItem.quantity,
        unitPrice: Number(updatedItem.unitPrice),
        discount: Number(updatedItem.discount),
        subtotal: itemTotal,
        product: updatedItem.product
      }
    })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/cart/[itemId]")
  }
}

// DELETE - Eliminar item específico del carrito
async function deleteCartItemHandler(
  request: NextRequest,
  { params }: RouteParams,
  session: AuthSession
) {
  try {
    const { itemId } = await params
    // Eliminar item usando el servicio
    const cartItem = await CartService.removeItem(itemId, session.user)

    return NextResponse.json({
      message: "Producto eliminado del carrito exitosamente",
      removedItem: {
        id: cartItem.id,
        productId: cartItem.productId,
        productName: cartItem.product.name,
        quantity: cartItem.quantity
      }
    })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/cart/[itemId]")
  }
}

// Wrappers para manejar parámetros dinámicos con middleware
function createGetHandler() {
  return async (request: NextRequest, { params }: RouteParams) => {
    return withBasicAuth(async (req, session) => {
      return getCartItemHandler(req, { params }, session)
    })(request)
  }
}

function createPatchHandler() {
  return async (request: NextRequest, { params }: RouteParams) => {
    return withCSRFProtection(
      withBasicAuth(async (req, session) => {
        return updateCartItemHandler(req, { params }, session)
      }),
      { requireAuth: true }
    )(request)
  }
}

function createDeleteHandler() {
  return async (request: NextRequest, { params }: RouteParams) => {
    return withCSRFProtection(
      withBasicAuth(async (req, session) => {
        return deleteCartItemHandler(req, { params }, session)
      }),
      { requireAuth: true }
    )(request)
  }
}

export const GET = createGetHandler()
export const PATCH = createPatchHandler()
export const DELETE = createDeleteHandler()