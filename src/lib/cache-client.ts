"use client"
// ============================================
// CLIENT CACHE SERVICE
// Servicio de caché simple para el lado del cliente
// ============================================


class ClientCacheService {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

  set(key: string, data: unknown, ttl: number = 300000) { // 5 minutos por defecto
    const timestamp = Date.now()
    this.cache.set(key, { data, timestamp, ttl })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string) {
    return this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  has(key: string) {
    const item = this.cache.get(key)
    if (!item) return false

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  size() {
    return this.cache.size
  }
}

export const clientCache = new ClientCacheService()
export default clientCache
