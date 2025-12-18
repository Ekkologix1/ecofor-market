// src/app/api/admin/rate-limiter/route.ts
import { authOptions, getRateLimiterStatus, reinitializeRateLimiter } from "@/lib"
import logger from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener estado del rate limiter
    const status = await getRateLimiterStatus()
    
    return NextResponse.json({
      success: true,
      data: {
        rateLimiter: status,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasUpstashConfig: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
          hasLocalRedis: !!process.env.REDIS_URL
        },
        config: {
          limits: {
            login: "5 requests per minute",
            register: "3 requests per 10 minutes", 
            checkout: "10 requests per hour",
            api: "100 requests per 15 minutes",
            upload: "5 requests per hour"
          }
        }
      }
    })
  } catch (error) {
    logger.error("Error getting rate limiter status:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { action } = await request.json()

    switch (action) {
      case "reinitialize":
        logger.info(`Rate limiter reinicializado por admin: ${session.user.id}`)
        const success = await reinitializeRateLimiter()
        
        return NextResponse.json({
          success,
          message: success 
            ? "Rate limiter reinicializado correctamente"
            : "Error reinicializando rate limiter"
        })

      default:
        return NextResponse.json(
          { error: "Acción no válida. Use: reinitialize" },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error("Error in rate limiter admin action:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
