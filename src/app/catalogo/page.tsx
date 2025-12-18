"use client"

import { Suspense } from "react"
import { NoSSR } from "@/components/ui/no-ssr"
import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CustomDropdown } from "@/components/ui/custom-dropdown"
import { Search, Package, ArrowLeft, Grid, List, Star, Check, AlertCircle, ShoppingCart, Eye, User, ChevronDown, LogOut, FileText, CreditCard, TrendingUp, Loader2, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/contexts/CartContext"
import { useCatalog } from "@/contexts/CatalogContext"
import { ProductCardWrapper } from "@/components/ui/product-card-wrapper"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDropdown } from "@/hooks/useDropdown"
import { useRouter } from "next/navigation"


import { HydrationBoundary } from "@/components/HydrationBoundary"

interface Category {
  id: string
  name: string
  slug: string
  description: string
  productCount: number
}

interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string
  sku: string
  basePrice: number
  wholesalePrice: number
  stock: number
  minStock: number
  brand: string
  unit: string
  weight: number
  dimensions: string
  categoryId: string
  images: string[]
  mainImage: string
  featured: boolean
  active: boolean
  promotion: boolean
  promotionPrice: number
  promotionStart: string
  promotionEnd: string
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
    name: string
    slug: string
  }
}

type SortByOption = 'name' | 'price-low' | 'price-high' | 'stock' | 'featured'

