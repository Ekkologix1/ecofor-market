import { prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { withStaffAuth, AuthSession } from "@/lib/middleware/auth"







// Actualizar interface para Next.js 15
interface RouteParams {
  params: Promise<{
    userId: string
  }>
}

async function getUserDetailsHandler(
  request: NextRequest,
  { params }: RouteParams,
  session: AuthSession
) {
  try {
    // Resolver params de forma asíncrona
    const resolvedParams = await params
    const { userId } = resolvedParams

    // Obtener información detallada del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        type: true,
        validated: true,
        createdAt: true,
        phone: true,
        rut: true,
        company: true,
        activityLogs: {
          select: {
            action: true,
            description: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Últimas 10 actividades
        },
        sessionLogs: {
          select: {
            duration: true,
            startTime: true,
            endTime: true
          },
          // Quitamos el filtro para contar todas las sesiones (activas y cerradas)
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Calcular estadísticas de sesión
    const totalSessions = user.sessionLogs.length
    const completedSessions = user.sessionLogs.filter(session => session.endTime !== null)
    const averageSessionTime = completedSessions.length > 0 
      ? Math.round(completedSessions.reduce((acc, session) => acc + (session.duration || 0), 0) / completedSessions.length)
      : 0

    // Calcular tiempo total hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySessions = completedSessions.filter(session => 
      new Date(session.startTime) >= today
    )
    const totalTimeToday = todaySessions.reduce((acc, session) => acc + (session.duration || 0), 0)

    // Último login
    const lastLogin = user.activityLogs.find(log => log.action === 'login')

    const response = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: user.type,
        validated: user.validated,
        createdAt: user.createdAt.toISOString(),
        phone: user.phone,
        rut: user.rut,
        company: user.company
      },
      recentActivity: user.activityLogs,
      sessionStats: {
        totalSessions,
        averageSessionTime,
        totalTimeToday,
        lastLoginTime: lastLogin?.createdAt.toISOString()
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Error fetching user details:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para manejar parámetros dinámicos con middleware
function createGetHandler() {
  return async (request: NextRequest, { params }: RouteParams) => {
    return withStaffAuth(async (req, session) => {
      return getUserDetailsHandler(req, { params }, session)
    })(request)
  }
}

export const GET = createGetHandler()