







import { withAuthRateLimit, withCSRFProtection, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { signIn } from "next-auth/react"
import { headers } from "next/headers"
import bcrypt from "bcryptjs"



// Función para extraer la IP real del cliente
async function getClientIP(): Promise<string> {
  try {
    const headersList = await headers()
    const xForwardedFor = headersList.get('x-forwarded-for')
    const xRealIp = headersList.get('x-real-ip')
    
    if (xForwardedFor) {
      const ips = xForwardedFor.split(',').map((ip: string) => ip.trim())
      return ips[0]
    }
    
    if (xRealIp) {
      return xRealIp
    }
    
    return "127.0.0.1"
  } catch (error) {
    console.error("Error extracting client IP:", error)
    return "127.0.0.1"
  }
}

async function loginHandler(request: NextRequest) {
  // Aplicar rate limiting para login
  const rateLimitResponse = await withAuthRateLimit(request, "login")
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      // Registrar intento de login fallido
      const clientIP = await getClientIP()
      await prisma.activityLog.create({
        data: {
          userId: "unknown",
          action: "login_failed",
          description: `Intento de login con email inexistente: ${email}`,
          ipAddress: clientIP,
          metadata: {
            email: email,
            reason: "user_not_found"
          }
        }
      }).catch(error => {
        console.error("Error logging failed login:", error)
      })

      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Registrar intento de login fallido
      const clientIP = await getClientIP()
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "login_failed",
          description: `Intento de login con contraseña incorrecta para: ${email}`,
          ipAddress: clientIP,
          metadata: {
            email: email,
            reason: "invalid_password"
          }
        }
      }).catch(error => {
        console.error("Error logging failed login:", error)
      })

      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Verificar si el usuario está validado
    if (!user.validated) {
      return NextResponse.json(
        { error: "Tu cuenta está pendiente de validación. Contacta al administrador." },
        { status: 403 }
      )
    }

    // Login exitoso - registrar actividad
    const clientIP = await getClientIP()
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "login_success",
        description: `Usuario ${user.name} inició sesión exitosamente`,
        ipAddress: clientIP
      }
    }).catch(error => {
      console.error("Error logging successful login:", error)
    })

    // Crear nueva sesión
    await prisma.sessionLog.create({
      data: {
        userId: user.id,
        startTime: new Date(),
        ipAddress: clientIP
      }
    }).catch(error => {
      console.error("Error creating session log:", error)
    })

    // Retornar información del usuario (sin contraseña)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "Login exitoso",
      user: userWithoutPassword
    })

  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function POST(request: NextRequest, context: { params: Promise<{}> }) {
  const withCSRF = withCSRFProtection(loginHandler, { requireAuth: false })
  return await withCSRF(request)
}
