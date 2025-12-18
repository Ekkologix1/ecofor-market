import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateEnv, getEnv, isDevelopment, isProduction, isRedisConfigured, getRateLimitConfig } from '@/lib/env-validation'

// Mock de process.env
const originalEnv = process.env

describe('Validación de Variables de Entorno', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Validación básica', () => {
    it('debe validar configuración mínima requerida', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        NODE_ENV: 'test'
      }

      expect(() => validateEnv()).not.toThrow()
    })

    it('debe rechazar DATABASE_URL inválida', () => {
      process.env = {
        DATABASE_URL: 'invalid-url',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        NODE_ENV: 'test'
      }

      expect(() => validateEnv()).toThrow('Variables de entorno inválidas')
    })

    it('debe rechazar NEXTAUTH_URL inválida', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'invalid-url',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        NODE_ENV: 'test'
      }

      expect(() => validateEnv()).toThrow('Variables de entorno inválidas')
    })

    it('debe rechazar NEXTAUTH_SECRET muy corta', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'short',
        NODE_ENV: 'test'
      }

      expect(() => validateEnv()).toThrow('Variables de entorno inválidas')
    })
  })

  describe('Configuración de Redis', () => {
    it('debe detectar Redis configurado con Upstash', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'token123',
        NODE_ENV: 'test'
      }

      validateEnv()
      expect(isRedisConfigured()).toBe(true)
    })

    it('debe detectar Redis configurado con URL local', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        REDIS_URL: 'redis://localhost:6379',
        NODE_ENV: 'test'
      }

      validateEnv()
      expect(isRedisConfigured()).toBe(true)
    })

    it('debe detectar Redis no configurado', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        NODE_ENV: 'test'
      }

      validateEnv()
      expect(isRedisConfigured()).toBe(false)
    })
  })

  describe('Configuración de Rate Limiting', () => {
    it('debe obtener configuración por defecto', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        NODE_ENV: 'test'
      }

      validateEnv()
      const config = getRateLimitConfig()
      
      expect(config.enabled).toBe(false)
      expect(config.requests).toBe(100)
      expect(config.window).toBe(60)
    })

    it('debe obtener configuración personalizada', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        RATE_LIMIT_ENABLED: 'true',
        RATE_LIMIT_REQUESTS: '50',
        RATE_LIMIT_WINDOW: '30',
        NODE_ENV: 'test'
      }

      validateEnv()
      const config = getRateLimitConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.requests).toBe(50)
      expect(config.window).toBe(30)
    })
  })

  describe('Detección de entorno', () => {
    it('debe detectar desarrollo', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        NODE_ENV: 'development'
      }

      validateEnv()
      expect(isDevelopment()).toBe(true)
      expect(isProduction()).toBe(false)
    })

    it('debe detectar producción', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        NODE_ENV: 'production'
      }

      validateEnv()
      expect(isDevelopment()).toBe(false)
      expect(isProduction()).toBe(true)
    })
  })

  describe('Variables opcionales', () => {
    it('debe manejar variables opcionales correctamente', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        LOG_LEVEL: 'debug',
        APP_NAME: 'Test App',
        APP_VERSION: '2.0.0',
        NODE_ENV: 'test'
      }

      const env = validateEnv()
      
      expect(env.LOG_LEVEL).toBe('debug')
      expect(env.APP_NAME).toBe('Test App')
      expect(env.APP_VERSION).toBe('2.0.0')
    })

    it('debe usar valores por defecto para variables opcionales', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'super-secret-key-with-at-least-32-characters',
        NODE_ENV: 'test'
      }

      const env = validateEnv()
      
      expect(env.APP_NAME).toBe('ECOFOR Market')
      expect(env.APP_VERSION).toBe('1.0.0')
      expect(env.LOG_LEVEL).toBeUndefined()
    })
  })
})
