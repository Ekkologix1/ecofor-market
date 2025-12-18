'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Badge, Button } from "@/components/ui"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { HydrationBoundary } from "@/components/HydrationBoundary"

import { 
  Package, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  PackageCheck,
  Pause,
  FileText,
  Eye,
  ChevronRight,
  ArrowLeft,
  RefreshCcw,
  Building2,
  Mail,
  DollarSign,
  ShoppingCart,
} from 'lucide-react'










// ============================================
// TIPOS E INTERFACES
// ============================================

type OrderStatus = 
  | 'RECIBIDO' 
  | 'VALIDANDO' 
  | 'APROBADO' 
  | 'PREPARANDO' 
  | 'LISTO' 
  | 'EN_RUTA' 
  | 'ENTREGADO'
  | 'COTIZACION'
  | 'CANCELADO'
  | 'RECHAZADO'
  | 'EN_ESPERA'

interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  type: 'COMPRA' | 'COTIZACION'
  total: number
  createdAt: string
  user: {
    name: string
    email: string
    type: 'NATURAL' | 'EMPRESA'
    company?: string
  }
  _count: {
    items: number
  }
  shippingMethod: string
  shippingCity?: string
  estimatedDate?: string
}

interface OrderStats {
  total: number
  byStatus: Record<OrderStatus, number>
}

// ============================================
// CONFIGURACIÓN DE ESTADOS
// ============================================

