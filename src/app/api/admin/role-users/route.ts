import { prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth, AuthSession } from "@/lib/middleware/auth"







async function getRoleUsersHandler(_request: NextRequest, _session: AuthSession) {
  try {
    const roleUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "VENDEDOR"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        rut: true,
        role: true,
        validated: true,
        createdAt: true
      },
      orderBy: [
        { role: "asc" }, // ADMIN primero, luego VENDEDOR
        { createdAt: "desc" }
      ]
    })

    return NextResponse.json({
      users: roleUsers
    })

  } catch (error) {
    console.error("Error fetching role users:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function GET(request: NextRequest, _context: { params: Promise<{}> }) {
  const withMiddleware = withAdminAuth(getRoleUsersHandler)
  return await withMiddleware(request)
}