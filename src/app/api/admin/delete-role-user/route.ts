import { authOptions, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"








export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe y es ADMIN o VENDEDOR
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    if (!["ADMIN", "VENDEDOR"].includes(userToDelete.role)) {
      return NextResponse.json(
        { error: "Solo se pueden eliminar administradores y vendedores" },
        { status: 400 }
      )
    }

    // No permitir que un admin se elimine a sí mismo
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "No puedes eliminarte a ti mismo" },
        { status: 400 }
      )
    }

    // Verificar que quede al menos 1 administrador
    if (userToDelete.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Debe quedar al menos 1 administrador en el sistema" },
          { status: 400 }
        )
      }
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      message: `${userToDelete.role === "ADMIN" ? "Administrador" : "Vendedor"} eliminado exitosamente`
    })

  } catch (error) {
    console.error("Error deleting role user:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}