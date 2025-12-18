import { withCSRFProtection, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth, AuthSession } from "@/lib/middleware/auth"








async function validateUserHandler(request: NextRequest, session: AuthSession) {
  try {
    const body = await request.json()
    const { userId, approved } = body

    if (!userId || typeof approved !== "boolean") {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    if (approved) {
      // Aprobar usuario
      await prisma.user.update({
        where: { id: userId },
        data: {
          validated: true,
          validatedAt: new Date(),
          validatedBy: session.user.id
        }
      })

      return NextResponse.json({
        message: "Usuario aprobado exitosamente"
      })
    } else {
      // Rechazar usuario (eliminar de la base de datos)
      await prisma.user.delete({
        where: { id: userId }
      })

      return NextResponse.json({
        message: "Usuario rechazado y eliminado"
      })
    }

  } catch (error) {
    console.error("Error validating user:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function POST(request: NextRequest, context: { params: Promise<{}> }) {
  const withAuthAndCSRF = withCSRFProtection(withAdminAuth(validateUserHandler), { requireAuth: true })
  return await withAuthAndCSRF(request)
}