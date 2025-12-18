// ============================================
// ERROR LOGS API ENDPOINT
// Endpoint para recibir logs de errores del cliente
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { withApiRateLimit } from '@/lib/rateLimiter'

interface ErrorLogEntry {
  level: 'error'
  message: string
  timestamp: string
  context?: {
    userId?: string
    sessionId?: string
    requestId?: string
    component?: string
    action?: string
    metadata?: Record<string, any>
  }
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  user?: {
    id: string
    email?: string
    role?: string
  }
  request?: {
    method: string
    url: string
    userAgent?: string
    ip?: string
  }
}

async function logErrorHandler(request: NextRequest) {
  try {
    const errorLog: ErrorLogEntry = await request.json()

    // Validar que sea un log de error
    if (errorLog.level !== 'error') {
      return NextResponse.json(
        { error: 'Only error level logs are accepted' },
        { status: 400 }
      )
    }

    // Extraer información del request
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Log estructurado en el servidor
    logger.error('Client error received', {
      message: errorLog.message,
      timestamp: errorLog.timestamp,
      context: errorLog.context,
      error: errorLog.error,
      user: errorLog.user,
      clientInfo: {
        userAgent,
        ip,
        url: errorLog.request?.url
      }
    })

    // Aquí podrías:
    // 1. Guardar en base de datos
    // 2. Enviar a servicio de monitoreo (Sentry, etc.)
    // 3. Notificar a administradores
    // 4. Actualizar métricas de errores

    // Ejemplo de guardado en base de datos (descomenta si tienes una tabla para logs)
    /*
    await prisma.errorLog.create({
      data: {
        message: errorLog.message,
        level: errorLog.level,
        context: errorLog.context,
        errorDetails: errorLog.error,
        userAgent,
        ip,
        timestamp: new Date(errorLog.timestamp)
      }
    })
    */

    return NextResponse.json(
      { success: true, message: 'Error log received' },
      { status: 200 }
    )

  } catch (error) {
    logger.error('Failed to process error log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Failed to process error log' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting para prevenir abuso
    const rateLimitResponse = await withApiRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    return await logErrorHandler(request)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
