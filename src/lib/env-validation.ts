import { z } from 'zod'

/**
 * Validación centralizada de variables de entorno
 * Previene errores de configuración y mejora la seguridad
 */

// Esquema de validación para variables de entorno
const envSchema = z.object({
  // Base de datos
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL debe ser una URL válida'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET debe tener al menos 32 caracteres'),
  
  // Redis (opcional en desarrollo)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  
  // Email (opcional)
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional(),
  
  // Desarrollo
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Configuración específica de la aplicación
  APP_NAME: z.string().default('ECOFOR Market'),
  APP_VERSION: z.string().default('1.0.0'),
  
  // Configuración de uploads
  MAX_FILE_SIZE: z.string().default('10485760'), // 10MB
  ALLOWED_FILE_TYPES: z.string().default('xlsx,xls,csv'),
  
  // Configuración de rate limiting
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default(false),
  RATE_LIMIT_REQUESTS: z.string().transform(val => parseInt(val)).default(100),
  RATE_LIMIT_WINDOW: z.string().transform(val => parseInt(val)).default(60),
})

// Tipo inferido del esquema
export type EnvConfig = z.infer<typeof envSchema>

// Variable para almacenar la configuración validada
let validatedEnv: EnvConfig | null = null

/**
 * Valida y carga las variables de entorno
 * Solo se ejecuta una vez por proceso
 */
export function validateEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv
  }

  try {
    validatedEnv = envSchema.parse(process.env)
    
    // Log de configuración en desarrollo
    if (validatedEnv.NODE_ENV === 'development') {
      console.log('✅ Variables de entorno validadas correctamente')
      console.log('📋 Configuración cargada:', {
        nodeEnv: validatedEnv.NODE_ENV,
        appName: validatedEnv.APP_NAME,
        appVersion: validatedEnv.APP_VERSION,
        hasRedis: !!(validatedEnv.UPSTASH_REDIS_REST_URL || validatedEnv.REDIS_URL),
        hasEmail: !!validatedEnv.EMAIL_SERVER_HOST,
        rateLimitEnabled: validatedEnv.RATE_LIMIT_ENABLED,
        logLevel: validatedEnv.LOG_LEVEL || 'info'
      })
    }
    
    return validatedEnv
  } catch (error) {
    console.error('❌ Error validando variables de entorno:')
    
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error('  - Error desconocido:', error)
    }
    
    console.error('\n🔧 Variables de entorno requeridas:')
    console.error('  - DATABASE_URL: URL de conexión a la base de datos')
    console.error('  - NEXTAUTH_URL: URL de la aplicación')
    console.error('  - NEXTAUTH_SECRET: Clave secreta para NextAuth (mínimo 32 caracteres)')
    
    console.error('\n📚 Variables de entorno opcionales:')
    console.error('  - UPSTASH_REDIS_REST_URL / REDIS_URL: Para cache y rate limiting')
    console.error('  - EMAIL_*: Para envío de emails')
    console.error('  - LOG_LEVEL: Nivel de logging (error, warn, info, debug)')
    
    throw new Error('Variables de entorno inválidas. Revisa la configuración.')
  }
}

/**
 * Obtiene la configuración validada de variables de entorno
 * Si no está validada, la valida automáticamente
 */
export function getEnv(): EnvConfig {
  return validateEnv()
}

/**
 * Obtiene una variable de entorno específica
 * @param key - Clave de la variable de entorno
 * @returns Valor de la variable o undefined si no existe
 */
export function getEnvVar<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  return getEnv()[key]
}

/**
 * Verifica si estamos en desarrollo
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development'
}

/**
 * Verifica si estamos en producción
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production'
}

/**
 * Verifica si Redis está configurado
 */
export function isRedisConfigured(): boolean {
  const env = getEnv()
  return !!(env.UPSTASH_REDIS_REST_URL || env.REDIS_URL)
}

/**
 * Verifica si el sistema de email está configurado
 */
export function isEmailConfigured(): boolean {
  const env = getEnv()
  return !!(env.EMAIL_SERVER_HOST && env.EMAIL_SERVER_USER && env.EMAIL_SERVER_PASSWORD)
}

/**
 * Obtiene la configuración de rate limiting
 */
export function getRateLimitConfig() {
  const env = getEnv()
  return {
    enabled: env.RATE_LIMIT_ENABLED,
    requests: env.RATE_LIMIT_REQUESTS,
    window: env.RATE_LIMIT_WINDOW
  }
}

/**
 * Obtiene la configuración de uploads
 */
export function getUploadConfig() {
  const env = getEnv()
  return {
    maxFileSize: parseInt(env.MAX_FILE_SIZE),
    allowedFileTypes: env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim())
  }
}

// Validar automáticamente al importar el módulo (solo si no estamos en tests)
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnv()
  } catch (error) {
    // En desarrollo, solo mostrar warning
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Variables de entorno no validadas correctamente')
    } else {
      // En producción, fallar inmediatamente
      throw error
    }
  }
}
