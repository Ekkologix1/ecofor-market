import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextRequest, NextResponse } from "next/server"
import { LogMetadata } from '@/types'

// Logger simple para Edge Runtime
const edgeLogger = {
  debug: (msg: string, meta?: LogMetadata) => console.log(`[DEBUG] ${msg}`, meta || ''),
  info: (msg: string, meta?: LogMetadata) => console.log(`[INFO] ${msg}`, meta || ''),
  warn: (msg: string, meta?: LogMetadata) => console.log(`[WARN] ${msg}`, meta || ''),
  error: (msg: string, meta?: LogMetadata) => console.log(`[ERROR] ${msg}`, meta || '')
}

// Tipos para los rate limiters
type RateLimiterType = Ratelimit | null

interface RateLimiters {
  login: RateLimiterType
  register: RateLimiterType
  checkout: RateLimiterType
  api: RateLimiterType
  upload: RateLimiterType
}

// Clase singleton para manejar el rate limiter
class RateLimiterService {
  private static instance: RateLimiterService
  private redis: Redis | null = null
  private redisAvailable = false
  private initializationPromise: Promise<boolean> | null = null
  private rateLimiters: RateLimiters = {
    login: null,
    register: null,
    checkout: null,
    api: null,
    upload: null,
  }

  private constructor() {
    // Inicialización privada para singleton
  }

  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService()
    }
    return RateLimiterService.instance
  }

  // Inicialización asíncrona con manejo robusto de errores
  public async initialize(): Promise<boolean> {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this._initializeRedis()
    return this.initializationPromise
  }

  private async _initializeRedis(): Promise<boolean> {
    try {
      // Verificar configuración de Redis
      const hasUpstashConfig = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      const hasLocalRedis = process.env.REDIS_URL

      if (hasUpstashConfig) {
        // Usar Upstash Redis
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
        edgeLogger.info("Configurando Upstash Redis para rate limiting")
      } else if (hasLocalRedis) {
        // Usar Redis local
        this.redis = new Redis({
          url: process.env.REDIS_URL!,
          token: undefined, // Redis local no requiere token
        })
        edgeLogger.info("Configurando Redis local para rate limiting")
      } else {
        edgeLogger.warn("No se encontraron variables de entorno de Redis - rate limiting deshabilitado")
        this.redisAvailable = false
        return false
      }

      // Probar la conexión con timeout
      const connectionTest = Promise.race([
        this.redis.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Redis connection timeout")), 5000)
        )
      ])

      await connectionTest
      this.redisAvailable = true
      this._createRateLimiters()
      
      edgeLogger.info("Redis conectado exitosamente para rate limiting")
      return true

    } catch (error) {
      edgeLogger.error("Error conectando a Redis:", { error: String(error) })
      this.redis = null
      this.redisAvailable = false
      this._createRateLimiters() // Crear limiters null
      return false
    }
  }

  private _createRateLimiters(): void {
    if (!this.redis || !this.redisAvailable) {
      this.rateLimiters = {
        login: null,
        register: null,
        checkout: null,
        api: null,
        upload: null,
      }
      return
    }

    try {
      this.rateLimiters = {
        // Login: 50 intentos por minuto por IP en desarrollo, 5 en producción
        login: new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(
            process.env.NODE_ENV === "development" ? 50 : 5, 
            "1 m"
          ),
          analytics: true,
          prefix: "login",
        }),

        // Registro: 3 intentos por 10 minutos por IP
        register: new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(3, "10 m"),
          analytics: true,
          prefix: "register",
        }),

        // Checkout/Orders: 10 pedidos por hora por usuario
        checkout: new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(10, "1 h"),
          analytics: true,
          prefix: "checkout",
        }),

        // API general: 1000 requests por 15 minutos por IP (más permisivo en desarrollo)
        api: new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(
            process.env.NODE_ENV === "development" ? 1000 : 100, 
            "15 m"
          ),
          analytics: true,
          prefix: "api",
        }),

        // Upload de archivos: 5 uploads por hora por usuario
        upload: new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(5, "1 h"),
          analytics: true,
          prefix: "upload",
        }),
      }
    } catch (error) {
      edgeLogger.error("Error creando rate limiters:", { error: String(error) })
      this.rateLimiters = {
        login: null,
        register: null,
        checkout: null,
        api: null,
        upload: null,
      }
    }
  }

  // Getters para acceder a los rate limiters
  public getRateLimiters(): RateLimiters {
    return this.rateLimiters
  }

  public isRedisAvailable(): boolean {
    return this.redisAvailable
  }

  public getRedis(): Redis | null {
    return this.redis
  }

  // Método para reinicializar en caso de errores
  public async reinitialize(): Promise<boolean> {
    this.initializationPromise = null
    return this.initialize()
  }
}

// Instancia singleton
const rateLimiterService = RateLimiterService.getInstance()

// Inicialización lazy - solo cuando se necesite
let initializationPromise: Promise<boolean> | null = null

function getInitializationPromise(): Promise<boolean> {
  if (!initializationPromise) {
    initializationPromise = rateLimiterService.initialize().catch((error) => {
      edgeLogger.error("Error inicializando rate limiter:", error)
      initializationPromise = null // Reset para permitir reintentos
      return false
    })
  }
  return initializationPromise
}

