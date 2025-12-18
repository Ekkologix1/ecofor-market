







import { authOptions, prisma, createRoleUserSchema } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { z } from "zod"
import bcrypt from "bcryptjs"



export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createRoleUserSchema.parse(body)

    // Verificar límite de administradores
    if (validatedData.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" }
      })

      if (adminCount >= 3) {
        return NextResponse.json(
          { error: "No se pueden crear más de 3 administradores" },
          { status: 400 }
        )
      }
    }

    // Verificar si ya existe usuario con ese email o RUT
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { rut: validatedData.rut }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email o RUT" },
        { status: 400 }
      )
    }

    // Generar contraseña temporal
    const tempPassword = `ecofor${validatedData.rut.split('-')[0]}`
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        rut: validatedData.rut,
        password: hashedPassword,
        role: validatedData.role,
        type: "EMPRESA", // Los admins y vendedores son tipo empresa por defecto
        validated: true, // Los usuarios creados por admin están validados automáticamente
        validatedAt: new Date(),
        validatedBy: session.user.id
      }
    })

    // No retornar password
    const { password: _password, ...userWithoutPassword } = user

    return NextResponse.json({
      message: `${validatedData.role === "ADMIN" ? "Administrador" : "Vendedor"} creado exitosamente`,
      user: userWithoutPassword,
      tempPassword: tempPassword // Para informar al admin
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating role user:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}