import { prisma, NotFoundError, executePaginatedQuery, type PaginatedResponse } from "@/lib"
import { ProductWhereInput, PrismaDecimal, toNumber, convertDecimalFields, convertDecimalFieldsSingle } from "@/types"
// src/services/productService.ts




// Interfaces para tipos
export interface ProductFilters {
  category?: string
  brand?: string
  featured?: boolean
  active?: boolean
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  page?: number
  limit?: number
}

export interface ProductSelectFields {
  id: boolean
  name: boolean
  slug: boolean
  shortDescription: boolean
  sku: boolean
  basePrice: boolean
  wholesalePrice: boolean
  stock: boolean
  brand: boolean
  unit: boolean
  featured: boolean
  active: boolean
  category?: boolean
  images?: boolean
}

export interface ProductWithCategory {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  sku: string
  basePrice: PrismaDecimal
  wholesalePrice: PrismaDecimal | null
  stock: number
  brand: string | null
  unit: string | null
  featured: boolean
  active: boolean
  category: {
    name: string
    slug: string
  } | null
}

export interface CategoryWithCount {
  id: string
  name: string
  slug: string
  description: string | null
  _count: {
    products: number
  }
}

export class ProductService {
  // Calcular precio según tipo de usuario
  static calculatePrice(product: {
    basePrice: number
    wholesalePrice?: number
  }, userType?: string): number {
    if (userType === 'EMPRESA' && product.wholesalePrice) {
      return Number(product.wholesalePrice)
    }
    return Number(product.basePrice)
  }

  // Verificar si un producto está en promoción
  static isOnPromotion(product: {
    promotion?: {
      startDate: Date
      endDate: Date
    } | null
    promotionPrice?: number | null
  }): boolean {
    if (!product.promotion || !product.promotionPrice) return false
    
    const now = new Date()
    const startDate = product.promotion?.startDate ? new Date(product.promotion.startDate) : null
    const endDate = product.promotion?.endDate ? new Date(product.promotion.endDate) : null
    
    if (startDate && now < startDate) return false
    if (endDate && now > endDate) return false
    
    return true
  }

  // Obtener precio final (considerando promociones)
  static getFinalPrice(product: {
    basePrice: number
    wholesalePrice?: number
    promotion?: {
      startDate: Date
      endDate: Date
    } | null
    promotionPrice?: number | null
  }, userType?: string): number {
    // Si está en promoción, usar precio promocional
    if (this.isOnPromotion(product)) {
      return Number(product.promotionPrice)
    }
    
    // Si no, usar precio según tipo de usuario
    return this.calculatePrice(product, userType)
  }

