import { prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4')
    
    // Obtener productos destacados con información de categoría
    const featuredProducts = await prisma.product.findMany({
      where: {
        featured: true,
        active: true,
        deletedAt: null
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Transformar los datos para la respuesta
    const productsWithCategory = featuredProducts.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      sku: product.sku,
      basePrice: product.basePrice,
      wholesalePrice: product.wholesalePrice,
      brand: product.brand,
      unit: product.unit,
      mainImage: product.mainImage,
      promotion: product.promotion,
      promotionPrice: product.promotionPrice,
      promotionStart: product.promotionStart,
      promotionEnd: product.promotionEnd,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug
      }
    }))

    return NextResponse.json({
      products: productsWithCategory,
      count: productsWithCategory.length
    })

  } catch (error) {
    console.error("Error fetching featured products:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