// Exportar getters para mantener compatibilidad
export const rateLimiters = {
  get login() { return rateLimiterService.getRateLimiters().login },
  get register() { return rateLimiterService.getRateLimiters().register },
  get checkout() { return rateLimiterService.getRateLimiters().checkout },
  get api() { return rateLimiterService.getRateLimiters().api },
  get upload() { return rateLimiterService.getRateLimiters().upload },
}

// Función helper para aplicar rate limiting con manejo robusto de errores
export async function withRateLimit(
  request: NextRequest,
  limiter: Ratelimit | null,
  identifier?: string
): Promise<NextResponse | null> {
  try {
    // En desarrollo, deshabilitar completamente el rate limiting
    if (process.env.NODE_ENV === "development") {
      edgeLogger.debug("Rate limiting deshabilitado en desarrollo")
      return null
    }

    // Inicializar rate limiter si no está inicializado
    if (!rateLimiterService.isRedisAvailable()) {
      await getInitializationPromise()
    }

    // Si no hay limiter disponible después de inicializar, permitir la request
    if (!limiter) {
      return null
    }

    // Verificar que Redis esté disponible
    if (!rateLimiterService.isRedisAvailable()) {
      edgeLogger.debug("Redis no disponible, saltando rate limiting")
      return null
    }

    // Usar IP del cliente como identificador por defecto
    const ip = request.headers.get("x-forwarded-for") ?? 
               request.headers.get("x-real-ip") ?? 
               "unknown"
    const key = identifier || ip

    // Aplicar rate limiting con timeout
    const rateLimitPromise = limiter.limit(key)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Rate limit timeout")), 2000)
    )

    const { success, limit, reset, remaining } = await Promise.race([
      rateLimitPromise,
      timeoutPromise
    ]) as any

    if (!success) {
      const retryAfter = Math.max(1, Math.round((reset - Date.now()) / 1000))
      
      edgeLogger.warn(`Rate limit excedido para ${key}: ${remaining}/${limit} requests restantes`)
      
      return NextResponse.json(
        {
          error: "Demasiadas solicitudes. Intenta de nuevo más tarde.",
          retryAfter,
          limit,
          remaining,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
          },
        }
      )
    }

    // Log de información para debugging
    edgeLogger.debug(`Rate limit OK para ${key}: ${remaining}/${limit} requests restantes`)

    // No devolver response, continuar con la request
    return null

  } catch (error) {
    edgeLogger.error("Error en rate limiting:", { error: String(error) })
    
    // En caso de error, intentar reinicializar el servicio
    if (error instanceof Error && error.message.includes("timeout")) {
      edgeLogger.warn("Timeout en rate limiting, intentando reinicializar...")
      rateLimiterService.reinitialize().catch((reinitError) => {
        edgeLogger.error("Error reinicializando rate limiter:", reinitError)
      })
    }
    
    // Permitir la request para no bloquear el servicio
    return null
  }
}

// Función específica para endpoints de autenticación
export async function withAuthRateLimit(
  request: NextRequest,
  endpoint: "login" | "register"
): Promise<NextResponse | null> {
  const limiter = rateLimiters[endpoint]
  const ip = request.headers.get("x-forwarded-for") ?? 
             request.headers.get("x-real-ip") ?? 
             "unknown"
  
  return withRateLimit(request, limiter, ip)
}

// Función específica para endpoints de usuario autenticado
export async function withUserRateLimit(
  request: NextRequest,
  endpoint: "checkout" | "upload",
  userId: string
): Promise<NextResponse | null> {
  const limiter = rateLimiters[endpoint]
  
  return withRateLimit(request, limiter, userId)
}

// Función para endpoints API generales
export async function withApiRateLimit(
  request: NextRequest
): Promise<NextResponse | null> {
  return withRateLimit(request, rateLimiters.api)
}

// Función para obtener estado del rate limiter
export async function getRateLimiterStatus() {
  try {
    const isAvailable = rateLimiterService.isRedisAvailable()
    const redis = rateLimiterService.getRedis()
    
    if (isAvailable && redis) {
      // Probar la conexión
      await redis.ping()
      return {
        available: true,
        type: process.env.UPSTASH_REDIS_REST_URL ? "upstash" : "local",
        status: "connected"
      }
    }
    
    return {
      available: false,
      type: "none",
      status: "disconnected"
    }
  } catch (error) {
    edgeLogger.error("Error verificando estado del rate limiter:", { error: String(error) })
    return {
      available: false,
      type: "error",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

// Función para reinicializar el rate limiter manualmente
export async function reinitializeRateLimiter(): Promise<boolean> {
  try {
    return await rateLimiterService.reinitialize()
  } catch (error) {
    edgeLogger.error("Error reinicializando rate limiter:", { error: String(error) })
    return false
  }
}

// Configuración de rate limiting para desarrollo local - inicialización lazy
export function initializeRateLimiterForDevelopment(): void {
  if (process.env.NODE_ENV === "development") {
    // Solo inicializar cuando se necesite
    getInitializationPromise().then((success) => {
      if (success) {
        edgeLogger.info("Rate limiting habilitado en desarrollo - Redis conectado")
      } else {
        edgeLogger.warn("Rate limiting deshabilitado en desarrollo - Redis no disponible")
        edgeLogger.info("Para habilitar rate limiting en desarrollo:")
        edgeLogger.info("   1. Configura las variables de entorno UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN")
        edgeLogger.info("   2. O instala Redis localmente y configura REDIS_URL")
      }
    }).catch((error) => {
      edgeLogger.error("Error inicializando rate limiter en desarrollo:", error)
    })
  }
}
