'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Input, Label } from "@/components/ui"
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { HydrationBoundary } from "@/components/HydrationBoundary"

import { 
  ArrowLeft,
  Package,
  User,
  MapPin,
  Calendar,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Building2,
  ShoppingCart
} from 'lucide-react'











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

interface OrderItem {
  id: string
  productSku: string
  productName: string
  productUnit: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

interface StatusHistory {
  id: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  changedBy: string
  changedAt: string
  reason?: string
  notes?: string
}

interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  type: 'COMPRA' | 'COTIZACION'
  subtotal: number
  discountAmount: number
  shippingCost: number
  total: number
  shippingAddress: string
  billingAddress?: string
  shippingMethod: string
  shippingCity?: string
  shippingDate?: string
  deliveredDate?: string
  estimatedDate?: string
  trackingNumber?: string
  customerNotes?: string
  adminNotes?: string
  cancelReason?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
    type: 'NATURAL' | 'EMPRESA'
    company?: string
    rut?: string
  }
  items: OrderItem[]
}

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
    icon: CheckCircle
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
    icon: AlertCircle
  }
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  RECIBIDO: ['VALIDANDO', 'CANCELADO'],
  VALIDANDO: ['APROBADO', 'RECHAZADO', 'EN_ESPERA', 'CANCELADO'],
  APROBADO: ['PREPARANDO', 'CANCELADO', 'EN_ESPERA'],
  PREPARANDO: ['LISTO', 'EN_ESPERA', 'CANCELADO'],
  LISTO: ['EN_RUTA', 'ENTREGADO', 'EN_ESPERA'],
  EN_RUTA: ['ENTREGADO', 'EN_ESPERA'],
  ENTREGADO: [],
  CANCELADO: [],
  RECHAZADO: [],
  EN_ESPERA: ['VALIDANDO', 'APROBADO', 'PREPARANDO', 'LISTO'],
  COTIZACION: ['RECIBIDO', 'RECHAZADO']
}

const getValidTransitions = (currentStatus: OrderStatus, shippingMethod: string): OrderStatus[] => {
  const baseTransitions = VALID_TRANSITIONS[currentStatus]
  
  const normalizedMethod = shippingMethod.toUpperCase().replace(/\s+/g, '_')
  
  if (normalizedMethod.includes('RETIRO') || normalizedMethod.includes('TIENDA')) {
    if (currentStatus === 'LISTO') {
      return baseTransitions.filter(status => status !== 'EN_RUTA')
    }
  }
  
  return baseTransitions
}

interface RouteParams {
  params: Promise<{
    orderId: string
  }>
}

