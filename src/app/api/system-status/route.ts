import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/system-status',
      status: 'checking'
    }

    // Test 1: Environment Variables
    results.environment = {
      nodeEnv: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
      vercelRegion: process.env.VERCEL_REGION,
      databaseUrl: process.env.DATABASE_URL ? '✅ Configurada' : '❌ Faltante',
      nextAuthUrl: process.env.NEXTAUTH_URL ? '✅ Configurada' : '❌ Faltante',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? '✅ Configurada' : '❌ Faltante'
    }

    // Test 2: Database Connection
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      await prisma.$queryRaw`SELECT 1`
      
      const userCount = await prisma.user.count()
      const productCount = await prisma.product.count()
      const cartCount = await prisma.cart.count()
      
      await prisma.$disconnect()
      
      results.database = {
        status: '✅ Conectada',
        userCount,
        productCount,
        cartCount
      }
    } catch (dbError) {
      results.database = {
        status: '❌ Error',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }
    }

    // Test 3: Session System
    try {
      let session
      try {
        session = await getServerSession(authOptions)
      } catch (sessionError: any) {
        // Si hay error de decripción JWT, indicarlo específicamente
        if (sessionError?.name === 'JWEDecryptionFailed' || sessionError?.message?.includes('decryption')) {
          results.session = {
            status: '⚠️  Token JWT inválido',
            error: 'Limpia las cookies del navegador para solucionar este problema',
            code: 'INVALID_JWT_TOKEN'
          }
        } else {
          throw sessionError
        }
        return NextResponse.json(results)
      }
      results.session = {
        status: session ? '✅ Activa' : '❌ Sin sesión',
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        userRole: session?.user?.role || null
      }
    } catch (sessionError) {
      results.session = {
        status: '❌ Error',
        error: sessionError instanceof Error ? sessionError.message : 'Unknown error'
      }
    }

    // Test 4: Service Imports
    results.services = {}
    
    try {
      const { CartService } = await import('@/services')
      results.services['CartService'] = '✅ Importado correctamente'
    } catch (serviceError) {
      results.services['CartService'] = `❌ Error: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`
    }
    
    try {
      const { UserService } = await import('@/services')
      results.services['UserService'] = '✅ Importado correctamente'
    } catch (serviceError) {
      results.services['UserService'] = `❌ Error: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`
    }
    
    try {
      const { ProductService } = await import('@/services')
      results.services['ProductService'] = '✅ Importado correctamente'
    } catch (serviceError) {
      results.services['ProductService'] = `❌ Error: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`
    }

    // Test 5: Middleware Imports
    results.middleware = {}
    
    try {
      const { withAuth } = await import('@/lib/middleware/auth')
      results.middleware['withAuth'] = '✅ Importado correctamente'
    } catch (middlewareError) {
      results.middleware['withAuth'] = `❌ Error: ${middlewareError instanceof Error ? middlewareError.message : 'Unknown error'}`
    }
    
    try {
      const { withAdminAuth } = await import('@/lib/middleware/auth')
      results.middleware['withAdminAuth'] = '✅ Importado correctamente'
    } catch (middlewareError) {
      results.middleware['withAdminAuth'] = `❌ Error: ${middlewareError instanceof Error ? middlewareError.message : 'Unknown error'}`
    }
    
    try {
      const { withCartRateLimit } = await import('@/lib/middleware/authWithRateLimit')
      results.middleware['withCartRateLimit'] = '✅ Importado correctamente'
    } catch (middlewareError) {
      results.middleware['withCartRateLimit'] = `❌ Error: ${middlewareError instanceof Error ? middlewareError.message : 'Unknown error'}`
    }
    
    try {
      const { withCSRFProtection } = await import('@/lib')
      results.middleware['withCSRFProtection'] = '✅ Importado correctamente'
    } catch (middlewareError) {
      results.middleware['withCSRFProtection'] = `❌ Error: ${middlewareError instanceof Error ? middlewareError.message : 'Unknown error'}`
    }

    // Test 6: Redis (if configured)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis')
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
        
        await redis.ping()
        results.redis = {
          status: '✅ Conectada',
          type: 'upstash'
        }
      } catch (redisError) {
        results.redis = {
          status: '❌ Error',
          error: redisError instanceof Error ? redisError.message : 'Unknown error'
        }
      }
    } else {
      results.redis = {
        status: '⚠️ No configurada',
        type: 'none'
      }
    }

    // Determine overall status
    const hasErrors = Object.values(results).some((value: any) => 
      typeof value === 'object' && value.status && value.status.includes('❌')
    )

    results.status = hasErrors ? '❌ Con errores' : '✅ Funcionando correctamente'

    return NextResponse.json(results)

  } catch (error) {
    console.error('System status API error:', error)
    return NextResponse.json(
      { 
        error: 'Error en diagnóstico del sistema',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        status: '❌ Error crítico'
      },
      { status: 500 }
    )
  }
}
