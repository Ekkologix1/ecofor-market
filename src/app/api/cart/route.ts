import { withCSRFProtection, ErrorHandler } from "@/lib"
import { CartService } from "@/services"
import { NextRequest, NextResponse } from "next/server"
import { withAuth, AuthSession } from "@/lib/middleware/auth"
import { withCartRateLimit } from "@/lib/middleware/authWithRateLimit"
import { z } from "zod"






// src/app/api/cart/route.ts








// GET - Obtener carrito del usuario
async function getCartHandler(request: NextRequest, session: AuthSession) {
  try {
    const cart = await CartService.getOrCreateCart(session.user.id)
    if (!cart) {
      throw new Error('No se pudo obtener el carrito')
    }
    
    const cartData = CartService.calculateCartTotals(cart.items)

    return NextResponse.json({
      cart: {
        id: cart.id,
        ...cartData
      }
    })

  } catch (error: unknown) {
    // Manejar específicamente el error de restricción de clave foránea
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      console.error("Error de restricción de clave foránea en carrito:", {
        userId: session.user.id,
        error: (error as any).message || 'Error desconocido',
        constraint: (error as any).meta?.constraint
      })
      
      return NextResponse.json({
        error: "Error de integridad de datos. Por favor, inicia sesión nuevamente.",
        code: "FOREIGN_KEY_CONSTRAINT_ERROR"
      }, { status: 400 })
    }

    return ErrorHandler.handleError(error, "/api/cart")
  }
}

// Exportar con middleware de autenticación y rate limiting
export const GET = withCartRateLimit(getCartHandler, { requireValidated: false })

// POST - Agregar producto al carrito
async function addToCartHandler(request: NextRequest, session: AuthSession) {
  try {
    const body = await request.json()
    const { productId, quantity } = CartService.validateAddItemData(body)

    // Agregar producto al carrito usando el servicio
    const result = await CartService.addToCart(productId, quantity, session.user)

    return NextResponse.json({
      message: result.isUpdate 
        ? "Cantidad actualizada en el carrito" 
        : "Producto agregado al carrito",
      item: {
        id: result.cartItem.id,
        productId: result.cartItem.productId,
        quantity: result.cartItem.quantity,
        unitPrice: Number(result.cartItem.unitPrice),
        discount: Number(result.cartItem.discount),
        product: result.cartItem.product
      }
    }, { status: result.isUpdate ? 200 : 201 })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/cart")
  }
}

// PUT - Actualizar todo el carrito
async function updateCartHandler(request: NextRequest, session: AuthSession) {
  try {
    const body = await request.json()
    const { items } = CartService.validateUpdateCartData(body)

    // Actualizar carrito usando el servicio
    await CartService.updateCart(items, session.user)

    return NextResponse.json({
      message: "Carrito actualizado exitosamente"
    })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/cart")
  }
}

// Exportar con middleware de autenticación, rate limiting y CSRF
// Wrapper para mantener la firma correcta de Next.js 15
export async function PUT(request: NextRequest, context: { params: Promise<{}> }) {
  const withMiddleware = withCSRFProtection(withCartRateLimit(updateCartHandler), { requireAuth: true, requireValidated: false })
  return await withMiddleware(request)
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function POST(request: NextRequest, context: { params: Promise<{}> }) {
  const withMiddleware = withCSRFProtection(withCartRateLimit(addToCartHandler), { requireAuth: true, requireValidated: false })
  return await withMiddleware(request)
}

// DELETE - Limpiar carrito completamente
async function clearCartHandler(request: NextRequest, session: AuthSession) {
  try {
    // Limpiar carrito usando el servicio
    const cart = await CartService.clearCart(session.user.id)

    if (!cart) {
      return NextResponse.json(
        { message: "El carrito ya está vacío" }
      )
    }

    return NextResponse.json({
      message: "Carrito vaciado exitosamente"
    })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/cart")
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function DELETE(request: NextRequest, context: { params: Promise<{}> }) {
  const withMiddleware = withCSRFProtection(withCartRateLimit(clearCartHandler), { requireAuth: true, requireValidated: false })
  return await withMiddleware(request)
}