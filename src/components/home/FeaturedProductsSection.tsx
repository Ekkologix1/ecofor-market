"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui"
import { Package, Sparkles, TrendingUp } from "lucide-react"
import { HydrationBoundary } from "@/components/HydrationBoundary"
import Image from "next/image"
import Link from "next/link"

interface FeaturedProduct {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  sku: string
  basePrice: number
  wholesalePrice: number | null
  brand: string | null
  unit: string
  mainImage: string | null
  promotion: boolean
  promotionPrice: number | null
  promotionStart: string | null
  promotionEnd: string | null
  category: {
    id: string
    name: string
    slug: string
  }
}

interface FeaturedProductsSectionProps {
  isScrolling: boolean
}

// Colores para las categorías
const getCategoryColors = (categorySlug: string) => {
  switch (categorySlug) {
    case 'papeleria':
      return {
        bg: 'from-blue-500 to-blue-600',
        glow: 'shadow-blue-500/50',
        badge: 'from-blue-400 to-blue-500'
      }
    case 'quimicos':
      return {
        bg: 'from-emerald-500 to-emerald-600',
        glow: 'shadow-emerald-500/50',
        badge: 'from-emerald-400 to-emerald-500'
      }
    case 'limpieza':
      return {
        bg: 'from-purple-500 to-purple-600',
        glow: 'shadow-purple-500/50',
        badge: 'from-purple-400 to-purple-500'
      }
    case 'epp-horeca':
      return {
        bg: 'from-orange-500 to-orange-600',
        glow: 'shadow-orange-500/50',
        badge: 'from-orange-400 to-orange-500'
      }
    default:
      return {
        bg: 'from-gray-500 to-gray-600',
        glow: 'shadow-gray-500/50',
        badge: 'from-gray-400 to-gray-500'
      }
  }
}

export default function FeaturedProductsSection({ isScrolling }: FeaturedProductsSectionProps) {
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/catalog/featured-products?limit=4')

        if (!response.ok) {
          throw new Error('Error al cargar productos destacados')
        }

        const data = await response.json()
        setFeaturedProducts(data.products || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching featured products:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  // Efecto parallax con el mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height
        setMousePosition({ x, y })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  if (loading) {
    return (
      <HydrationBoundary>
        <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-transparent to-blue-900/20"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                <span className="block text-white">Ofertas</span>
                <span className="block bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Especiales</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Una selección exclusiva de nuestros productos en oferta para empresas líderes en la región
              </p>
            </div>

            <div className="mb-12">
              <div className="h-[500px] w-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                  <p className="text-gray-300 text-lg">Cargando ofertas especiales...</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </HydrationBoundary>
    )
  }

  if (error) {
    return (
      <HydrationBoundary>
        <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-transparent to-blue-900/20"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                <span className="block text-white">Ofertas</span>
                <span className="block bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Especiales</span>
              </h2>
              <p className="text-red-400 text-lg">Error al cargar ofertas especiales: {error}</p>
            </div>
          </div>
        </section>
      </HydrationBoundary>
    )
  }

  return (
    <HydrationBoundary>
      <section
        ref={containerRef}
        className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden"
      >
        {/* Efectos de fondo animados */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-transparent to-blue-900/20"></div>
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float"
            style={{
              transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`
            }}
          ></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float animation-delay-2000"
            style={{
              transform: `translate(${-mousePosition.x * 15}px, ${-mousePosition.y * 15}px)`
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título con animación */}
          <div className="text-center mb-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">Ofertas Limitadas</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              <span className="block text-white">Ofertas</span>
              <span className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]">
                Especiales
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Una selección exclusiva de nuestros productos en oferta para empresas líderes en la región
            </p>
          </div>

          {/* Grid de productos con animaciones flotantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {featuredProducts.map((product, index) => {
              const colors = getCategoryColors(product.category.slug)
              const delay = `${(index + 1) * 150}ms`

              return (
                <div
                  key={product.id}
                  className="group relative opacity-0 animate-fade-in-up"
                  style={{
                    animationDelay: delay,
                    animationFillMode: 'forwards',
                    transform: `translateY(${Math.sin(index) * 10}px)`
                  }}
                >
                  {/* Card con efecto hover 3D */}
                  <div className="relative h-[420px] perspective-1000">
                    <div className="relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform-gpu hover:scale-105 hover:-translate-y-4 group-hover:rotate-y-5">
                      {/* Efecto de brillo en hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>

                      {/* Badge de categoría */}
                      <div className="absolute top-4 left-4 z-10">
                        <div className={`bg-gradient-to-r ${colors.badge} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          {product.category.name}
                        </div>
                      </div>

                      {/* Badge de oferta */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className="relative">
                          <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50 animate-pulse"></div>
                          <div className="relative bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Oferta
                          </div>
                        </div>
                      </div>

                      {/* Imagen del producto */}
                      <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 overflow-hidden">
                        {/* Efecto de fondo animado */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

                        {product.mainImage ? (
                          <Image
                            src={product.mainImage}
                            alt={product.name}
                            width={160}
                            height={160}
                            className="object-contain transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 drop-shadow-lg"
                            quality={90}
                            style={{ width: "auto", height: "auto", maxHeight: "160px" }}
                            sizes="160px"
                          />
                        ) : (
                          <Package className="h-20 w-20 text-gray-400 group-hover:scale-110 transition-transform duration-500" />
                        )}
                      </div>

                      {/* Información del producto */}
                      <div className="relative p-6 bg-white">
                        {/* Línea decorativa */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bg} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>

                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight min-h-[3.5rem] group-hover:text-emerald-600 transition-colors duration-300">
                          {product.name}
                        </h3>

                        {product.brand && (
                          <p className="text-sm text-gray-500 mb-2">
                            Marca: <span className="font-semibold">{product.brand}</span>
                          </p>
                        )}

                        {/* Precios */}
                        <div className="flex items-baseline gap-2 mb-4">
                          {product.promotionPrice && (
                            <>
                              <span className="text-2xl font-black text-emerald-600">
                                ${product.promotionPrice.toLocaleString('es-CL')}
                              </span>
                              <span className="text-sm text-gray-400 line-through">
                                ${product.basePrice.toLocaleString('es-CL')}
                              </span>
                            </>
                          )}
                          {!product.promotionPrice && (
                            <span className="text-2xl font-black text-gray-900">
                              ${product.basePrice.toLocaleString('es-CL')}
                            </span>
                          )}
                        </div>

                        {/* Botón de acción */}
                        <Link href={`/productos/${product.slug}`}>
                          <Button
                            className={`w-full bg-gradient-to-r ${colors.bg} hover:shadow-xl ${colors.glow} text-white font-semibold transform group-hover:scale-105 transition-all duration-300`}
                          >
                            Ver Detalles
                          </Button>
                        </Link>
                      </div>

                      {/* Efecto de borde brillante */}
                      <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-emerald-400/50 transition-all duration-500 pointer-events-none`}></div>
                    </div>

                    {/* Sombra flotante */}
                    <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-r ${colors.bg} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 rounded-full`}></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Botón CTA */}
          <div className="text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
            <Link href="/catalogo">
              <Button className="relative px-10 py-6 text-lg font-bold bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600 text-white shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110 hover:-translate-y-1 group overflow-hidden bg-[length:200%_100%] animate-gradient">
                <span className="relative z-10 flex items-center gap-3">
                  Ver Catálogo Completo
                  <Package className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </HydrationBoundary>
  )
}