export default function AdminOrderDetailPage({ params }: RouteParams) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [orderId, setOrderId] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedNewStatus, setSelectedNewStatus] = useState<OrderStatus | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [estimatedDate, setEstimatedDate] = useState('')
  const [updating, setUpdating] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error'
  }>({ show: false, message: '', type: 'success' })

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' })
    }, 4000)
  }

  useEffect(() => {
    params.then(resolved => {
      setOrderId(resolved.orderId)
    })
  }, [params])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session?.user && session.user.role !== 'ADMIN' && session.user.role !== 'VENDEDOR') {
      router.push('/dashboard')
    }
  }, [sessionStatus, session, router])

  const loadOrderDetails = useCallback(async () => {
    if (!orderId) return
    
    try {
      setLoading(true)
      
      const [orderRes, historyRes] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch(`/api/admin/orders/${orderId}/status`)
      ])

      if (!orderRes.ok || !historyRes.ok) {
        throw new Error('Error al cargar datos')
      }

      const orderData = await orderRes.json()
      const historyData = await historyRes.json()

      setOrder(orderData.order)
      setHistory(historyData.history || [])
      
      if (orderData.order.trackingNumber) {
        setTrackingNumber(orderData.order.trackingNumber)
      }
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (orderId) {
      loadOrderDetails()
    }
  }, [orderId, loadOrderDetails])

  useEffect(() => {
    if (showStatusModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showStatusModal])

  const openStatusModal = (newStatus: OrderStatus) => {
    setSelectedNewStatus(newStatus)
    setStatusReason('')
    setStatusNotes('')
    setShowStatusModal(true)
  }

  const checkTrackingNumber = async (tracking: string): Promise<boolean> => {
    if (!tracking.trim()) return true

    try {
      const response = await fetch('/api/admin/orders/check-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: tracking,
          currentOrderId: orderId
        })
      })

      const data = await response.json()

      if (data.exists) {
        showNotification(
          `Este número de seguimiento ya está en uso en el pedido ${data.orderNumber}`,
          'error'
        )
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking tracking:', error)
      return true
    }
  }

  const handleStatusChange = async () => {
    if (!selectedNewStatus || !order || !orderId) return

    const requiresReason = ['CANCELADO', 'RECHAZADO', 'EN_ESPERA'].includes(selectedNewStatus)
    if (requiresReason && !statusReason.trim()) {
      showNotification('Se requiere una razón para este cambio de estado', 'error')
      return
    }

    if (selectedNewStatus === 'EN_RUTA') {
      if (!trackingNumber.trim()) {
        showNotification('El número de seguimiento es obligatorio para cambiar a En Ruta', 'error')
        return
      }
      if (!estimatedDate.trim()) {
        showNotification('La fecha estimada es obligatoria para cambiar a En Ruta', 'error')
        return
      }

      const isTrackingValid = await checkTrackingNumber(trackingNumber)
      if (!isTrackingValid) {
        return
      }
    }

    try {
      setUpdating(true)

      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus: selectedNewStatus,
          reason: statusReason || undefined,
          notes: statusNotes || undefined,
          trackingNumber: trackingNumber || undefined,
          estimatedDate: estimatedDate || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar estado')
      }

      setShowStatusModal(false)
      await loadOrderDetails()
      
      showNotification(`Estado actualizado a ${STATUS_CONFIG[selectedNewStatus].label}`, 'success')
    } catch (error) {
      console.error('Error changing status:', error)
      showNotification(error instanceof Error ? error.message : 'Error al cambiar estado', 'error')
    } finally {
      setUpdating(false)
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (sessionStatus === 'loading' || loading || !orderId) {
    return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-lg">Cargando pedido...</p>
        </div>
      </div>
    </HydrationBoundary>
    )
  }

  if (!session || !order) {
    return null
  }

  const statusConfig = STATUS_CONFIG[order.status]
  const StatusIcon = statusConfig.icon
  const availableTransitions = getValidTransitions(order.status, order.shippingMethod)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <header className="bg-white shadow-md border-b-4 border-emerald-500">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="flex items-center justify-start">
              <Button 
                variant="outline" 
                onClick={() => router.push("/admin/pedidos")}
                className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <img
                src="/images/logo-ecofor.png"
                alt="ECOFOR Market"
                className="h-14 w-auto"
              />
            </div>

            <div className="flex items-center justify-end">
              <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-2 ${statusConfig.borderColor} px-4 py-2 text-base font-bold`}>
                <StatusIcon className="h-5 w-5 mr-2" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        <Card className="mb-6 shadow-lg border-l-4 border-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Pedido {order.orderNumber}
                </h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Creado el {formatDate(order.createdAt)}
                </p>
              </div>
              
              <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Package className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {availableTransitions.length > 0 && (
              <Card className="shadow-lg border-t-4 border-emerald-500">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
                  <CardTitle className="text-xl font-bold text-gray-900">Cambiar Estado del Pedido</CardTitle>
                  <CardDescription className="text-gray-600">
                    Selecciona el nuevo estado para actualizar este pedido
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableTransitions.map((status) => {
                      const config = STATUS_CONFIG[status]
                      const Icon = config.icon
                      
                      return (
                        <button
                          key={status}
                          onClick={() => openStatusModal(status)}
                          className={`${config.bgColor} ${config.textColor} hover:brightness-110 hover:shadow-lg hover:scale-105 h-auto py-4 px-4 border-2 ${config.borderColor} font-semibold transition-all duration-200 rounded-md cursor-pointer flex items-center justify-center`}
                        >
                          <Icon className="h-5 w-5 mr-2" />
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg border-t-4 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                  Productos del Pedido
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 mb-1">{item.productName}</p>
                        <p className="text-sm text-gray-600 mb-1">SKU: <span className="font-mono">{item.productSku}</span></p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.productUnit} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">{formatCurrency(item.subtotal)}</p>
                        {item.discount > 0 && (
                          <p className="text-xs text-green-600 font-semibold">-{item.discount}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t-2 border-gray-200 space-y-2 bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="font-medium">Descuento:</span>
                      <span className="font-semibold">-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  {order.shippingCost > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="font-medium">Envío:</span>
                      <span className="font-semibold">{formatCurrency(order.shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-300">
                    <span>Total:</span>
                    <span className="text-emerald-600">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-purple-500">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-purple-600" />
                  Historial de Estados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Sin historial disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry, index) => {
                      const fromConfig = entry.fromStatus ? STATUS_CONFIG[entry.fromStatus] : null
                      const toConfig = STATUS_CONFIG[entry.toStatus]
                      const ToIcon = toConfig.icon
                      
                      return (
                        <div key={entry.id} className="relative pl-10 pb-6">
                          {index < history.length - 1 && (
                            <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gradient-to-b from-emerald-300 to-gray-200" />
                          )}
                          
                          <div className="absolute left-0 top-2">
                            <div className={`w-8 h-8 rounded-full ${toConfig.bgColor} flex items-center justify-center border-2 ${toConfig.borderColor}`}>
                              <ToIcon className={`h-4 w-4 ${toConfig.textColor}`} />
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              {fromConfig && (
                                <>
                                  <Badge className={`${fromConfig.bgColor} ${fromConfig.textColor} text-xs`}>
                                    {fromConfig.label}
                                  </Badge>
                                  <span className="text-gray-400">→</span>
                                </>
                              )}
                              <Badge className={`${toConfig.bgColor} ${toConfig.textColor} text-xs font-semibold`}>
                                {toConfig.label}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {formatDate(entry.changedAt)}
                            </p>
                            
                            {entry.reason && (
                              <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                                <p className="text-sm text-amber-900">
                                  <strong>Razón:</strong> {entry.reason}
                                </p>
                              </div>
                            )}
                            
                            {entry.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            
            <Card className="shadow-lg border-t-4 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Nombre</p>
                  <p className="font-bold text-gray-900">{order.user.name}</p>
                </div>
                
                {order.user.company && (
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 mb-1 uppercase font-semibold flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Empresa
                    </p>
                    <p className="font-bold text-emerald-900">{order.user.company}</p>
                  </div>
                )}
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1 uppercase font-semibold flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <p className="font-semibold text-blue-900 text-sm break-all">{order.user.email}</p>
                </div>
                
                {order.user.phone && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 mb-1 uppercase font-semibold flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Teléfono
                    </p>
                    <p className="font-semibold text-green-900">{order.user.phone}</p>
                  </div>
                )}
                
                {order.user.rut && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 mb-1 uppercase font-semibold">RUT</p>
                    <p className="font-semibold text-purple-900">{order.user.rut}</p>
                  </div>
                )}
                
                <div className="pt-2 border-t border-gray-200">
                  <Badge variant="outline" className="text-xs font-semibold">
                    {order.user.type === 'EMPRESA' ? 'Cliente Empresa' : 'Cliente Natural'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-t-4 border-emerald-500">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-emerald-600" />
                  Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <p className="text-xs text-emerald-600 mb-1 uppercase font-semibold">Método</p>
                  <p className="font-bold text-emerald-900">{order.shippingMethod}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2 uppercase font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Dirección
                  </p>
                  <p className="font-semibold text-gray-900 text-sm">{order.shippingAddress}</p>
                </div>
                
                {order.shippingCity && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1 uppercase font-semibold">Ciudad</p>
                    <p className="font-semibold text-blue-900">{order.shippingCity}</p>
                  </div>
                )}
                
                {order.trackingNumber && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1 uppercase font-semibold">Seguimiento</p>
                    <p className="font-mono font-bold text-purple-900">{order.trackingNumber}</p>
                  </div>
                )}
                
                {order.estimatedDate && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-600 mb-1 uppercase font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Fecha Estimada
                    </p>
                    <p className="font-bold text-amber-900">
                      {new Date(order.estimatedDate).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(order.customerNotes || order.adminNotes || order.cancelReason) && (
              <Card className="shadow-lg border-t-4 border-amber-500">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {order.customerNotes && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs font-semibold text-blue-600 mb-2 uppercase">Cliente:</p>
                      <p className="text-sm text-blue-900">{order.customerNotes}</p>
                    </div>
                  )}
                  
                  {order.adminNotes && (
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <p className="text-xs font-semibold text-emerald-600 mb-2 uppercase">Admin:</p>
                      <p className="text-sm text-emerald-900">{order.adminNotes}</p>
                    </div>
                  )}
                  
                  {order.cancelReason && (
                    <div className="bg-red-50 p-3 rounded-lg border-2 border-red-300">
                      <p className="text-xs font-bold text-red-600 mb-2 uppercase flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        Cancelación:
                      </p>
                      <p className="text-sm text-red-900 font-semibold">{order.cancelReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showStatusModal && selectedNewStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className={`${STATUS_CONFIG[selectedNewStatus].bgColor} p-6 rounded-t-2xl border-b-2 ${STATUS_CONFIG[selectedNewStatus].borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${STATUS_CONFIG[selectedNewStatus].bgColor} rounded-xl flex items-center justify-center border-2 ${STATUS_CONFIG[selectedNewStatus].borderColor}`}>
                    <Edit className={`h-6 w-6 ${STATUS_CONFIG[selectedNewStatus].textColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Cambiar Estado</h3>
                    <p className={`text-sm font-semibold ${STATUS_CONFIG[selectedNewStatus].textColor}`}>
                      {STATUS_CONFIG[selectedNewStatus].label}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowStatusModal(false)}
                  disabled={updating}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {['CANCELADO', 'RECHAZADO', 'EN_ESPERA'].includes(selectedNewStatus) && (
                <div>
                  <Label htmlFor="reason" className="text-sm font-bold text-gray-900 mb-2 block">
                    Razón <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="reason"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Explica el motivo..."
                    className="h-11"
                  />
                </div>
              )}
              
              {selectedNewStatus === 'EN_RUTA' && (
                <>
                  <div>
                    <Label htmlFor="tracking" className="text-sm font-bold text-gray-900 mb-2 block">
                      Número de Seguimiento <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="FDX123456789"
                      className="h-11"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="estimated" className="text-sm font-bold text-gray-900 mb-2 block">
                      Fecha Estimada <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="estimated"
                      type="date"
                      value={estimatedDate}
                      onChange={(e) => setEstimatedDate(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </>
              )}
              
              <div>
                <Label htmlFor="notes" className="text-sm font-bold text-gray-900 mb-2 block">
                  Notas <span className="text-gray-400 font-normal">(opcional)</span>
                </Label>
                <Input
                  id="notes"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Información adicional..."
                  className="h-11"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleStatusChange}
                  disabled={updating}
                  className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowStatusModal(false)}
                  disabled={updating}
                  className="h-12 px-6"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className={`${
            notification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
              : 'bg-red-50 border-red-500 text-red-900'
          } border-l-4 rounded-lg shadow-2xl p-4 min-w-[320px] max-w-md`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                notification.type === 'success' 
                  ? 'bg-emerald-100' 
                  : 'bg-red-100'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className={`h-6 w-6 ${
                    notification.type === 'success' 
                      ? 'text-emerald-600' 
                      : 'text-red-600'
                  }`} />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{notification.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                className="h-8 w-8 p-0 hover:bg-transparent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}