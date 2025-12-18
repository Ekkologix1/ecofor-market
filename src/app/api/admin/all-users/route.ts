import { UserService } from "@/services"
import { ErrorHandler } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { withAdminAuth, AuthSession } from "@/lib/middleware/auth"

async function getAllUsersHandler(_request: NextRequest, _session: AuthSession) {
  try {
    // Obtener todos los usuarios usando el servicio
    const result = await UserService.getAllUsers()

    return NextResponse.json({
      users: result.data
    })

  } catch (error) {
    return ErrorHandler.handleError(error, "/api/admin/all-users")
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function GET(request: NextRequest, _context: { params: Promise<Record<string, never>> }) {
  const withMiddleware = withAdminAuth(getAllUsersHandler)
  return await withMiddleware(request)
}