const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  icon: React.ComponentType<{ className?: string }>
}> = {
  RECIBIDO: {
    label: 'Recibido',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    icon: Package
  },
  VALIDANDO: {
    label: 'Validando',
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    icon: Clock
  },
  APROBADO: {
    label: 'Aprobado',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: CheckCircle
  },
  PREPARANDO: {
    label: 'Preparando',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    icon: Package
  },
  LISTO: {
    label: 'Listo',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-300',
    icon: PackageCheck
  },
  EN_RUTA: {
    label: 'En Ruta',
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-300',
    icon: Truck
  },
  ENTREGADO: {
    label: 'Entregado',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    icon: CheckCircle
  },
  COTIZACION: {
    label: 'Cotización',
    color: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    icon: FileText
  },
  CANCELADO: {
    label: 'Cancelado',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: XCircle
  },
  RECHAZADO: {
    label: 'Rechazado',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: XCircle
  },
  EN_ESPERA: {
    label: 'En Espera',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    icon: Pause
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AdminPedidosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Función para normalizar texto
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  // Verificar autenticación
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session?.user && session.user.role !== 'ADMIN' && session.user.role !== 'VENDEDOR') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Cargar pedidos
  useEffect(() => {
    loadOrders()
  }, [])

  // Filtrar pedidos
  useEffect(() => {
    let filtered = orders

    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    if (searchTerm.trim()) {
      const normalizedSearch = normalizeText(searchTerm)
      filtered = filtered.filter(order => 
        normalizeText(order.orderNumber).includes(normalizedSearch) ||
        normalizeText(order.user.name).includes(normalizedSearch) ||
        normalizeText(order.user.email).includes(normalizedSearch) ||
        (order.user.company && normalizeText(order.user.company).includes(normalizedSearch))
      )
    }

    setFilteredOrders(filtered)
  }, [orders, selectedStatus, searchTerm])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/orders')
      
      if (!response.ok) {
        throw new Error('Error al cargar pedidos')
      }

      const data = await response.json()
      setOrders(data.orders || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-lg">Cargando pedidos...</p>
        </div>
      </div>
    </HydrationBoundary>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header Profesional ECOFOR */}
      <header className="bg-white shadow-md border-b-4 border-emerald-500">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Izquierda: Botón Volver */}
            <div className="flex items-center justify-start">
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
            </div>

            {/* Centro: Logo */}
            <div className="flex items-center justify-center">
              <img
                src="/images/logo-ecofor.png"
                alt="ECOFOR Market"
                className="h-14 w-auto"
              />
            </div>

            {/* Derecha: Título */}
            <div className="flex flex-col items-end text-right">
              <h1 className="text-2xl font-bold text-gray-900">Panel de Gestión</h1>
              <p className="text-sm text-gray-600">Administración de Pedidos</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Panel de Estadísticas Compacto */}
        {stats && (
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = stats.byStatus[status as OrderStatus] || 0
                const Icon = config.icon
                const isActive = selectedStatus === status
                
                return (
                  <Card 
                    key={status}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                      isActive 
                        ? `border-2 ${config.borderColor} shadow-md bg-gradient-to-br ${config.bgColor}` 
                        : 'border border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedStatus(status as OrderStatus)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-9 h-9 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${config.textColor}`} />
                        </div>
                        {isActive && (
                          <CheckCircle className={`h-4 w-4 ${config.textColor}`} />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                      <p className="text-xs text-gray-600 font-medium truncate">{config.label}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Barra de Búsqueda y Filtros */}
        <Card className="mb-6 shadow-md border-l-4 border-emerald-500">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Búsqueda */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Buscar por número, cliente, email o empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-11 text-base border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  variant={selectedStatus === 'ALL' ? 'default' : 'outline'}
                  onClick={() => setSelectedStatus('ALL')}
                  className={`h-11 ${selectedStatus === 'ALL' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Todos ({stats?.total || 0})
                </Button>
                <Button
                  variant="outline"
                  onClick={loadOrders}
                  className="h-11 border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Pedidos */}
        <Card className="shadow-lg border-t-4 border-emerald-500">
          <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-blue-50 py-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {selectedStatus === 'ALL' ? 'Todos los Pedidos' : STATUS_CONFIG[selectedStatus].label}
                </CardTitle>
                <CardDescription className="text-base mt-1 text-gray-600">
                  Mostrando {filteredOrders.length} de {orders.length} pedidos totales
                </CardDescription>
              </div>
              
              {selectedStatus !== 'ALL' && (
                <Button
                  variant="ghost"
                  onClick={() => setSelectedStatus('ALL')}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Limpiar filtro
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchTerm ? 'No se encontraron pedidos' : 'No hay pedidos disponibles'}
                </h3>
                <p className="text-gray-500 mb-6 text-lg">
                  {searchTerm 
                    ? 'Intenta ajustar los términos de búsqueda'
                    : 'Los nuevos pedidos aparecerán aquí automáticamente'
                  }
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Pedido
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredOrders.map((order) => {
                      const statusConfig = STATUS_CONFIG[order.status]
                      const StatusIcon = statusConfig.icon

                      return (
                        <tr 
                          key={order.id} 
                          className="hover:bg-emerald-50 transition-colors duration-150 cursor-pointer group"
                          onClick={() => router.push(`/admin/pedidos/${order.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className={`w-11 h-11 ${statusConfig.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <StatusIcon className={`h-6 w-6 ${statusConfig.textColor}`} />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-base">{order.orderNumber}</p>
                                {order.type === 'COTIZACION' && (
                                  <Badge variant="outline" className="mt-1 text-xs border-amber-300 text-amber-700">
                                    Cotización
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900">{order.user.name}</p>
                              <p className="text-sm text-gray-600 flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {order.user.email}
                              </p>
                              {order.user.company && (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-gray-500" />
                                  <Badge variant="secondary" className="text-xs">
                                    {order.user.company}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-2 ${statusConfig.borderColor} px-3 py-1.5 font-semibold`}>
                              <StatusIcon className="h-4 w-4 mr-1.5" />
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4 text-gray-500" />
                              <span className="text-base font-semibold text-gray-900">
                                {order._count.items}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-emerald-600" />
                              <span className="font-bold text-gray-900 text-base">
                                {formatCurrency(order.total)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm space-y-1">
                              <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                              {order.estimatedDate && (
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Est: {new Date(order.estimatedDate).toLocaleDateString('es-CL')}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="group-hover:bg-emerald-100 group-hover:text-emerald-700 font-semibold"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/admin/pedidos/${order.id}`)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              Ver Detalle
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}