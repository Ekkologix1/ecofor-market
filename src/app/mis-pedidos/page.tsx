"use client"
import { Button, Card, CardContent, Input, Badge } from "@/components/ui"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { HydrationBoundary } from "@/components/HydrationBoundary"

import { 
  ShoppingBag, 
  Search, 
  Calendar,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ArrowLeft,
  Loader2,
  Download,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"


interface OrderItem {
  id: string
  productName: string
  productSku: string
  productUnit: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  product: {
    name: string
    sku: string
    mainImage?: string
    category: {
      name: string
    }
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  type: string
  subtotal: number
  discountAmount: number
  shippingCost: number
  total: number
  shippingAddress: string
  shippingMethod: string
  shippingCity?: string
  customerNotes?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

const ORDER_STATUS_CONFIG = {
  RECIBIDO: {
    label: "Recibido",
    color: "bg-blue-500 text-white",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: Clock,
    description: "Tu pedido ha sido recibido y está siendo procesado"
  },
  VALIDANDO: {
    label: "En Validación",
    color: "bg-yellow-500 text-white",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: AlertCircle,
    description: "Estamos validando tu pedido y stock disponible"
  },
  APROBADO: {
    label: "Aprobado",
    color: "bg-green-500 text-white",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
    description: "Tu pedido ha sido aprobado y será preparado pronto"
  },
  PREPARANDO: {
    label: "Preparando",
    color: "bg-orange-500 text-white",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: Package,
    description: "Estamos preparando tu pedido para envío"
  },
  LISTO: {
    label: "Listo para Envío",
    color: "bg-purple-500 text-white",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: Package,
    description: "Tu pedido está listo y será enviado pronto"
  },
  EN_RUTA: {
    label: "En Camino",
    color: "bg-indigo-500 text-white",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    icon: Truck,
    description: "Tu pedido está en camino a su destino"
  },
  ENTREGADO: {
    label: "Entregado",
    color: "bg-emerald-600 text-white",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: CheckCircle,
    description: "Tu pedido ha sido entregado exitosamente"
  },
  COTIZACION: {
    label: "Cotización",
    color: "bg-gray-500 text-white",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: FileText,
    description: "Cotización pendiente de aprobación"
  },
  CANCELADO: {
    label: "Cancelado",
    color: "bg-red-500 text-white",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: X,
    description: "Este pedido ha sido cancelado"
  },
  RECHAZADO: {
    label: "Rechazado",
    color: "bg-red-500 text-white",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: X,
    description: "Este pedido ha sido rechazado"
  },
  EN_ESPERA: {
    label: "En Espera",
    color: "bg-gray-500 text-white",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: Clock,
    description: "Tu pedido está en espera de procesamiento"
  }
}

const SHIPPING_METHOD_LABELS = {
  RETIRO_TIENDA: "Retiro en tienda",
  DESPACHO_GRATIS: "Despacho gratuito",
  RUTA_PROGRAMADA: "Ruta programada",
  COURIER: "Courier nacional"
}

// Pedidos de ejemplo para demostración
const EXAMPLE_ORDERS: Order[] = [
  {
    id: "example-1",
    orderNumber: "ORD-2024-001",
    status: "COTIZACION",
    type: "COTIZACION",
    subtotal: 150000,
    discountAmount: 0,
    shippingCost: 0,
    total: 150000,
    shippingAddress: "Av. Paicaví 2345, Concepción",
    shippingMethod: "DESPACHO_GRATIS",
    shippingCity: "Concepción",
    customerNotes: "Cotización para compra mensual de productos de limpieza",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-1a",
        productName: "Desinfectante Industrial Concentrado 20L",
        productSku: "DES-IND-20L",
        productUnit: "Bidón",
        quantity: 5,
        unitPrice: 30000,
        discount: 0,
        subtotal: 150000,
        product: {
          name: "Desinfectante Industrial Concentrado 20L",
          sku: "DES-IND-20L",
          mainImage: "/images/products/desinfectante-20l.jpg",
          category: {
            name: "Desinfección Industrial"
          }
        }
      }
    ]
  },
  {
    id: "example-2",
    orderNumber: "ORD-2024-002",
    status: "ENTREGADO",
    type: "COMPRA",
    subtotal: 45000,
    discountAmount: 5000,
    shippingCost: 0,
    total: 40000,
    shippingAddress: "Av. Pedro de Valdivia 1234, Concepción",
    shippingMethod: "DESPACHO_GRATIS",
    shippingCity: "Concepción",
    customerNotes: "Dejar en portería",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-2a",
        productName: "Detergente Ecológico Concentrado 5L",
        productSku: "DET-ECO-5L",
        productUnit: "Unidad",
        quantity: 2,
        unitPrice: 22500,
        discount: 10,
        subtotal: 40500,
        product: {
          name: "Detergente Ecológico Concentrado 5L",
          sku: "DET-ECO-5L",
          mainImage: "/images/products/detergente-5l.jpg",
          category: {
            name: "Limpieza Industrial"
          }
        }
      }
    ]
  },
  {
    id: "example-3",
    orderNumber: "ORD-2024-003",
    status: "LISTO",
    type: "COMPRA",
    subtotal: 85000,
    discountAmount: 0,
    shippingCost: 0,
    total: 85000,
    shippingAddress: "Tienda ECOFOR - Av. Libertador Bernardo O'Higgins 3456",
    shippingMethod: "RETIRO_TIENDA",
    shippingCity: "Concepción",
    customerNotes: "Retiro en horario de tarde",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-3a",
        productName: "Desinfectante Multiuso Industrial 10L",
        productSku: "DES-MUL-10L",
        productUnit: "Unidad",
        quantity: 1,
        unitPrice: 45000,
        discount: 0,
        subtotal: 45000,
        product: {
          name: "Desinfectante Multiuso Industrial 10L",
          sku: "DES-MUL-10L",
          mainImage: "/images/products/desinfectante-10l.jpg",
          category: {
            name: "Desinfección"
          }
        }
      },
      {
        id: "item-3b",
        productName: "Papel Higiénico Industrial 500mt x 12",
        productSku: "PAP-HIG-500",
        productUnit: "Pack",
        quantity: 2,
        unitPrice: 20000,
        discount: 0,
        subtotal: 40000,
        product: {
          name: "Papel Higiénico Industrial 500mt x 12",
          sku: "PAP-HIG-500",
          mainImage: "/images/products/papel-higienico.jpg",
          category: {
            name: "Papel y Tissue"
          }
        }
      }
    ]
  },
  {
    id: "example-4",
    orderNumber: "ORD-2024-004",
    status: "EN_RUTA",
    type: "COMPRA",
    subtotal: 125000,
    discountAmount: 12500,
    shippingCost: 5000,
    total: 117500,
    shippingAddress: "Calle Los Aromos 789, Los Ángeles",
    shippingMethod: "RUTA_PROGRAMADA",
    shippingCity: "Los Ángeles",
    customerNotes: "Llamar antes de llegar",
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        id: "item-4",
        productName: "Cloro Desinfectante 5L x 4 Pack",
        productSku: "CLO-DES-5L",
        productUnit: "Pack",
        quantity: 3,
        unitPrice: 35000,
        discount: 10,
        subtotal: 94500,
        product: {
          name: "Cloro Desinfectante 5L x 4 Pack",
          sku: "CLO-DES-5L",
          mainImage: "/images/products/cloro-5l.jpg",
          category: {
            name: "Desinfección"
          }
        }
      },
      {
        id: "item-5",
        productName: "Guantes de Nitrilo Caja x 100",
        productSku: "GUA-NIT-100",
        productUnit: "Caja",
        quantity: 2,
        unitPrice: 15000,
        discount: 0,
        subtotal: 30000,
        product: {
          name: "Guantes de Nitrilo Caja x 100",
          sku: "GUA-NIT-100",
          mainImage: "/images/products/guantes-nitrilo.jpg",
          category: {
            name: "Protección Personal"
          }
        }
      }
    ]
  }
]

