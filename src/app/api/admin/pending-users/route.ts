import { prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth, AuthSession } from "@/lib/middleware/auth"

async function getPendingUsersHandler(_request: NextRequest, _session: AuthSession) {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        validated: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        rut: true,
        phone: true,
        type: true,
        company: true,
        businessType: true,
        billingAddress: true,
        shippingAddress: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      users: pendingUsers
    })

  } catch (error) {
    console.error("Error fetching pending users:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function GET(request: NextRequest, _context: { params: Promise<{}> }) {
  const withMiddleware = withAdminAuth(getPendingUsersHandler)
  return await withMiddleware(request)
}