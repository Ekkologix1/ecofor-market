"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCart } from "@/contexts/CartContext"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Star,
  Tag,
  AlertTriangle,
  Check,
  Minus,
  Plus,
  Weight,
  Ruler,
  Loader2,
  AlertCircle,
  Share2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SafeImage } from "@/components/ui/safe-image"

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  sku: string
  basePrice: number
  wholesalePrice: number | null
  stock: number
  minStock: number
  maxStock: number | null
  brand: string | null
  unit: string
  weight: number | null
  dimensions: string | null
  images: string[]
  mainImage: string | null
  featured: boolean
  promotion: boolean
  promotionPrice: number | null
  promotionStart: string | null
  promotionEnd: string | null
  tags: string[]
  finalPrice: number
  originalPrice: number
  isOnPromotion: boolean
  priceDisplay: {
    final: number
    original: number | null
    discount: number
  }
  stockStatus: {
    inStock: boolean
    lowStock: boolean
    outOfStock: boolean
  }
  category: {
    id: string
    name: string
    slug: string
    description: string | null
  }
}

function ProductDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { addItem, canUseCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const slug = params?.slug as string

  useEffect(() => {
    if (slug) {
      fetchProduct()
    }
  }, [slug])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/catalog/products/${slug}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError("Producto no encontrado")
        } else {
          setError("Error al cargar el producto")
        }
        return
      }

      const data = await response.json()
      setProduct(data.product)
    } catch (err) {
      setError("Error al cargar el producto")
      console.error("Error fetching product:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product || !canUseCart) return

    if (quantity > product.stock) {
      setCartMessage({
        type: 'error',
        message: 'No hay suficiente stock disponible'
      })
      setTimeout(() => setCartMessage(null), 3000)
      return
    }

    setAddingToCart(true)

    try {
      const success = await addItem(product, quantity)

      if (success) {
        setCartMessage({
          type: 'success',
          message: `${product.name} agregado al carrito`
        })
        setTimeout(() => setCartMessage(null), 3000)
      } else {
        setCartMessage({
          type: 'error',
          message: 'No se pudo agregar el producto al carrito'
        })
        setTimeout(() => setCartMessage(null), 3000)
      }
    } catch (error) {
      setCartMessage({
        type: 'error',
        message: 'Error al agregar el producto'
      })
      setTimeout(() => setCartMessage(null), 3000)
    } finally {
      setAddingToCart(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const canViewPrices = Boolean(session?.user?.validated)

  // No mostrar loading, mostrar contenido vacío mientras carga
  if (loading) {
    return null
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Producto no encontrado"}
          </h2>
          <p className="text-gray-600 mb-8">
            El producto que buscas no existe o no está disponible.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button
              onClick={() => router.push('/catalogo')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Ver Catálogo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : product.mainImage
      ? [product.mainImage]
      : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 opacity-0 animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center text-gray-700 hover:text-emerald-600 transition-all duration-300 hover:scale-105 hover:-translate-x-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            <Link href="/catalogo">
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 transition-all duration-300 hover:scale-105">
                Ver Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Mensaje del carrito */}
      {cartMessage && (
        <div className="fixed top-20 right-4 z-50">
          <Alert className={`${cartMessage.type === 'success'
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-red-300 bg-red-50'
            } shadow-xl border-2 rounded-xl`}>
            {cartMessage.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={`font-medium ${cartMessage.type === 'success' ? 'text-emerald-800' : 'text-red-800'
              }`}>
              {cartMessage.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden opacity-0 animate-fade-in-up animation-delay-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Galería de Imágenes */}
            <div className="space-y-4 opacity-0 animate-fade-in-left animation-delay-200">
              {/* Imagen Principal */}
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                {images.length > 0 ? (
                  <SafeImage
                    src={images[selectedImageIndex] || images[0]}
                    alt={product.name}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.featured && (
                    <Badge className="bg-yellow-500 text-white animate-pulse">
                      <Star className="h-3 w-3 mr-1" />
                      Destacado
                    </Badge>
                  )}
                  {product.isOnPromotion && (
                    <Badge className="bg-red-500 text-white animate-pulse animation-delay-100">
                      <Tag className="h-3 w-3 mr-1" />
                      -{product.priceDisplay.discount}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Miniaturas */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${selectedImageIndex === index
                          ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105'
                          : 'border-gray-200 hover:border-emerald-300 hover:scale-105'
                        }`}
                    >
                      <SafeImage
                        src={image}
                        alt={`${product.name} - Vista ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Información del Producto */}
            <div className="space-y-6 opacity-0 animate-fade-in-right animation-delay-300">
              {/* Categoría */}
              <div>
                <Link
                  href={`/catalogo?categoria=${product.category.slug}`}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-all duration-300 hover:scale-105 inline-block"
                >
                  {product.category.name}
                </Link>
              </div>

              {/* Nombre */}
              <h1 className="text-3xl font-bold text-gray-900">
                {product.name}
              </h1>

              {/* SKU */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Código:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {product.sku}
                </span>
              </div>

              {/* Precio */}
              {canViewPrices ? (
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl font-bold text-emerald-600">
                      {formatPrice(product.finalPrice)}
                    </span>
                    {product.isOnPromotion && product.priceDisplay.original && (
                      <span className="text-xl text-gray-400 line-through">
                        {formatPrice(product.priceDisplay.original)}
                      </span>
                    )}
                  </div>
                  {product.isOnPromotion && (
                    <p className="text-sm text-red-600 font-medium">
                      ¡Ahorra {formatPrice(product.priceDisplay.original! - product.finalPrice)}!
                    </p>
                  )}
                  {session?.user?.type === 'EMPRESA' && product.wholesalePrice && (
                    <p className="text-sm text-gray-600">
                      Precio mayorista disponible
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Inicia sesión para ver precios
                  </p>
                </div>
              )}

              {/* Descripción */}
              {product.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Información Técnica */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Información Técnica</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {product.brand && (
                      <div>
                        <span className="text-sm text-gray-500">Marca</span>
                        <p className="font-medium">{product.brand}</p>
                      </div>
                    )}

                    <div>
                      <span className="text-sm text-gray-500">Unidad</span>
                      <p className="font-medium">{product.unit}</p>
                    </div>

                    {product.weight && (
                      <div className="flex items-center space-x-2">
                        <Weight className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">Peso</span>
                          <p className="font-medium">{product.weight} kg</p>
                        </div>
                      </div>
                    )}

                    {product.dimensions && (
                      <div className="flex items-center space-x-2">
                        <Ruler className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">Dimensiones</span>
                          <p className="font-medium">{product.dimensions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stock */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Disponibilidad</span>
                  {product.stockStatus.inStock ? (
                    <Badge className="bg-green-100 text-green-700">
                      <Check className="h-3 w-3 mr-1" />
                      {product.stock > 0 ? `En stock (${product.stock} ${product.unit})` : 'Disponible'}
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Sin stock
                    </Badge>
                  )}
                </div>

                {product.stockStatus.lowStock && product.stock > 0 && (
                  <p className="text-sm text-orange-600">
                    ⚠️ Stock bajo - Solo quedan {product.stock} unidades
                  </p>
                )}
              </div>

              {/* Cantidad y Agregar al Carrito */}
              {canViewPrices && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Cantidad:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-10 w-10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-16 text-center font-medium">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="h-10 w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={!canUseCart || !product.stockStatus.inStock || addingToCart}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    {addingToCart ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Agregar al Carrito
                      </>
                    )}
                  </Button>

                  {!canUseCart && (
                    <p className="text-sm text-gray-500 text-center">
                      Inicia sesión para agregar productos al carrito
                    </p>
                  )}
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Etiquetas</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetailContent />
    </Suspense>
  )
}

