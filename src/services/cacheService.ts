// src/services/cacheService.ts


import { prisma } from "@/lib"
import { ProductWhereInput } from "@/types"
import { cache, cacheHelpers } from "@/lib/cache"
import logger from "@/lib/logger"

export class CacheService {
  // ============ PRODUCTOS ============
  
  static async getProduct(productId: string) {
    try {
      // Intentar obtener del caché primero
      let product = await cache.getProduct(productId)
      
      if (!product) {
        // Si no está en caché, obtener de la base de datos
        product = await prisma.product.findUnique({
          where: { id: productId, active: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            shortDescription: true,
            sku: true,
            basePrice: true,
            wholesalePrice: true,
            stock: true,
            minStock: true,
            maxStock: true,
            brand: true,
            unit: true,
            weight: true,
            dimensions: true,
            images: true,
            mainImage: true,
            active: true,
            featured: true,
            promotion: true,
            promotionPrice: true,
            promotionStart: true,
            promotionEnd: true,
            metaTitle: true,
            metaDescription: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image: true
              }
            }
          }
        })

        if (product) {
          // Guardar en caché
          await cache.setProduct(productId, product, cacheHelpers.TTL.PRODUCT_DETAIL)
        }
      }

      return product
    } catch (error) {
      logger.error('Error getting product from cache:', error)
      // Fallback a base de datos sin caché
      return await prisma.product.findUnique({
        where: { id: productId, active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          shortDescription: true,
          sku: true,
          basePrice: true,
          wholesalePrice: true,
          stock: true,
          minStock: true,
          maxStock: true,
          brand: true,
          unit: true,
          weight: true,
          dimensions: true,
          images: true,
          mainImage: true,
          active: true,
          featured: true,
          promotion: true,
          promotionPrice: true,
          promotionStart: true,
          promotionEnd: true,
          metaTitle: true,
          metaDescription: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              image: true
            }
          }
        }
      })
    }
  }

  static async getProducts(filters?: {
    categoryId?: string
    active?: boolean
    featured?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      const cacheKey = cacheHelpers.keys.products(filters)
      
      // Intentar obtener del caché
      let products = await cache.getProducts(
        filters?.categoryId,
        filters?.active,
        filters?.featured
      )

      if (!products) {
        // Construir query optimizada
        const where: ProductWhereInput = {}
        
        if (filters?.categoryId) {
          where.categoryId = filters.categoryId
        }
        
        if (filters?.active !== undefined) {
          where.active = filters.active
        }
        
        if (filters?.featured !== undefined) {
          where.featured = filters.featured
        }

        products = await prisma.product.findMany({
          where,
          select: {
            id: true,
            name: true,
            slug: true,
            shortDescription: true,
            sku: true,
            basePrice: true,
            wholesalePrice: true,
            stock: true,
            brand: true,
            unit: true,
            mainImage: true,
            active: true,
            featured: true,
            promotion: true,
            promotionPrice: true,
            promotionStart: true,
            promotionEnd: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          },
          orderBy: [
            { featured: 'desc' },
            { createdAt: 'desc' }
          ],
          take: filters?.limit || 50,
          skip: filters?.offset || 0
        })

        // Guardar en caché
        await cache.setProducts(
          products as any[],
          filters?.categoryId,
          filters?.active,
          filters?.featured,
          cacheHelpers.TTL.PRODUCTS
        )
      }

      return products
    } catch (error) {
      logger.error('Error getting products from cache:', error)
      // Fallback a base de datos sin caché
      const where: ProductWhereInput = {}
      
      if (filters?.categoryId) {
        where.categoryId = filters.categoryId
      }
      
      if (filters?.active !== undefined) {
        where.active = filters.active
      }
      
      if (filters?.featured !== undefined) {
        where.featured = filters.featured
      }

      return await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          sku: true,
          basePrice: true,
          wholesalePrice: true,
          stock: true,
          brand: true,
          unit: true,
          mainImage: true,
          active: true,
          featured: true,
          promotion: true,
          promotionPrice: true,
          promotionStart: true,
          promotionEnd: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ],
        take: filters?.limit || 50,
        skip: filters?.offset || 0
      })
    }
  }

  static async invalidateProductCache(productId?: string) {
    try {
      if (productId) {
        await cache.deleteProduct(productId)
      } else {
        await cache.invalidateProductCache()
      }
      logger.info(`Product cache invalidated for: ${productId || 'all products'}`)
    } catch (error) {
      logger.error('Error invalidating product cache:', error)
    }
  }

  // ============ CATEGORÍAS ============

  static async getCategories() {
    try {
      // Intentar obtener del caché
      let categories = await cache.getCategories()

      if (!categories) {
        // Obtener de la base de datos
        categories = await prisma.category.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            order: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                products: {
                  where: { active: true }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        })

        // Guardar en caché
        await cache.setCategories(categories as any[], cacheHelpers.TTL.CATEGORIES)
      }

      return categories
    } catch (error) {
      logger.error('Error getting categories from cache:', error)
      // Fallback a base de datos sin caché
      return await prisma.category.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          order: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              products: {
                where: { active: true }
              }
            }
          }
        },
        orderBy: { order: 'asc' }
      })
    }
  }

  static async getCategory(categoryId: string) {
    try {
      // Intentar obtener del caché
      let category = await cache.getCategory(categoryId)

      if (!category) {
        // Obtener de la base de datos
        category = await prisma.category.findUnique({
          where: { id: categoryId, active: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            order: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            products: {
              where: { active: true },
              select: {
                id: true,
                name: true,
                slug: true,
                shortDescription: true,
                sku: true,
                basePrice: true,
                wholesalePrice: true,
                stock: true,
                brand: true,
                unit: true,
                mainImage: true,
                featured: true,
                promotion: true,
                promotionPrice: true
              },
              orderBy: [
                { featured: 'desc' },
                { createdAt: 'desc' }
              ]
            }
          }
        })

        if (category) {
          // Guardar en caché
          await cache.setCategory(categoryId, category, cacheHelpers.TTL.CATEGORIES)
        }
      }

      return category
    } catch (error) {
      logger.error('Error getting category from cache:', error)
      // Fallback a base de datos sin caché
      return await prisma.category.findUnique({
        where: { id: categoryId, active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          order: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          products: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              slug: true,
              shortDescription: true,
              sku: true,
              basePrice: true,
              wholesalePrice: true,
              stock: true,
              brand: true,
              unit: true,
              mainImage: true,
              featured: true,
              promotion: true,
              promotionPrice: true
            },
            orderBy: [
              { featured: 'desc' },
              { createdAt: 'desc' }
            ]
          }
        }
      })
    }
  }

  static async invalidateCategoryCache(categoryId?: string) {
    try {
      if (categoryId) {
        await cache.deleteCategory(categoryId)
      } else {
        await cache.invalidateCategoryCache()
      }
      logger.info(`Category cache invalidated for: ${categoryId || 'all categories'}`)
    } catch (error) {
      logger.error('Error invalidating category cache:', error)
    }
  }

  // ============ CARRITO ============

  static async getUserCart(userId: string) {
    try {
      const cacheKey = cacheHelpers.keys.userCart(userId)
      
      // Intentar obtener del caché (TTL corto para carritos)
      let cart = await cache.get(cacheKey)

      if (!cart) {
        // Obtener de la base de datos
        cart = await prisma.cart.findUnique({
          where: { userId },
          select: {
            id: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            items: {
              select: {
                id: true,
                productId: true,
                quantity: true,
                unitPrice: true,
                discount: true,
                createdAt: true,
                updatedAt: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    mainImage: true,
                    unit: true,
                    brand: true,
                    stock: true,
                    active: true,
                    category: {
                      select: { 
                        name: true, 
                        slug: true 
                      }
                    }
                  }
                }
              }
            }
          }
        })

        if (cart) {
          // Guardar en caché por 5 minutos
          await cache.set(cacheKey, cart, 300)
        }
      }

      return cart
    } catch (error) {
      logger.error('Error getting user cart from cache:', error)
      // Fallback a base de datos sin caché
      return await prisma.cart.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              discount: true,
              createdAt: true,
              updatedAt: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  mainImage: true,
                  unit: true,
                  brand: true,
                  stock: true,
                  active: true,
                  category: {
                    select: { 
                      name: true, 
                      slug: true 
                    }
                  }
                }
              }
            }
          }
        }
      })
    }
  }

  static async invalidateUserCart(userId: string) {
    try {
      const cacheKey = cacheHelpers.keys.userCart(userId)
      await cache.del(cacheKey)
      logger.info(`Cart cache invalidated for user: ${userId}`)
    } catch (error) {
      logger.error('Error invalidating user cart cache:', error)
    }
  }

  // ============ ESTADÍSTICAS ============

  static async getCacheStats() {
    try {
      return await cache.getStats()
    } catch (error) {
      logger.error('Error getting cache stats:', error)
      return null
    }
  }

  static async clearAllCache() {
    try {
      await cache.clearAll()
      logger.info('All cache cleared successfully')
    } catch (error) {
      logger.error('Error clearing all cache:', error)
    }
  }
}
