import { withCSRFProtection, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth, AuthSession } from "@/lib/middleware/auth"








async function toggleValidationHandler(request: NextRequest, session: AuthSession) {
  try {
    const body = await request.json()
    const { userId, validated } = body

    if (!userId || typeof validated !== "boolean") {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        validated: validated,
        validatedAt: validated ? new Date() : null,
        validatedBy: validated ? session.user.id : null
      }
    })

    return NextResponse.json({
      message: `Usuario ${validated ? 'validado' : 'desactivado'} exitosamente`
    })

  } catch (error) {
    console.error("Error toggling validation:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function POST(request: NextRequest, _context: { params: Promise<{}> }) {
  const withAuthAndCSRF = withCSRFProtection(withAdminAuth(toggleValidationHandler), { requireAuth: true })
  return await withAuthAndCSRF(request)
}