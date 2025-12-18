import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Validar que NEXTAUTH_SECRET esté configurado
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET no está configurado. La autenticación puede fallar.')
  console.warn('   Por favor, configura NEXTAUTH_SECRET en tu archivo .env.local')
  console.warn('   Debe tener al menos 32 caracteres.')
} else if (process.env.NEXTAUTH_SECRET.length < 32) {
  console.warn('⚠️  NEXTAUTH_SECRET es muy corto (mínimo 32 caracteres).')
  console.warn('   Esto puede causar errores de decripción JWT.')
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Importar Prisma dinámicamente para evitar errores de inicialización
          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          await prisma.$disconnect()

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid || !user.validated) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            type: user.type,
            role: user.role,
            validated: user.validated
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.type = user.type
        token.role = user.role
        token.validated = user.validated
        // NextAuth manejará automáticamente la expiración basándose en maxAge
      }
      return token
    },
    async session({ session, token }) {
      try {
        if (token) {
          session.user.id = token.sub!
          session.user.type = token.type as "NATURAL" | "EMPRESA"
          session.user.role = token.role as "USER" | "ADMIN" | "VENDEDOR"
          session.user.validated = token.validated as boolean
        }
        return session
      } catch (error) {
        // Si hay error al procesar la sesión (token inválido), retornar sesión vacía
        // Esto permite que el usuario pueda hacer login de nuevo
        console.error('Error procesando sesión:', error)
        return session
      }
    },
    async redirect({ url, baseUrl }) {
      // Si hay una URL específica y no es solo la base
      if (url && url !== baseUrl && url !== `${baseUrl}/`) {
        // Si es relativa, convertir a absoluta
        if (url.startsWith("/")) return `${baseUrl}${url}`
        // Si es absoluta y del mismo dominio, permitirla
        try {
          if (new URL(url).origin === baseUrl) return url
        } catch {
          // Si hay error parseando la URL, usar baseUrl
        }
      }
      
      // Por defecto, redirigir al dashboard
      return `${baseUrl}/dashboard`
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login"
  },
  session: {
    strategy: "jwt",
    // Aumentar tiempo de expiración para mantener sesión más tiempo
    // En desarrollo: 7 días, en producción: 30 días
    maxAge: process.env.NODE_ENV === "development" ? 7 * 24 * 60 * 60 : 30 * 24 * 60 * 60, // 7 días en dev, 30 días en prod
  },
  // Configurar cookies para que sean persistentes
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Hacer la cookie persistente (30 días)
        maxAge: 30 * 24 * 60 * 60, // 30 días
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  // Manejar errores de JWT de forma más elegante
  events: {
    async signIn({ user, account, profile }) {
      // Log exitoso de login
      if (process.env.NODE_ENV === "development") {
        console.log('✅ Login exitoso:', user.email)
      }
    },
    async signOut({ session, token }) {
      // Log de logout
      if (process.env.NODE_ENV === "development") {
        console.log('👋 Usuario cerró sesión')
      }
    },
    async session({ session, token }) {
      // Si hay error con el token, la sesión será null
      // Esto es manejado por el callback de session
    }
  },
  // Configuración adicional para manejar errores JWT
  logger: {
    error(code, metadata) {
      // Suprimir logs de errores JWT en producción o reducir verbosidad
      if (code === 'JWT_SESSION_ERROR' || code === 'JWT_DECRYPTION_ERROR') {
        if (process.env.NODE_ENV === "development") {
          console.warn(`⚠️  NextAuth ${code}:`, metadata?.message || 'Token JWT inválido. Limpia las cookies del navegador.')
        }
        // No loguear en producción para evitar spam
        return
      }
      // Otros errores se loguean normalmente
      console.error('NextAuth error:', code, metadata)
    }
  }
}