// Tipo compatible con ProductCardWrapper
type ProductCardProduct = {
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

function CatalogoContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const { addItem, canUseCart } = useCart()
  const { setIsLoading: setCatalogLoading } = useCatalog()

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<SortByOption>('featured')
  const { isOpen: showUserMenu, toggle, close } = useDropdown('user-dropdown-catalogo')
  const { isOpen: showCategoryMenu, toggle: toggleCategory, close: closeCategory } = useDropdown('category-dropdown-catalogo')
  const [isNavigating, setIsNavigating] = useState(false)
  const [cameFromHome, setCameFromHome] = useState(false)

  // Estado para notificación de pedido confirmado
  const [showOrderNotification, setShowOrderNotification] = useState(false)
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null)
  const router = useRouter()

  // Detectar si el usuario viene desde la página de inicio
  useEffect(() => {
    // Verificar sessionStorage para una detección más confiable
    const cameFromHomeStorage = sessionStorage.getItem('cameFromHome') === 'true'
    setCameFromHome(cameFromHomeStorage)
  }, [])

  // Limpiar sessionStorage cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (cameFromHome) {
        sessionStorage.removeItem('cameFromHome')
      }
    }
  }, [cameFromHome])

  // Cerrar dropdowns cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('#category-dropdown-catalogo')) {
        closeCategory()
      }
    }

    if (showCategoryMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showCategoryMenu, closeCategory])

  // Función optimizada para navegar (dashboard o inicio según el contexto)
  const handleNavigateToDashboard = useCallback(() => {
    if (isNavigating) return // Evitar múltiples navegaciones

    setIsNavigating(true)

    // Si no hay sesión o usuario no validado, siempre ir al inicio
    if (!session || !session.user?.validated) {
      router.push('/')
    } else {
      // Si hay sesión válida, ir al dashboard
      router.push('/dashboard')
    }
  }, [isNavigating, session, router])

  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    fetchCatalogData()

    const categoriaFromUrl = searchParams.get('categoria')
    if (categoriaFromUrl) {
      setSelectedCategory(categoriaFromUrl)
    }

    // Precargar el dashboard o inicio según el contexto para mejorar la navegación
    if (!session?.user?.validated && cameFromHome) {
      router.prefetch('/')
    } else {
      router.prefetch('/dashboard')
    }
  }, [searchParams, router, session?.user?.validated, cameFromHome])

  // Detectar confirmación de pedido
  useEffect(() => {
    const orderConfirmed = searchParams.get('orderConfirmed')
    const orderId = searchParams.get('orderId')
    const orderNumber = searchParams.get('orderNumber')

    if (orderConfirmed === 'true' && orderId) {
      setConfirmedOrderId(orderNumber || orderId) // Usar orderNumber si está disponible
      setShowOrderNotification(true)

      // Limpiar URL después de mostrar la notificación
      const url = new URL(window.location.href)
      url.searchParams.delete('orderConfirmed')
      url.searchParams.delete('orderId')
      url.searchParams.delete('orderNumber')
      window.history.replaceState({}, '', url.toString())

      // Auto-ocultar notificación después de 8 segundos
      setTimeout(() => {
        setShowOrderNotification(false)
        setConfirmedOrderId(null)
      }, 8000)
    }
  }, [searchParams])

  // Controlar visibilidad del header al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Detectar dirección del scroll
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolleando hacia abajo y ya pasamos los 100px
        setHeaderVisible(false)
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolleando hacia arriba
        setHeaderVisible(true)
      }
      
      // Si estamos en la parte superior, siempre mostrar el header
      if (currentScrollY < 10) {
        setHeaderVisible(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const fetchCatalogData = async () => {
    try {
      setLoading(true)
      setCatalogLoading(true) // Sincronizar con el contexto global
      setError(null)

      const [categoriesRes, productsRes] = await Promise.all([
        fetch("/api/catalog/categories"),
        fetch("/api/catalog/products")
      ])

      const categoriesData = await categoriesRes.json()
      const productsData = await productsRes.json()

      setCategories(categoriesData.categories || [])
      setProducts(productsData.products || [])
    } catch (err) {
      setError("Error al cargar el catálogo")
      console.error("Error fetching catalog:", err)
    } finally {
      setLoading(false)
      setCatalogLoading(false) // Sincronizar con el contexto global
    }
  }

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    if (!canUseCart) return

    setAddingToCart(product.id)

    try {
      const success = await addItem(product, quantity)

      if (success) {
        setAddedProducts(prev => new Set([...prev, product.id]))
        setCartMessage({
          type: 'success',
          message: `${product.name} agregado al carrito`
        })

        setTimeout(() => {
          setCartMessage(null)
          setAddedProducts(prev => {
            const newSet = new Set(prev)
            newSet.delete(product.id)
            return newSet
          })
        }, 3000)
      } else {
        setCartMessage({
          type: 'error',
          message: 'No hay suficiente stock disponible'
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
      setAddingToCart(null)
    }
  }

  const getPrice = (product: Product) => {
    return product.finalPrice
  }

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price-low':
          return getPrice(a) - getPrice(b)
        case 'price-high':
          return getPrice(b) - getPrice(a)
        case 'stock':
          return b.stock - a.stock
        case 'featured':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      }
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const filteredProducts = sortProducts(
    products.filter(product => {
      const matchesSearch = !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = !selectedCategory ||
        product.category.slug === selectedCategory

      return matchesSearch && matchesCategory
    })
  )

  const canViewPrices = Boolean(session?.user?.validated)

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-20">
          <div className="w-32 h-32 bg-gradient-to-br from-red-50 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-4">Error al cargar el catálogo</h3>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto text-lg">{error}</p>
          <Button
            onClick={fetchCatalogData}
            className="px-8 py-3 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
          >
            <Package className="w-5 h-5 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Premium */}
      <header className={`bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100 sticky top-0 z-40 opacity-0 animate-fade-in-down transition-transform duration-300 ease-in-out ${
        headerVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-8xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center h-16 scale-90">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNavigateToDashboard}
                disabled={isNavigating}
                className="flex items-center hover:bg-emerald-50 text-emerald-700 transition-all duration-300 disabled:opacity-50"
              >
                {isNavigating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowLeft className="h-4 w-4 mr-2" />
                )}
                {(() => {
                  // Si no hay sesión cargada aún, mostrar "Volver al inicio" por defecto
                  if (session === undefined) {
                    return isNavigating ? 'Cargando...' : 'Volver al inicio'
                  }

                  // Si no hay sesión o usuario no validado, mostrar "Volver al inicio"
                  if (!session || !session.user?.validated) {
                    return isNavigating ? 'Cargando...' : 'Volver al inicio'
                  }

                  // Si hay sesión válida, mostrar "Dashboard"
                  return isNavigating ? 'Cargando...' : 'Dashboard'
                })()}
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center">
                <span className="font-bold text-gray-900 text-base">Catálogo de Productos</span>
              </div>
            </div>

            <div className="absolute left-1/2 transform -translate-x-1/2">
              <button onClick={handleNavigateToDashboard} disabled={isNavigating}>
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                  <Image
                    src="/images/logo-ecofor.png"
                    alt="ECOFOR Market"
                    width={120}
                    height={50}
                    priority
                    className={`relative hover:opacity-90 transition-all duration-300 group-hover:scale-105 ${isNavigating ? 'opacity-50' : ''}`}
                  />
                </div>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {session ? (
                <div className="relative" id="user-dropdown-catalogo">
                  <button
                    onClick={toggle}
                    className="flex items-center space-x-3 hover:bg-gray-50 rounded-xl px-4 py-3 transition-all duration-300"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      {session.user.validated && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-bold text-gray-900 truncate max-w-24">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">
                        {session.user.type === "EMPRESA" ? "Empresa" : "Personal"}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-20" onClick={(e) => e.stopPropagation()}>
                      <div className="px-4 py-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            {session.user.validated && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {session.user.name}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {session.user.email}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={`text-xs ${session.user.type === "EMPRESA"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                                }`}>
                                {session.user.type === "EMPRESA" ? "Empresa" : "Personal"}
                              </Badge>
                              <Badge className={`text-xs ${session.user.validated
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                                }`}>
                                {session.user.validated ? "Verificado" : "Pendiente"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link href="/perfil" onClick={close} className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                          <User className="h-4 w-4 mr-3 text-gray-400 group-hover:text-emerald-600" />
                          <span className="font-medium">Mi Perfil</span>
                        </Link>

                        <Link href="/pedidos" onClick={close} className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                          <FileText className="h-4 w-4 mr-3 text-gray-400 group-hover:text-emerald-600" />
                          <span className="font-medium">{session.user.type === "EMPRESA" ? "Mis Órdenes" : "Mis Pedidos"}</span>
                        </Link>

                        {session.user.type === "EMPRESA" && (
                          <Link href="/cotizaciones" onClick={close} className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group">
                            <CreditCard className="h-4 w-4 mr-3 text-gray-400 group-hover:text-emerald-600" />
                            <span className="font-medium">Cotizaciones</span>
                          </Link>
                        )}

                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={async () => {
                            try {
                              await fetch("/api/auth/logout", { method: "POST" })
                            } catch (error) {
                              console.error("Error logging out:", error)
                            }
                            const { signOut } = await import("next-auth/react")
                            signOut({ callbackUrl: "/auth/login" })
                          }}
                          className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left group"
                        >
                          <LogOut className="h-4 w-4 mr-3 text-red-500" />
                          <span className="font-medium">Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/auth/registro">
                    <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* Mensaje de estado del carrito */}
      {cartMessage && (
        <div className="fixed top-24 right-4 z-50">
          <Alert className={`${cartMessage.type === 'success'
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-red-300 bg-red-50'
            } shadow-xl border-2 rounded-xl`}>
            {cartMessage.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={`font-medium ${cartMessage.type === 'success' ? 'text-emerald-800' : 'text-red-800'
              }`}>
              {cartMessage.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/catalogo.avif"
            alt="Productos ECOFOR"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-emerald-800/80 to-emerald-900/90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>

        <div className="relative max-w-8xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
          <div className="text-center scale-90">
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight opacity-0 animate-fade-in-up animation-delay-100">
              <span className="block text-white">Catálogo de</span>
              <span className="block bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]">
                Productos
              </span>
            </h1>
            <p className="text-xl text-emerald-100 mb-8 max-w-3xl mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-200">
              Encuentra los mejores productos de aseo, papelería y EPP para tu empresa o institución
            </p>
            <div className="flex items-center justify-center space-x-8 text-emerald-200 opacity-0 animate-fade-in-up animation-delay-300">
              <div className="flex items-center space-x-2 group cursor-default">
                <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:scale-125 transition-transform animate-pulse"></div>
                <span className="group-hover:text-emerald-100 transition-colors">+500 productos</span>
              </div>
              <div className="flex items-center space-x-2 group cursor-default">
                <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:scale-125 transition-transform animate-pulse animation-delay-100"></div>
                <span className="group-hover:text-emerald-100 transition-colors">Precios especiales</span>
              </div>
              <div className="flex items-center space-x-2 group cursor-default">
                <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:scale-125 transition-transform animate-pulse animation-delay-200"></div>
                <span className="group-hover:text-emerald-100 transition-colors">Stock en tiempo real</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="max-w-8xl mx-auto px-8 sm:px-12 lg:px-16 py-8 overflow-visible">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 space-y-6 opacity-0 animate-slide-in-up animation-delay-400 !overflow-visible">

          {/* Barra de búsqueda */}
          <div className="relative max-w-2xl mx-auto group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
            <Input
              placeholder="Buscar por nombre, código, marca o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 h-12 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl shadow-sm hover:shadow-md font-medium transition-all duration-300"
            />
          </div>

          {/* Filtros y controles */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0 overflow-visible">

            {/* Categorías */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className={`${selectedCategory === null
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                  : "hover:bg-emerald-50 hover:text-emerald-700"
                  } transition-all duration-300 rounded-xl font-medium`}
              >
                <Package className="h-4 w-4 mr-2" />
                Todas <Badge variant="secondary" className="ml-2">{products.length}</Badge>
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`${selectedCategory === category.slug
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                    : "hover:bg-emerald-50 hover:text-emerald-700"
                    } transition-all duration-300 rounded-xl font-medium`}
                >
                  {category.name} <Badge variant="secondary" className="ml-2">{category.productCount}</Badge>
                </Button>
              ))}
            </div>

            {/* Controles */}
            <div className="flex items-center space-x-4 overflow-visible">

              {/* Ordenamiento */}
              <div className="relative z-[100]" id="category-dropdown-catalogo">
                <button
                  onClick={toggleCategory}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/70 hover:bg-white/90 border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-gray-900 transform hover:scale-105 hover:-translate-y-0.5"
                >
                  <span>
                    {sortBy === 'featured' && 'Destacados'}
                    {sortBy === 'name' && 'Nombre A-Z'}
                    {sortBy === 'price-low' && 'Precio menor'}
                    {sortBy === 'price-high' && 'Precio mayor'}
                    {sortBy === 'stock' && 'Mayor stock'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-all duration-300 ${showCategoryMenu ? 'rotate-180 text-emerald-500' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <CustomDropdown
                  isOpen={showCategoryMenu}
                  onClose={closeCategory}
                  selectedValue={sortBy}
                  onSelect={(value) => setSortBy(value as SortByOption)}
                  options={[
                    { value: 'featured', label: 'Destacados', icon: Star },
                    { value: 'name', label: 'Nombre A-Z', icon: Package },
                    { value: 'price-low', label: 'Precio menor', icon: TrendingUp },
                    { value: 'price-high', label: 'Precio mayor', icon: TrendingUp },
                    { value: 'stock', label: 'Mayor stock', icon: Package },
                  ]}
                  title="Ordenar por"
                  buttonLabel=""
                  width="w-56"
                />
              </div>

              <div className="h-6 w-px bg-gray-200" />

              {/* Vista */}
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`${viewMode === 'grid'
                    ? 'bg-emerald-500 text-white'
                    : 'hover:bg-gray-50'
                    } rounded-none border-0`}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`${viewMode === 'list'
                    ? 'bg-emerald-500 text-white'
                    : 'hover:bg-gray-50'
                    } rounded-none border-0`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notificación de Pedido Confirmado */}
      {showOrderNotification && confirmedOrderId && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-white border border-emerald-200 rounded-xl shadow-xl p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  ¡Pedido Confirmado!
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Tu pedido #{confirmedOrderId} ha sido registrado exitosamente.
                </p>
                <div className="flex space-x-3">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/checkout/confirmacion?orderId=${confirmedOrderId}`)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Ver Detalles
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/mis-pedidos')}
                  >
                    Mis Pedidos
                  </Button>
                </div>
              </div>
              <button
                onClick={() => setShowOrderNotification(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Productos - Vista alejada (80% zoom) */}
      <main className="max-w-8xl mx-auto px-8 sm:px-12 lg:px-16 pb-20">
        <div className={`grid gap-8 ${viewMode === 'grid'
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1 max-w-4xl mx-auto'
          }`}>
          {filteredProducts.map((product) => {
            const productCardData: ProductCardProduct = {
              id: product.id,
              name: product.name,
              sku: product.sku,
              basePrice: product.basePrice,
              wholesalePrice: product.wholesalePrice,
              stock: product.stock,
              unit: product.unit,
              categoryId: product.categoryId,
              mainImage: product.mainImage,
              images: product.images,
              slug: product.slug,
              shortDescription: product.shortDescription,
              brand: product.brand,
              weight: product.weight,
              dimensions: product.dimensions,
              featured: product.featured,
              tags: product.tags,
              category: product.category
            }

            return (
              <ProductCardWrapper
                key={product.id}
                product={productCardData}
                userType={session?.user?.type}
              />
            )
          })}
        </div>

        {/* Estado Vacío */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No encontramos productos
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Intenta ajustar los filtros de búsqueda o selecciona una categoría diferente
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory(null)
                }}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Limpiar filtros
              </Button>
              <Button
                onClick={() => setSearchTerm("")}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                Ver todos los productos
              </Button>
            </div>
          </div>
        )}
      </main>

    </div>
  )
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={null}>
      <CatalogoContent />
    </Suspense>
  )
}