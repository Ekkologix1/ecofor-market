import { prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"





export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        order: true,
        _count: {
          select: {
            products: {
              where: {
                active: true
              }
            }
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // Transformar los datos para incluir productCount
    const categoriesWithCount = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      productCount: category._count.products
    }))

    return NextResponse.json({
      categories: categoriesWithCount
    })

  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}