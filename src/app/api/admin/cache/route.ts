// src/app/api/admin/cache/route.ts








import { authOptions } from "@/lib"
import { CacheService } from "@/services"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import logger from "@/lib/logger"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener estadísticas del caché
    const stats = await CacheService.getCacheStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error("Error getting cache stats:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    switch (type) {
      case "products":
        await CacheService.invalidateProductCache()
        break
      case "categories":
        await CacheService.invalidateCategoryCache()
        break
      case "all":
        await CacheService.clearAllCache()
        break
      default:
        return NextResponse.json(
          { error: "Tipo de caché inválido. Use: products, categories, o all" },
          { status: 400 }
        )
    }

    logger.info(`Cache invalidated by admin: ${session.user.id}, type: ${type}`)

    return NextResponse.json({
      success: true,
      message: `Caché ${type} invalidado correctamente`
    })
  } catch (error) {
    logger.error("Error clearing cache:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
