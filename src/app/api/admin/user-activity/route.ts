import { authOptions, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"








interface SessionLog {
  duration: number | null
  endTime: Date | null
  startTime: Date
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Permitir acceso a ADMIN y VENDEDOR
    const hasAccess = session?.user?.role === 'ADMIN' || session?.user?.role === 'VENDEDOR'
    if (!session || !hasAccess) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener todos los usuarios con sus estadísticas de actividad
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        type: true,
        validated: true,
        createdAt: true,
        activityLogs: {
          select: {
            action: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Últimas 5 actividades para mejor análisis
        },
        sessionLogs: {
          select: {
            duration: true,
            endTime: true,
            startTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const now = new Date()

    // Procesar los datos para calcular estadísticas
    const usersWithActivity = users.map(user => {
      // Solo considerar actividad real, no fecha de creación
      const lastActivity = user.activityLogs[0]?.createdAt
      const sessions = user.sessionLogs
      
      // Calcular solo con sesiones completadas
      const completedSessions = sessions.filter((s: SessionLog) => s.endTime !== null)
      const totalSessions = completedSessions.length
      const averageSessionTime = completedSessions.length > 0 
        ? Math.round(completedSessions.reduce((acc: number, session: SessionLog) => acc + (session.duration || 0), 0) / completedSessions.length)
        : 0

      // LÓGICA MEJORADA: Usuario en línea solo si tiene sesión activa RECIENTE
      // Una sesión se considera activa si:
      // 1. No tiene endTime (null)
      // 2. Su startTime es de hace menos de 2 horas (para evitar sesiones huérfanas)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      const hasRecentActiveSession = sessions.some((session: SessionLog) => 
        session.endTime === null && new Date(session.startTime) > twoHoursAgo
      )

      // Considerar en línea SOLO si tiene sesión activa reciente
      const isOnline = hasRecentActiveSession

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: user.type,
        validated: user.validated,
        lastActivity: lastActivity ? lastActivity.toISOString() : user.createdAt.toISOString(),
        totalSessions,
        averageSessionTime,
        isOnline
      }
    })

    return NextResponse.json({
      users: usersWithActivity
    })

  } catch (error) {
    console.error("Error fetching user activity:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}