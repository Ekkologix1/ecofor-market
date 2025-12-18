import { authOptions, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"








export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ success: true }) // Ya no hay sesión
    }

    // Buscar la sesión activa más reciente sin endTime
    const activeSession = await prisma.sessionLog.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    if (activeSession) {
      const endTime = new Date()
      const duration = Math.round((endTime.getTime() - activeSession.startTime.getTime()) / (1000 * 60)) // Duración en minutos

      // Actualizar la sesión con endTime y duración
      await prisma.sessionLog.update({
        where: { id: activeSession.id },
        data: {
          endTime,
          duration
        }
      })

      // Registrar logout en ActivityLog
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "logout",
          description: `Usuario cerró sesión (${duration} minutos conectado)`,
          ipAddress: "127.0.0.1"
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error logging logout:", error)
    return NextResponse.json({ success: true }) // No fallar el logout por errores de logging
  }
}