  // Obtener todos los productos con filtros opcionales
  static async getAllProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<any>> {
    const {
      category,
      brand,
      featured,
      active = true,
      search,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 20
    } = filters

    // Construir condiciones de filtro
    const where: ProductWhereInput = {}
    
    if (active !== undefined) {
      where.active = active
    }
    
    if (brand) {
      where.brand = brand
    }
    
    if (featured !== undefined) {
      where.featured = featured
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {}
      if (minPrice !== undefined) {
        where.basePrice.gte = minPrice
      }
      if (maxPrice !== undefined) {
        where.basePrice.lte = maxPrice
      }
    }
    
    if (inStock) {
      where.stock = {
        gt: 0
      }
    }

    // Manejar filtros de categoría y búsqueda
    if (category && search) {
      // Si hay tanto categoría como búsqueda, usar AND
      where.AND = [
        {
          category: {
            slug: category
          }
        },
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { shortDescription: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    } else if (category) {
      // Solo filtro de categoría
      where.category = {
        slug: category
      }
    } else if (search) {
      // Solo filtro de búsqueda
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        {
          category: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    // Usar la función de paginación centralizada
    const result = await executePaginatedQuery(
      (options) => prisma.product.findMany({
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
          minStock: true,
          brand: true,
          unit: true,
          weight: true,
          dimensions: true,
          images: true,
          mainImage: true,
          featured: true,
          active: true,
          promotion: true,
          promotionPrice: true,
          promotionStart: true,
          promotionEnd: true,
          tags: true,
          category: {
            select: {
              name: true,
              slug: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' }, // Productos destacados primero
          { name: 'asc' }       // Luego por nombre alfabético
        ],
        ...options
      }),
      () => prisma.product.count({ where }),
      { page, limit }
    )

    // Convertir Decimal a number para JSON
    const productsFormatted = convertDecimalFields(result.data, ['basePrice', 'wholesalePrice', 'promotionPrice', 'weight'])

    return {
      ...result,
      data: productsFormatted
    }
  }

  // Obtener producto por ID con información completa
  static async getProductById(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        }
      }
    })

    if (!product) {
      return null
    }

    // Convertir Decimal a number
    return convertDecimalFieldsSingle(product, ['basePrice', 'wholesalePrice'])
  }

  // Obtener producto por slug
  static async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        }
      }
    })

    if (!product) {
      return null
    }

    // Convertir Decimal a number
    return convertDecimalFieldsSingle(product, ['basePrice', 'wholesalePrice'])
  }

  // Obtener productos destacados
  static async getFeaturedProducts(limit: number = 8) {
    const products = await prisma.product.findMany({
      where: {
        featured: true,
        active: true
      },
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
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: limit
    })

    // Convertir Decimal a number
    return convertDecimalFields(products, ['basePrice', 'wholesalePrice'])
  }

  // Obtener productos relacionados (misma categoría)
  static async getRelatedProducts(productId: string, limit: number = 4) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true }
    })

    if (!product || !product.categoryId) {
      return []
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        active: true
      },
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
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: limit
    })

    // Convertir Decimal a number
    return convertDecimalFields(relatedProducts, ['basePrice', 'wholesalePrice'])
  }

  // Obtener todas las categorías
  static async getAllCategories(): Promise<CategoryWithCount[]> {
    return await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            products: {
              where: {
                active: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  }

  // Obtener productos por categoría
  static async getProductsByCategory(categorySlug: string, filters: ProductFilters = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 20, search, brand, featured, minPrice, maxPrice, inStock } = filters

    // Construir condiciones de filtro
    const where: ProductWhereInput = {
      category: {
        slug: categorySlug
      },
      active: true
    }

    if (brand) {
      where.brand = brand
    }
    
    if (featured !== undefined) {
      where.featured = featured
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {}
      if (minPrice !== undefined) {
        where.basePrice.gte = minPrice
      }
      if (maxPrice !== undefined) {
        where.basePrice.lte = maxPrice
      }
    }
    
    if (inStock) {
      where.stock = {
        gt: 0
      }
    }

    // Agregar filtro de búsqueda si existe
    if (search) {
      where.AND = [
        {
          category: {
            slug: categorySlug
          }
        },
        { active: true },
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { shortDescription: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    // Usar la función de paginación centralizada
    const result = await executePaginatedQuery(
      (options) => prisma.product.findMany({
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
          featured: true,
          mainImage: true
        },
        orderBy: [
          { featured: 'desc' },
          { name: 'asc' }
        ],
        ...options
      }),
      () => prisma.product.count({ where }),
      { page, limit }
    )

    // Convertir Decimal a number
    const productsFormatted = convertDecimalFields(result.data, ['basePrice', 'wholesalePrice'])

    return {
      ...result,
      data: productsFormatted
    }
  }

  // Buscar productos por término
  static async searchProducts(searchTerm: string, limit: number = 20) {
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { active: true },
          {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { shortDescription: { contains: searchTerm, mode: 'insensitive' } },
              { sku: { contains: searchTerm, mode: 'insensitive' } },
              { brand: { contains: searchTerm, mode: 'insensitive' } },
              {
                category: {
                  name: { contains: searchTerm, mode: 'insensitive' }
                }
              }
            ]
          }
        ]
      },
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
        featured: true,
        mainImage: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { name: 'asc' }
      ],
      take: limit
    })

    // Convertir Decimal a number
    return convertDecimalFields(products, ['basePrice', 'wholesalePrice'])
  }

  // Obtener estadísticas de productos
  static async getProductStats() {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      outOfStockProducts,
      totalStock,
      totalCategories
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.product.count({ where: { active: false } }),
      prisma.product.count({ where: { featured: true, active: true } }),
      prisma.product.count({ where: { stock: 0, active: true } }),
      prisma.product.aggregate({
        where: { active: true },
        _sum: { stock: true }
      }),
      prisma.category.count()
    ])

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      outOfStockProducts,
      totalStock: totalStock._sum.stock || 0,
      totalCategories
    }
  }

  // Verificar disponibilidad de producto
  static async checkProductAvailability(productId: string, requestedQuantity: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stock: true,
        active: true
      }
    })

    if (!product) {
      return {
        available: false,
        error: "Producto no encontrado"
      }
    }

    if (!product.active) {
      return {
        available: false,
        error: "Producto no disponible"
      }
    }

    if (product.stock < requestedQuantity) {
      return {
        available: false,
        error: `Stock insuficiente. Disponible: ${product.stock} unidades`
      }
    }

    return {
      available: true,
      product
    }
  }

  // Obtener precio según tipo de usuario
  static async getProductPrice(productId: string, userType: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId, active: true },
      select: {
        basePrice: true,
        wholesalePrice: true,
        stock: true,
        name: true
      }
    })

    if (!product) {
      throw new NotFoundError("Producto")
    }

    const price = userType === 'EMPRESA' && product.wholesalePrice 
      ? toNumber(product.wholesalePrice)
      : toNumber(product.basePrice)

    return { 
      price, 
      stock: product.stock, 
      name: product.name,
      basePrice: toNumber(product.basePrice),
      wholesalePrice: product.wholesalePrice ? toNumber(product.wholesalePrice) : null
    }
  }
}
