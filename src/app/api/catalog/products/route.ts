import { ProductService } from "@/services"
import { ErrorHandler } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"







export async function GET(request: NextRequest) {
  try {
    // Obtener sesión del usuario para calcular precios (manejo seguro de errores JWT)
    let session = null
    try {
      session = await getServerSession(authOptions)
    } catch (error: any) {
      // Si hay error de decripción JWT, continuar sin sesión (precios para usuarios no autenticados)
      if (error?.name === 'JWEDecryptionFailed' || error?.message?.includes('decryption')) {
        // Silenciar el error y continuar sin sesión
        session = null
      } else {
        throw error
      }
    }
    const userType = session?.user?.type

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const filters = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    // Obtener productos usando el servicio
    const result = await ProductService.getAllProducts(filters)

    // Enriquecer productos con información de precios y promociones
    const enrichedProducts = result.data.map((product: any) => {
      const finalPrice = ProductService.getFinalPrice(product, userType)
      const isOnPromotion = ProductService.isOnPromotion(product)
      const originalPrice = ProductService.calculatePrice(product, userType)
      
      return {
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
          lowStock: product.stock <= (product.minStock || 5) && product.stock > 0,
          outOfStock: product.stock === 0
        }
      }
    })

    return NextResponse.json({
      products: enrichedProducts,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.totalCount,
        pages: result.pagination.totalPages,
        hasNext: result.pagination.hasMore,
        hasPrev: result.pagination.page > 1
      },
      userType: userType || null
    })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/catalog/products")
  }
}