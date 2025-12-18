"use client"
import { ProductCard } from "./product-card"
import { Card, CardContent } from "./card"
import { AlertTriangle } from "lucide-react"
import { useMemo } from "react"





interface ProductCardWrapperProps {
  product: {
    id: string
    name: string
    sku: string
    basePrice: number
    wholesalePrice?: number
    stock: number
    unit: string
    categoryId: string
    mainImage?: string
    images?: string[]
    slug?: string
    shortDescription?: string
    brand?: string
    weight?: number
    dimensions?: string
    featured?: boolean
    tags?: string[]
    category?: {
      name: string
      slug: string
    }
  }
  userType?: string
}

export function ProductCardWrapper({ product, userType }: ProductCardWrapperProps) {
  try {
    // Función para determinar si un producto debe estar en promoción
    // Solo algunos productos específicos estarán en oferta
    const shouldBeOnPromotion = () => {
      // Lista de códigos que SÍ tendrán promoción (productos seleccionados para ofertas)
      const promotionalCodes = [
        'PAP750OF', // Papel bond oficio
        'H155024',  // Servilletas restaurant
        'DET5000',  // Detergente industrial
        'DISP91509' // Dispensador evolution
      ]
      
      // Solo estos códigos específicos tendrán promoción
      if (promotionalCodes.includes(product.sku)) {
        // Para estos productos específicos, crear ofertas
        if (product.wholesalePrice && product.basePrice && product.wholesalePrice > product.basePrice) {
          return true
        } else if (product.basePrice) {
          // Si no hay wholesalePrice, crear una oferta simulada
          return true
        }
      }
      
      return false
    }

    const isOnPromotion = shouldBeOnPromotion()

    // Calcular precio original para ofertas - usando useMemo para que sea estático
    const originalPrice = useMemo(() => {
      if (!isOnPromotion) return null
      
      if (product.wholesalePrice && product.wholesalePrice > product.basePrice) {
        return product.wholesalePrice
      } else if (product.basePrice) {
        // Descuentos específicos por producto
        // Para DET5000: precio base $45,000 debe mostrar precio original $65,000 (30.77% de descuento)
        const specificOriginalPrices: Record<string, number> = {
          'DET5000': 65000 // Detergente Industrial Concentrado 5L - precio original fijo
        }
        
        // Si el producto tiene un precio original específico, usarlo directamente
        if (specificOriginalPrices[product.sku]) {
          return specificOriginalPrices[product.sku]
        }
        
        // Descuentos específicos por producto (si no hay precio original fijo)
        const specificDiscounts: Record<string, number> = {}
        
        // Si el producto tiene un descuento específico, usarlo
        if (specificDiscounts[product.sku]) {
          const discountPercentage = specificDiscounts[product.sku]
          return Math.round(product.basePrice / (1 - discountPercentage / 100))
        }
        
        // Para otros productos, crear un precio original simulado basado en el SKU
        // Usar el SKU como semilla para generar un descuento consistente (15-20%)
        const skuHash = product.sku.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const discountPercentage = 15 + (skuHash % 6) // Entre 15% y 20% basado en el SKU
        return Math.round(product.basePrice / (1 - discountPercentage / 100))
      }
      
      return null
    }, [product.sku, product.basePrice, product.wholesalePrice, isOnPromotion])

    // Transformar el producto al formato que espera ProductCard
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug || product.id, // Usar ID como slug si no hay slug
      shortDescription: product.shortDescription || '',
      sku: product.sku,
      finalPrice: product.basePrice || 0,
      originalPrice: originalPrice,
      isOnPromotion: isOnPromotion,
      priceDisplay: {
        final: product.basePrice || 0,
        original: originalPrice,
        discount: originalPrice && product.basePrice
          ? Math.round(((originalPrice - product.basePrice) / originalPrice) * 100)
          : 0
      },
      stock: product.stock || 0,
      minStock: 5, // Valor por defecto
      brand: product.brand || '',
      unit: product.unit || 'unidad',
      weight: product.weight || undefined,
      dimensions: product.dimensions || undefined,
      images: product.images || [],
      mainImage: product.mainImage || '',
      featured: product.featured || false,
      tags: product.tags || [],
      stockStatus: {
        inStock: (product.stock || 0) > 0,
        lowStock: (product.stock || 0) > 0 && (product.stock || 0) <= 5,
        outOfStock: (product.stock || 0) <= 0
      },
      category: {
        name: product.category?.name || 'Sin categoría',
        slug: product.category?.slug || 'sin-categoria'
      }
    }

    return <ProductCard product={transformedProduct} userType={userType} />
  } catch (error) {
    console.error("Error rendering ProductCard:", error)
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Error al cargar producto</p>
          <p className="text-gray-500 text-sm mt-1">
            {product?.name || 'Producto desconocido'}
          </p>
        </CardContent>
      </Card>
    )
  }
}
