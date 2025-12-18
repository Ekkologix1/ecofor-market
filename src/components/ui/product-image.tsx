"use client"


import { memo, useState, useCallback, useMemo } from "react"
import { HydrationBoundary } from "./hydration-boundary"
import Image from "next/image"


interface ProductImageProps {
  productId: string
  mainImage?: string | null
  alt: string
  className?: string
  sizes?: string
}

export const ProductImage = memo(function ProductImage({
  productId,
  mainImage,
  alt,
  className = "object-cover rounded-lg border border-gray-200",
  sizes = "64px"
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false)

  // Generar URL de imagen con fallback mejorado
  const getImageUrl = useCallback((imagePath?: string | null) => {
    // Si no hay imagen, usar placeholder
    if (!imagePath || imagePath.trim() === '') {
      return '/images/products/placeholder-product.svg'
    }
    
    // Si es una URL completa (http/https), usarla directamente
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    
    // Si ya tiene / al inicio, usar como está
    if (imagePath.startsWith('/')) {
      return imagePath
    }
    
    // Construir ruta completa para imágenes locales
    return `/images/products/${imagePath}`
  }, [])

  // Memoizar la URL de la imagen
  const imageUrl = useMemo(() => {
    return getImageUrl(mainImage)
  }, [getImageUrl, mainImage])

  // Generar una clave única para el componente Image
  const imageKey = useMemo(() => {
    return `product-image-${productId}-${mainImage}`
  }, [productId, mainImage])

  // Callbacks estables para los eventos de la imagen
  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageError(false)
  }, [])

  // Resetear el estado de error cuando cambie la URL de la imagen
  useMemo(() => {
    setImageError(false)
  }, [imageUrl])

  if (imageError || !mainImage || mainImage.trim() === '') {
    return (
      <HydrationBoundary>
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-gray-500 font-medium">
                Imagen no disponible
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {mainImage || 'Sin imagen'}
              </div>
            </div>
          </div>
        </div>
      </HydrationBoundary>
    )
  }

  return (
    <HydrationBoundary>
      <div className="relative w-full h-full" style={{ minHeight: '64px', minWidth: '64px' }}>
        {/* Versión con Next.js Image usando dimensiones fijas */}
        <Image
          key={imageKey}
          src={imageUrl}
          alt={alt}
          width={64}
          height={64}
          className={className}
          sizes={sizes}
          onError={handleImageError}
          onLoad={handleImageLoad}
          priority={false}
          unoptimized={imageUrl.includes('placeholder')}
          style={{ width: "auto", height: "auto" }}
        />
      </div>
    </HydrationBoundary>
  )
}, (prevProps, nextProps) => {
  // Solo re-renderizar si las props relevantes han cambiado
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.mainImage === nextProps.mainImage &&
    prevProps.alt === nextProps.alt &&
    prevProps.className === nextProps.className &&
    prevProps.sizes === nextProps.sizes
  )
})
