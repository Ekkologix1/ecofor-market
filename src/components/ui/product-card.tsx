"use client"





import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui"
import { ShoppingCart, Star, Tag, AlertTriangle, Package, Weight, Ruler, Check } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useState } from "react"
import { SafeImage } from "./safe-image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"


interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    shortDescription?: string
    sku: string
    finalPrice: number
    originalPrice: number | null
    isOnPromotion: boolean
    priceDisplay: {
      final: number
      original: number | null
      discount: number
    }
    stock: number
    minStock: number
    brand?: string
    unit?: string
    weight?: number
    dimensions?: string
    images?: string[]
    mainImage?: string
    featured: boolean
    tags?: string[]
    stockStatus: {
      inStock: boolean
      lowStock: boolean
      outOfStock: boolean
    }
    category: {
      name: string
      slug: string
    }
  }
  userType?: string
}

export function ProductCard({ product, userType }: ProductCardProps) {
  const { addItem, canUseCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  // Validaciones defensivas
  if (!product) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Producto no disponible</p>
        </CardContent>
      </Card>
    )
  }

  if (!product.id || !product.name || !product.sku) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Información del producto incompleta</p>
        </CardContent>
      </Card>
    )
  }

  const handleAddToCart = async () => {
    if (!canUseCart) {
      // Si no puede usar el carrito, verificar si es porque no está autenticado
      if (!session?.user) {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
      }
      return
    }
    
    // Feedback visual inmediato
    setIsAdding(true)
    setJustAdded(true)
    
    try {
      // Configurar el producto para el carrito
      const productForCart = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription || '',
        sku: product.sku,
        basePrice: product.finalPrice,
        wholesalePrice: product.finalPrice,
        stock: product.stock,
        brand: product.brand || '',
        unit: product.unit || 'unidad',
        featured: product.featured,
        mainImage: product.mainImage || '', // Agregar la imagen del producto
        category: product.category
      }
      
      // Llamar addItem (que ahora es optimista)
      const success = await addItem(productForCart, 1)
      
      // Actualizar estados de feedback
      setIsAdding(false)
      
      if (success) {
        // Mantener el estado "agregado" por un tiempo
        setTimeout(() => setJustAdded(false), 2000)
      } else {
        // Si falló, quitar el estado "agregado" inmediatamente
        setJustAdded(false)
      }
    } catch (error: any) {
      // Manejar errores de autenticación SOLO cuando realmente sea un error 401
      setIsAdding(false)
      setJustAdded(false)
      
      // Verificar si el usuario realmente NO está autenticado antes de redirigir
      // Si el usuario está autenticado pero hay un error 401, puede ser un problema de sesión/token
      const isActuallyUnauthenticated = !session?.user
      
      // Solo redirigir si es específicamente un error de autenticación (401) Y el usuario no está autenticado
      // NO redirigir si el usuario está autenticado pero hay un problema técnico
      if (error?.isAuthError === true && isActuallyUnauthenticated) {
        // Redirigir al login solo cuando realmente hay error de autenticación y el usuario no está autenticado
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
      } else if (error?.isAuthError === true && !isActuallyUnauthenticated) {
        // Si el usuario está autenticado pero hay un error 401, puede ser un problema de sesión
        // Intentar refrescar la sesión o mostrar un mensaje de error
        console.warn('Error de autenticación pero usuario está autenticado. Puede ser un problema de sesión:', error.message)
        // No redirigir, solo mostrar el error en el contexto
      } else if (error?.isValidationError === true) {
        // Para errores de validación, mostrar mensaje pero no redirigir
        console.warn('Usuario no validado:', error.message)
        // El error ya se maneja en el contexto del carrito
      } else {
        // Para otros errores, solo loguear (el error ya se maneja en el contexto)
        console.error('Error al agregar producto al carrito:', error)
      }
    } finally {
      // Timeout de seguridad para quitar el estado "agregando" después de máximo 1 segundo
      setTimeout(() => {
        setIsAdding(false)
      }, 1000)
    }
  }

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0'
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatWeight = (weight?: number) => {
    if (!weight) return 'N/A'
    return weight >= 1000 ? `${(weight / 1000).toFixed(1)} kg` : `${weight} g`
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white hover:-translate-y-1 h-full flex flex-col scale-90">
      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 via-emerald-50/30 to-emerald-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Badges superiores */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {product.featured && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg border-0 font-bold px-2.5 py-0.5 text-sm">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Destacado
          </Badge>
        )}
        {product.isOnPromotion && product.priceDisplay && (
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg border-0 font-bold px-2.5 py-0.5 text-sm">
            <Tag className="w-3 h-3 mr-1" />
            -{product.priceDisplay.discount || 0}% OFF
          </Badge>
        )}
        {product.stockStatus?.lowStock && !product.stockStatus?.outOfStock && (
          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg border-0 font-bold px-2.5 py-0.5 text-sm">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Últimas unidades
          </Badge>
        )}
      </div>

      {/* Imagen del producto */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex-shrink-0">
        <SafeImage
          src={product.mainImage}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={product.featured}
        />
        
        {/* Badge de categoría */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-white/95 backdrop-blur-md text-gray-800 border-0 shadow-lg font-semibold px-2.5 py-1 text-sm">
            {product.category?.name || 'Sin categoría'}
          </Badge>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="flex flex-col flex-1 p-5">
        <CardHeader className="pb-4 pt-0 px-0">
          <CardTitle className="text-base font-bold line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors duration-300 mb-2">
            <Link href={`/productos/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </CardTitle>
          
          {product.shortDescription && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0 px-0 space-y-5 flex-1 flex flex-col">
          {/* Información técnica mejorada */}
          <div className="bg-white rounded-xl p-4 space-y-3 border-2 border-gray-100 shadow-sm">
            {/* Código destacado */}
            <div className="pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Código</span>
                <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                  {product.sku}
                </span>
              </div>
            </div>

            {/* Grid de información */}
            <div className="space-y-2.5">
              {product.brand && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">Marca:</span>
                  <span className="text-sm text-gray-900 font-bold">{product.brand}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Stock:</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    product.stockStatus?.outOfStock 
                      ? 'bg-red-500' 
                      : product.stockStatus?.lowStock 
                      ? 'bg-orange-500 animate-pulse' 
                      : 'bg-green-500'
                  }`} />
                  <span className={`text-sm font-bold ${
                    product.stockStatus?.outOfStock 
                      ? 'text-red-600' 
                      : product.stockStatus?.lowStock 
                      ? 'text-orange-600' 
                      : 'text-green-600'
                  }`}>
                    {product.stock || 0} {product.unit || 'unidad'}
                  </span>
                </div>
              </div>

              {product.weight && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Weight className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium">Peso:</span>
                  </div>
                  <span className="text-sm text-gray-900 font-bold">{formatWeight(product.weight)}</span>
                </div>
              )}
              
               {product.dimensions && (
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-1.5 text-gray-600">
                     <Ruler className="w-3.5 h-3.5" />
                     <span className="text-sm font-medium">Dimensiones:</span>
                   </div>
                   <span className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded border max-w-[60%] truncate">
                     {product.dimensions}
                   </span>
                 </div>
               )}
            </div>
          </div>

          {/* Spacer para empujar precio y botón al fondo */}
          <div className="flex-1" />

          {/* Precio destacado */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border-2 border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wide block mb-1">
                  Precio
                </span>
                <div className={`text-2xl font-black ${
                  product.isOnPromotion ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {formatPrice(product.finalPrice || 0)}
                </div>
                <span className="text-xs text-emerald-600 font-medium">
                  por {product.unit || 'unidad'}
                </span>
              </div>
              
              {product.isOnPromotion && product.originalPrice && (
                <div className="text-right">
                  <span className="text-xs text-gray-500 block mb-1">Antes:</span>
                  <span className="text-sm text-gray-500 line-through font-semibold">
                    {formatPrice(product.originalPrice)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botón de agregar al carrito */}
          <Button 
            onClick={handleAddToCart}
            disabled={!canUseCart || product.stockStatus?.outOfStock || isAdding}
            className={`w-full h-12 font-bold text-base rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
              justAdded
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : product.stockStatus?.outOfStock
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                ¡Agregado!
              </>
            ) : isAdding ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Agregando...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                {!canUseCart 
                  ? 'Inicia sesión'
                  : product.stockStatus?.outOfStock 
                  ? 'Sin stock'
                  : 'Agregar al Carrito'
                }
              </>
            )}
          </Button>
        </CardContent>
      </div>
    </Card>
  )
}