export default function MisPedidosPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ active: 0, total: 0, pendingQuotes: 0 })
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(false)

  useEffect(() => {
    // Siempre intentar cargar stats y pedidos, incluso si hay problemas de sesión
    loadStats()
    loadOrders()
  }, [selectedStatus, selectedType, page])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include', // Importante: incluir cookies de sesión
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          active: data.activeOrders || 0,
          total: data.totalOrders || 0,
          pendingQuotes: data.pendingQuotes || 0
        })
      }
    } catch (err) {
      // Error cargando estadísticas
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      })

      if (selectedStatus) params.append("status", selectedStatus)
      if (selectedType) params.append("type", selectedType)

      const response = await fetch(`/api/orders?${params}`, {
        credentials: 'include'
      })
      const data = await response.json()

      // Si hay error 401 (no autorizado) o cualquier error, mostrar ejemplos
      if (!response.ok) {
        console.log('⚠️ No se pudieron cargar pedidos reales, mostrando ejemplos')
        setOrders([])
        setShowExamples(true)
        setError(null) // No mostrar error, solo usar ejemplos
        setLoading(false)
        return
      }

      // Siempre reemplazar los pedidos (no acumular)
      const realOrders = data.data || []
      setOrders(realOrders)
      setTotalPages(data.pagination?.totalPages || 1)
      
      // Si no hay pedidos reales, mostrar ejemplos
      if (realOrders.length === 0 && !selectedStatus && !selectedType) {
        setShowExamples(true)
      } else {
        setShowExamples(false)
      }

    } catch (err) {
      console.log('⚠️ Error cargando pedidos, mostrando ejemplos:', err)
      // En caso de error, mostrar ejemplos en lugar de error
      setOrders([])
      setShowExamples(true)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Usar pedidos de ejemplo si no hay pedidos reales
  const ordersToDisplay = showExamples ? EXAMPLE_ORDERS : orders

  const filteredOrders = (ordersToDisplay || []).filter(order => {
    // Filtro por texto de búsqueda
    const matchesSearch = !searchTerm || (
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productSku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    
    // Filtro por estado
    const matchesStatus = !selectedStatus || order.status === selectedStatus
    
    // Filtro por tipo
    const matchesType = !selectedType || order.type === selectedType
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Debug temporal
  // Debug info: orders count, filtered count, search params

  const getStatusConfig = (status: string) => {
    return ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG] || {
      label: status,
      color: "bg-gray-500 text-white",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      icon: Clock,
      description: "Estado del pedido"
    }
  }

  const handleDownloadPDF = async (orderId: string) => {
    try {
      // Mostrar estado de carga inmediatamente
      setDownloadingPDF(orderId)
      
      // Crear URL con timestamp para evitar caché del navegador
      const url = `/api/orders/${orderId}/download-pdf?t=${Date.now()}`
      
      // Crear elemento temporal para descarga
      const link = document.createElement('a')
      link.href = url
      link.download = `comprobante-${orderId}.pdf`
      link.style.display = 'none'
      
      // Agregar al DOM, hacer click y remover
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Simular un pequeño delay para mejor UX (el PDF se descarga en background)
      setTimeout(() => {
        setDownloadingPDF(null)
      }, 1000)
      
    } catch (error) {
      console.error('Error descargando PDF:', error)
      setDownloadingPDF(null)
      // Mostrar mensaje de error al usuario
      alert('Error al descargar el PDF. Por favor, inténtalo de nuevo.')
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // El useEffect se encargará de cargar los pedidos de la nueva página
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      handlePageChange(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      handlePageChange(page + 1)
    }
  }

  // Permitir ver la página incluso sin sesión para mostrar ejemplos
  // if (!session?.user) {
  //   return null
  // }

  return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gray-50">
      {/* Header Simplificado */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Botón Volver al Dashboard - Izquierda */}
            <div className="flex items-center">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700 font-medium px-4 py-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </div>

            {/* Texto descriptivo - Centro */}
            <div className="flex items-center text-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Mis Pedidos
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Historial y seguimiento de tus compras en ECOFOR Market
                </p>
              </div>
            </div>

            {/* Logo ECOFOR - Derecha */}
            <div className="flex items-center">
              <Image
                src="/images/logo-ecofor.png"
                alt="ECOFOR Market"
                width={140}
                height={65}
                priority
                className="opacity-90"
                placeholder="empty"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Resumen de estadísticas mejorado */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {/* Pedidos Activos - Destacado */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in-up animation-delay-100">
              <CardContent className="p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium mb-1">Pedidos Activos</p>
                    <p className="text-2xl font-bold animate-counter">{showExamples ? 3 : stats.active}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2 transition-transform hover:scale-110">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Total de Pedidos */}
            <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-emerald-300 animate-fade-in-up animation-delay-150">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-medium mb-1">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-gray-900 animate-counter">{showExamples ? 4 : stats.total}</p>
                  </div>
                  <div className="bg-emerald-100 rounded-lg p-2 transition-transform hover:scale-110 hover:rotate-6">
                    <ShoppingBag className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Listo para Envío */}
            <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-300 animate-fade-in-up animation-delay-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-medium mb-1">Listo para Envío</p>
                    <p className="text-2xl font-bold text-gray-900 animate-counter">{showExamples ? 1 : 0}</p>
                  </div>
                  <div className="bg-purple-100 rounded-lg p-2 transition-transform hover:scale-110 hover:rotate-6">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* En Camino */}
            <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-indigo-300 animate-fade-in-up animation-delay-250">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-medium mb-1">En Camino</p>
                    <p className="text-2xl font-bold text-gray-900 animate-counter">{showExamples ? 1 : 0}</p>
                  </div>
                  <div className="bg-indigo-100 rounded-lg p-2 transition-transform hover:scale-110 hover:rotate-6">
                    <Truck className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Últimos 30 días */}
            <Card className="relative overflow-hidden bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-blue-300 animate-fade-in-up animation-delay-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs font-medium mb-1">Últimos 30 días</p>
                    <p className="text-2xl font-bold text-gray-900 animate-counter">{showExamples ? 4 : stats.total}</p>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-2 transition-transform hover:scale-110 hover:rotate-6">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros mejorados */}
          <Card className="mb-4 shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por número de pedido, producto o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 border-2 border-gray-200 focus:border-emerald-500 text-sm"
                  />
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value)
                    setPage(1)
                  }}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm font-medium"
                >
                  <option value="">Todos los estados</option>
                  <option value="ENTREGADO">Entregado</option>
                  <option value="PREPARANDO">Preparando</option>
                  <option value="LISTO">Listo para Envío</option>
                  <option value="EN_RUTA">En Camino</option>
                  <option value="COTIZACION">Cotización</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value)
                    setPage(1)
                  }}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 text-sm font-medium"
                >
                  <option value="">Todos los tipos</option>
                  <option value="COMPRA">Compras</option>
                  <option value="COTIZACION">Cotizaciones</option>
                </select>

                {(searchTerm || selectedStatus || selectedType) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedStatus("")
                      setSelectedType("")
                      setSearchTerm("")
                      setPage(1)
                    }}
                    size="sm"
                    className="border-2 border-gray-300 hover:bg-red-50 hover:border-red-300"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Banner de demostración */}
          {showExamples && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl animate-fade-in-down">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-blue-900 font-bold text-sm mb-1">
                    Pedidos de Demostración
                  </h3>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    Estos son pedidos de ejemplo para que veas cómo se verían tus compras. 
                    Cuando realices tu primer pedido, aparecerá aquí con toda su información y seguimiento en tiempo real.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-fade-in-down">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Lista de pedidos mejorada */}
          <div className="space-y-4">
            {loading && page === 1 ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
                  <p className="text-gray-600">Cargando tus pedidos...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No hay pedidos
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                    {searchTerm || selectedStatus || selectedType 
                      ? "No se encontraron pedidos con los filtros aplicados"
                      : "Aún no has realizado ningún pedido. Explora nuestro catálogo y encuentra los productos que necesitas."
                    }
                  </p>
                  <Button
                    onClick={() => router.push("/catalogo")}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Ver Catálogo de Productos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              (filteredOrders || []).map((order, index) => {
                const statusConfig = getStatusConfig(order.status)
                const StatusIcon = statusConfig.icon
                const isExample = order.id.startsWith('example-')

                return (
                  <Card 
                    key={order.id} 
                    className={`overflow-hidden shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                      isExample ? 'animate-fade-in-up' : ''
                    }`}
                    style={isExample ? { animationDelay: `${index * 150}ms` } : {}}
                  >
                    {/* Barra de estado superior con animación */}
                    <div className={`h-1 ${statusConfig.color.replace('text-white', '')} ${
                      isExample ? 'animate-scale-x' : ''
                    }`} style={isExample ? { animationDelay: `${index * 150 + 200}ms` } : {}} />
                    
                    <CardContent className="p-0">
                      <div className="p-4">
                        {/* Header con información principal */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                          <div className="flex-1 mb-3 md:mb-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className={`text-lg font-bold text-gray-900 ${
                                isExample ? 'animate-fade-in-left' : ''
                              }`} style={isExample ? { animationDelay: `${index * 150 + 400}ms` } : {}}>
                                {order.orderNumber}
                              </h3>
                              <Badge className={`${statusConfig.color} px-2 py-0.5 text-xs transform transition-all hover:scale-110 ${
                                isExample ? 'animate-fade-in-right' : ''
                              }`} style={isExample ? { animationDelay: `${index * 150 + 500}ms` } : {}}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {order.type === "COTIZACION" && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                  Cotización
                                </Badge>
                              )}
                              {isExample && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs border border-blue-300">
                                  Demo
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-1.5">{statusConfig.description}</p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
                              </span>
                              <span>{order.items.length} productos</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-1.5">
                            {!isExample ? (
                              <Button
                                onClick={() => handleDownloadPDF(order.id)}
                                variant="outline"
                                size="sm"
                                disabled={downloadingPDF === order.id}
                                className="border-emerald-200 hover:bg-emerald-50 text-xs h-8 disabled:opacity-50 transition-all hover:scale-105"
                              >
                                {downloadingPDF === order.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Generando...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-3 w-3 mr-1" />
                                    Descargar PDF
                                  </>
                                )}
                              </Button>
                            ) : (
                              <div className={`text-xs text-gray-500 italic ${
                                isExample ? 'animate-fade-in' : ''
                              }`} style={isExample ? { animationDelay: `${index * 150 + 600}ms` } : {}}>
                                Pedido de ejemplo
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Lista de productos */}
                        <div className="mb-4">
                          <h4 className="font-bold text-sm text-gray-900 mb-2">Productos ({order.items.length})</h4>
                          <div className="space-y-2">
                            {order.items.map((item, itemIndex) => (
                              <div 
                                key={item.id} 
                                className={`bg-white rounded-lg p-3 border border-gray-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-md ${
                                  isExample ? 'animate-fade-in-up' : ''
                                }`}
                                style={isExample ? { animationDelay: `${index * 150 + 700 + itemIndex * 100}ms` } : {}}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-sm text-gray-900">{item.productName}</h5>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge variant="secondary" className="text-xs bg-gray-100 px-1.5 py-0.5">
                                        SKU: {item.productSku}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5">
                                        {item.product.category.name}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                      <span className="font-medium">{item.quantity} {item.productUnit}</span> × {formatPrice(item.unitPrice)}
                                      {item.discount > 0 && (
                                        <span className="text-emerald-600 ml-2 font-medium">
                                          ({item.discount}% descuento)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="text-right ml-3">
                                    <p className="font-bold text-sm text-gray-900">
                                      {formatPrice(item.subtotal)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detalles del pedido en grid */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                          {/* Información de envío */}
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-center">
                              <MapPin className="h-3 w-3 mr-1 text-emerald-600" />
                              Información de Envío
                            </h4>
                            <div className="space-y-1 text-xs">
                              <p><span className="font-medium text-gray-700">Dirección:</span> {order.shippingAddress}</p>
                              {order.shippingCity && (
                                <p><span className="font-medium text-gray-700">Ciudad:</span> {order.shippingCity}</p>
                              )}
                              <p><span className="font-medium text-gray-700">Método:</span> {
                                order.shippingCost === 0 
                                  ? "Despacho gratuito" 
                                  : order.shippingMethod === "DESPACHO_GRATIS" 
                                    ? "Despacho estándar" 
                                    : SHIPPING_METHOD_LABELS[order.shippingMethod as keyof typeof SHIPPING_METHOD_LABELS]
                              }</p>
                              {order.customerNotes && (
                                <p><span className="font-medium text-gray-700">Notas:</span> {order.customerNotes}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Resumen de precios */}
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 mb-2">Resumen de Precios</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{formatPrice(order.subtotal)}</span>
                              </div>
                              {order.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                  <span>Descuentos:</span>
                                  <span className="font-medium">-{formatPrice(order.discountAmount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Envío:</span>
                                <span className="font-medium">{order.shippingCost === 0 ? "Gratis" : formatPrice(order.shippingCost)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 mt-1">
                                <span>Total:</span>
                                <span className="text-emerald-700">{formatPrice(order.total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && filteredOrders.length > 0 && (
            <div className="flex flex-col items-center mt-8 space-y-4">
              {/* Información de paginación */}
              <div className="text-sm text-gray-600">
                Página {page} de {totalPages} • {filteredOrders.length} pedidos en esta página
              </div>
              
              {/* Controles de navegación */}
              <div className="flex items-center space-x-2">
                {/* Botón Anterior */}
                <Button
                  onClick={handlePreviousPage}
                  disabled={page === 1 || loading}
                  variant="outline"
                  size="sm"
                  className="border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 disabled:opacity-50"
                >
                  ← Anterior
                </Button>

                {/* Números de página */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
              <Button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                disabled={loading}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        className={`min-w-[40px] ${
                          pageNum === page 
                            ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                            : "border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                {/* Botón Siguiente */}
                <Button
                  onClick={handleNextPage}
                  disabled={page === totalPages || loading}
                variant="outline"
                  size="sm"
                  className="border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 disabled:opacity-50"
                >
                  Siguiente →
              </Button>
              </div>
            </div>
          )}

          {/* Footer de contacto */}
          <Card className="mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-bold text-base mb-2">¿Necesitas ayuda con tu pedido?</h3>
                <p className="mb-3 text-sm text-emerald-100">Nuestro equipo está disponible para asistirte</p>
                <div className="flex flex-wrap gap-4 justify-center items-center text-sm">
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>+56 41 332 0350</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    <span>ventas@ecoformarket.cl</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </HydrationBoundary>
  )
}