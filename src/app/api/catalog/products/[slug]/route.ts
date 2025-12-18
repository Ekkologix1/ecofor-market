import { ProductService } from "@/services"
import { ErrorHandler } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Obtener sesión del usuario para calcular precios (manejo seguro de errores JWT)
    let session = null
    try {
      session = await getServerSession(authOptions)
    } catch (error: any) {
      // Si hay error de decripción JWT, continuar sin sesión (precios para usuarios no autenticados)
      if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
        session = null
      } else {
        throw error
      }
    }

    const { slug } = await params
    const userType = session?.user?.type

    // Obtener producto por slug
    const product = await ProductService.getProductBySlug(slug)

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el producto esté activo
    if (!product.active) {
      return NextResponse.json(
        { error: "Producto no disponible" },
        { status: 404 }
      )
    }

    // Enriquecer producto con información de precios y promociones
    const finalPrice = ProductService.getFinalPrice(product, userType)
    const isOnPromotion = ProductService.isOnPromotion(product)
    const originalPrice = ProductService.calculatePrice(product, userType)

    const enrichedProduct = {
      ...product,
      finalPrice,
      originalPrice,
      isOnPromotion,
      priceDisplay: {
        final: finalPrice,
        original: isOnPromotion ? originalPrice : null,
        discount: isOnPromotion ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0
      },
      stockStatus: {
        inStock: product.stock > 0,
        lowStock: product.stock > 0 && product.stock <= (product.minStock || 5),
        outOfStock: product.stock === 0
      },
      userType: userType || null
    }

    return NextResponse.json({
      product: enrichedProduct
    })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/catalog/products/[slug]")
  }
}


