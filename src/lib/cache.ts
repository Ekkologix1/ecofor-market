// src/lib/cache.ts
import { Redis } from '@upstash/redis'
import logger from './logger'

class CacheService {
  private client: Redis | null = null
  private isConnected = false

  constructor() {
    this.initializeClient()
  }

  private async initializeClient() {
    try {
      // Usar Upstash Redis si está disponible, sino deshabilitar cache
      const hasUpstashConfig = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      
      if (hasUpstashConfig) {
        this.client = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
        this.isConnected = true
        logger.info('Cache service initialized with Upstash Redis')
      } else {
        logger.warn('Cache service disabled - Upstash Redis not configured')
        this.client = null
        this.isConnected = false
      }

    } catch (error) {
      logger.error('Failed to initialize Redis client:', error)
      this.client = null
      this.isConnected = false
    }
  }

  private async ensureConnection() {
    if (!this.client || !this.isConnected) {
      return false
    }
    return true
  }

  // Métodos genéricos de caché
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!await this.ensureConnection()) return null

      const value = await this.client!.get(key)
      return value ? JSON.parse(value as string) : null
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!await this.ensureConnection()) return false

      const serialized = JSON.stringify(value)
      
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, serialized)
      } else {
        await this.client!.set(key, serialized)
      }
      
      return true
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!await this.ensureConnection()) return false

      await this.client!.del(key)
      return true
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!await this.ensureConnection()) return false

      const result = await this.client!.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error)
      return false
    }
  }

  // Métodos específicos para productos y categorías
  async getProduct(productId: string) {
    return this.get(`product:${productId}`)
  }

  async setProduct(productId: string, product: unknown, ttlSeconds = 3600) {
    return this.set(`product:${productId}`, product, ttlSeconds)
  }

  async deleteProduct(productId: string) {
    await this.del(`product:${productId}`)
    await this.del('products:all')
    await this.del('products:active')
    await this.del('products:featured')
  }

  async getProducts(categoryId?: string, active?: boolean, featured?: boolean) {
    let key = 'products'
    if (categoryId) key += `:category:${categoryId}`
    if (active) key += ':active'
    if (featured) key += ':featured'
    
    return this.get(key)
  }

  async setProducts(products: unknown[], categoryId?: string, active?: boolean, featured?: boolean, ttlSeconds = 1800) {
    let key = 'products'
    if (categoryId) key += `:category:${categoryId}`
    if (active) key += ':active'
    if (featured) key += ':featured'
    
    return this.set(key, products, ttlSeconds)
  }

  async getCategories() {
    return this.get('categories:all')
  }

  async setCategories(categories: unknown[], ttlSeconds = 3600) {
    return this.set('categories:all', categories, ttlSeconds)
  }

  async deleteCategory(categoryId: string) {
    await this.del(`category:${categoryId}`)
    await this.del('categories:all')
  }

  async getCategory(categoryId: string) {
    return this.get(`category:${categoryId}`)
  }

  async setCategory(categoryId: string, category: unknown, ttlSeconds = 3600) {
    return this.set(`category:${categoryId}`, category, ttlSeconds)
  }

  // Métodos para invalidar caché relacionado
  async invalidateProductCache() {
    try {
      if (!await this.ensureConnection()) return

      // Obtener todas las claves de productos
      const keys = await this.client!.keys('product:*')
      const productListKeys = await this.client!.keys('products:*')
      
      const allKeys = [...keys, ...productListKeys]
      
      if (allKeys.length > 0) {
        // Upstash Redis requiere eliminar las claves una por una o usar un pipeline
        for (const key of allKeys) {
          await this.client!.del(key)
        }
        logger.info(`Invalidated ${allKeys.length} product cache keys`)
      }
    } catch (error) {
      logger.error('Error invalidating product cache:', error)
    }
  }

  async invalidateCategoryCache() {
    try {
      if (!await this.ensureConnection()) return

      const keys = await this.client!.keys('category:*')
      const categoryListKeys = await this.client!.keys('categories:*')
      
      const allKeys = [...keys, ...categoryListKeys]
      
      if (allKeys.length > 0) {
        // Upstash Redis requiere eliminar las claves una por una
        for (const key of allKeys) {
          await this.client!.del(key)
        }
        logger.info(`Invalidated ${allKeys.length} category cache keys`)
      }
    } catch (error) {
      logger.error('Error invalidating category cache:', error)
    }
  }

  // Método para limpiar todo el caché
  async clearAll() {
    try {
      if (!await this.ensureConnection()) return

      // Para Upstash Redis, necesitamos obtener todas las claves y eliminarlas
      const keys = await this.client!.keys('*')
      if (keys.length > 0) {
        for (const key of keys) {
          await this.client!.del(key)
        }
      }
      logger.info('Cache cleared successfully')
    } catch (error) {
      logger.error('Error clearing cache:', error)
    }
  }

  // Método para obtener estadísticas del caché
  async getStats() {
    try {
      if (!await this.ensureConnection()) return null

      const keys = await this.client!.keys('*')
      
      return {
        connected: this.isConnected,
        dbSize: keys.length,
        memoryInfo: 'Upstash Redis - Memory info not available'
      }
    } catch (error) {
      logger.error('Error getting cache stats:', error)
      return null
    }
  }

  async disconnect() {
    // Upstash Redis no requiere desconexión explícita
    this.client = null
    this.isConnected = false
  }
}

// Instancia singleton
export const cache = new CacheService()

// Helper functions para uso común
export const cacheHelpers = {
  // TTL por defecto en segundos
  TTL: {
    PRODUCTS: 1800,      // 30 minutos
    CATEGORIES: 3600,    // 1 hora
    PRODUCT_DETAIL: 3600, // 1 hora
    USER_SESSION: 86400,  // 24 horas
    API_RESPONSE: 300     // 5 minutos
  },

  // Generar claves de caché
  keys: {
    product: (id: string) => `product:${id}`,
    products: (filters?: { categoryId?: string; active?: boolean; featured?: boolean }) => {
      let key = 'products'
      if (filters?.categoryId) key += `:category:${filters.categoryId}`
      if (filters?.active) key += ':active'
      if (filters?.featured) key += ':featured'
      return key
    },
    categories: () => 'categories:all',
    category: (id: string) => `category:${id}`,
    userSession: (userId: string) => `user:session:${userId}`,
    userCart: (userId: string) => `user:cart:${userId}`,
    userOrders: (userId: string, filters?: string) => `user:orders:${userId}${filters ? `:${filters}` : ''}`
  }
}
