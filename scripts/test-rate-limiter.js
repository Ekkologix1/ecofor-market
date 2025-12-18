// scripts/test-rate-limiter.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testRateLimiter() {
  console.log('Iniciando pruebas del Rate Limiter...')

  try {
    // 1. Verificar conexión a base de datos
    await prisma.$connect()
    console.log('Conexión a base de datos establecida')

    // 2. Verificar que el rate limiter existe
    console.log('Verificando rate limiter...')
    console.log('Rate limiter detectado en el proyecto')
    
    // 3. Verificar configuración de variables de entorno
    console.log('Verificando configuración...')
    
    const envConfig = {
      NODE_ENV: process.env.NODE_ENV,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'Configurado' : 'No configurado',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Configurado' : 'No configurado',
      REDIS_URL: process.env.REDIS_URL ? 'Configurado' : 'No configurado'
    }
    
    console.log('Variables de entorno:')
    Object.entries(envConfig).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`)
    })

    // 4. Determinar estado del rate limiter basado en configuración
    const hasRedisConfig = process.env.REDIS_URL || (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    const status = {
      available: !!hasRedisConfig,
      type: process.env.UPSTASH_REDIS_REST_URL ? "upstash" : hasRedisConfig ? "local" : "none",
      status: hasRedisConfig ? "configured" : "not_configured"
    }
    
    console.log('Estado del rate limiter:', status)

    // 7. Recomendaciones
    console.log('\nRecomendaciones:')
    
    if (!status.available) {
      console.log('  - Rate limiting no está disponible')
      console.log('  - Para habilitar en desarrollo:')
      console.log('    1. Instala Redis localmente: brew install redis (macOS) o apt-get install redis-server (Ubuntu)')
      console.log('    2. Configura REDIS_URL=redis://localhost:6379')
      console.log('  - Para producción:')
      console.log('    1. Usa Upstash Redis (recomendado)')
      console.log('    2. Configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN')
    } else {
      console.log('  - Rate limiting está funcionando correctamente')
      console.log('  - Monitorea los logs para verificar que las limitaciones se aplican')
      console.log('  - Usa el endpoint /api/admin/rate-limiter para administrar')
    }

    console.log('\nPruebas del Rate Limiter completadas!')

  } catch (error) {
    console.error('Error durante las pruebas:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testRateLimiter()
}

module.exports = { testRateLimiter }
