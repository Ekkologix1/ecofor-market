


import { prisma, registerNaturalSchema, registerEmpresaSchema, withAuthRateLimit, withCSRFProtection } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"





async function registerHandler(request: NextRequest) {
  // Aplicar rate limiting para registro
  const rateLimitResponse = await withAuthRateLimit(request, "register")
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  return await handleRegister(request)
}

async function handleRegister(request: NextRequest) {

  try {
    const body = await request.json()
    const { type, ...userData } = body

    // Validar según tipo de usuario
    let validatedData
    if (type === "NATURAL") {
      validatedData = registerNaturalSchema.parse(userData)
    } else if (type === "EMPRESA") {
      validatedData = registerEmpresaSchema.parse(userData)
    } else {
      return NextResponse.json(
        { error: "Tipo de usuario inválido" },
        { status: 400 }
      )
    }

    // Verificar si usuario ya existe
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

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
        type: type,
        validated: false // Requiere validación manual
      }
    })

    // No retornar password
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "Usuario registrado exitosamente. Será validado en breve.",
      user: userWithoutPassword
    })

  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function POST(request: NextRequest, context: { params: Promise<{}> }) {
  const withCSRF = withCSRFProtection(registerHandler, { requireAuth: false })
  return await withCSRF(request)
}