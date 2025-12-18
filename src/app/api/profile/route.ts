





import { prisma, updateProfileSchema, withCSRFProtection } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withBasicAuth, AuthSession } from "@/lib/middleware/auth"
import bcrypt from "bcryptjs"





// Interface para datos de actualización del usuario
interface UserUpdateData {
  name?: string
  phone?: string
  company?: string
  businessType?: string
  billingAddress?: string
  shippingAddress?: string
  password?: string
  updatedAt: Date
}

// El esquema de validación ahora se importa desde @/lib/validations

// GET - Obtener datos del perfil
async function getProfileHandler(request: NextRequest, session: AuthSession) {
  try {

    // Obtener datos completos del usuario de la base de datos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        rut: true,
        phone: true,
        type: true,
        role: true,
        validated: true,
        validatedAt: true,
        createdAt: true,
        updatedAt: true,
        
        // Datos empresariales
        company: true,
        businessType: true,
        billingAddress: true,
        shippingAddress: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: user
    })

  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Exportar con middleware de autenticación básica
export const GET = withBasicAuth(getProfileHandler)

// PUT - Actualizar datos del perfil
async function updateProfileHandler(request: NextRequest, session: AuthSession) {
  try {

    const body = await request.json()
    
    // Validar datos de entrada
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Obtener usuario actual para validaciones
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        type: true,
        email: true,
        rut: true
      }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Preparar datos a actualizar
    const updateData: UserUpdateData = {
      updatedAt: new Date()
    }

    // Campos básicos que siempre se pueden actualizar
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.phone) updateData.phone = validatedData.phone

    // Campos específicos para empresas
    if (currentUser.type === "EMPRESA") {
      if (validatedData.company !== undefined) updateData.company = validatedData.company
      if (validatedData.businessType !== undefined) updateData.businessType = validatedData.businessType
      if (validatedData.billingAddress !== undefined) updateData.billingAddress = validatedData.billingAddress
      if (validatedData.shippingAddress !== undefined) updateData.shippingAddress = validatedData.shippingAddress
    }

    // Manejo de cambio de contraseña
    if (validatedData.newPassword && validatedData.currentPassword) {
      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        currentUser.password
      )

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta" },
          { status: 400 }
        )
      }

      // Hashear nueva contraseña
      const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 10)
      updateData.password = hashedNewPassword
    }

    // Realizar la actualización
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        rut: true,
        phone: true,
        type: true,
        role: true,
        validated: true,
        createdAt: true,
        updatedAt: true,
        company: true,
        businessType: true,
        billingAddress: true,
        shippingAddress: true,
      }
    })

    // Registrar actividad
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "profile_update",
        description: "Usuario actualizó su perfil",
        ipAddress: request.headers.get('x-forwarded-for') || "127.0.0.1"
      }
    })

    return NextResponse.json({
      message: "Perfil actualizado exitosamente",
      user: updatedUser
    })

  } catch (error) {
    console.error("Error updating user profile:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function PUT(request: NextRequest, context: { params: Promise<{}> }) {
  const withMiddleware = withCSRFProtection(withBasicAuth(updateProfileHandler), { requireAuth: true })
  return await withMiddleware(request)
}

// PATCH - Para actualizaciones parciales específicas (futuro uso)
async function patchProfileHandler(request: NextRequest, session: AuthSession) {
  try {

    // Este endpoint puede usarse para actualizaciones muy específicas
    // como cambiar solo la foto de perfil, preferencias de notificación, etc.
    
    return NextResponse.json({
      message: "Funcionalidad en desarrollo"
    })

  } catch (error) {
    console.error("Error in PATCH profile:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Exportar con middleware de autenticación básica
export const PATCH = withBasicAuth(patchProfileHandler)