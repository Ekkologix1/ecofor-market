'use client'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui"
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, Package, Truck, Clock, ArrowLeft, MapPin, FileText, Phone, Mail, AlertCircle, Eye, Download } from 'lucide-react'
import Image from 'next/image'



import { HydrationBoundary } from "@/components/HydrationBoundary"

interface OrderItem {
  id: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  subtotal: number
  product: {
    name: string
    mainImage?: string
  }
}

interface OrderDetails {
  id: string
  orderNumber: string
  status: string
  type: string
  total: number
  createdAt: string
  shippingMethod: 'RETIRO_TIENDA' | 'DESPACHO_GRATIS'
  estimatedDate?: string
  items: OrderItem[]
}

// Componente interno que usa useSearchParams
function OrderConfirmationContent() {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle')
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const orderId = searchParams.get('orderId')
  const orderNumber = searchParams.get('orderNumber')

  useEffect(() => {
    if (!orderId) {
      setError('No se encontró el ID del pedido')
      setLoading(false)
      return
    }
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Error al cargar los detalles del pedido')
      }
      const data = await response.json()
      setOrder(data.order)
    } catch (err) {
      setError('Error al cargar los detalles del pedido')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'RECIBIDO': 'bg-blue-500 text-white',
      'VALIDANDO': 'bg-yellow-500 text-white', 
      'APROBADO': 'bg-green-500 text-white',
      'PREPARANDO': 'bg-orange-500 text-white',
      'EN_RUTA': 'bg-purple-500 text-white',
      'ENTREGADO': 'bg-emerald-500 text-white'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500 text-white'
  }

  const getStatusText = (status: string) => {
    const texts = {
      'RECIBIDO': 'Pedido Recibido',
      'VALIDANDO': 'Validando Pedido',
      'APROBADO': 'Pedido Aprobado', 
      'PREPARANDO': 'Preparando Pedido',
      'EN_RUTA': 'En Camino',
      'ENTREGADO': 'Entregado'
    }
    return texts[status as keyof typeof texts] || status
  }

  const getShippingMethodText = (method: string, subtotal: number = 0) => {
    if (method === 'RETIRO_TIENDA') return 'Retiro en tienda'
    
    // Para DESPACHO_GRATIS, verificar si realmente es gratis
    if (method === 'DESPACHO_GRATIS') {
      return subtotal >= 35000 ? 'Despacho gratuito' : 'Despacho'
    }
    
    return method
  }

  const calculateTotals = () => {
    if (!order) return { subtotal: 0, shipping: 0, total: 0 }
    
    const subtotal = order.items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
    let shipping = 0
    
    // Solo calcular costo de envío para despacho (no para retiro en tienda)
    if (order.shippingMethod === 'DESPACHO_GRATIS' && subtotal < 35000) {
      shipping = 5000
    }
    
    return {
      subtotal,
      shipping,
      total: subtotal + shipping
    }
  }

  const viewBoleta = () => {
    if (!order) return
    // Abrir boleta en nueva pestaña
    window.open(`/api/orders/${order.id}/view-boleta`, '_blank')
  }

  const downloadComprobante = async () => {
    if (!order) return
    
    setDownloadState('downloading')
    
    try {
      const response = await fetch(`/api/orders/${order.id}/download-pdf`)
      
      if (!response.ok) {
        throw new Error('Error al generar el PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `boleta-${order.orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setDownloadState('success')
      setTimeout(() => setDownloadState('idle'), 3000)
      
    } catch (error) {
      console.error('Error al descargar comprobante:', error)
      setDownloadState('error')
      setTimeout(() => setDownloadState('idle'), 4000)
    }
  }

  if (loading) {
    return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando detalles del pedido...</p>
        </div>
      </div>
    </HydrationBoundary>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="text-center p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3"
            >
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header de Confirmación */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Pedido Confirmado
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Tu pedido ha sido recibido exitosamente y está siendo procesado
          </p>
        </div>

        {/* Layout Principal - Horizontal en desktop, vertical en móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          
          {/* Card Principal - Información del Pedido */}
          <Card className="border-0 shadow-xl bg-white">
            
            {/* Header del Pedido */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white rounded-t-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold mb-1">Pedido #{order.orderNumber}</h2>
                  <p className="text-emerald-100 text-sm">
                    {new Date(order.createdAt).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Badge className={`${getStatusColor(order.status)} text-xs px-3 py-1`}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
            </div>

            <CardContent className="p-8">
              
              {/* Información del Pedido */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-800 text-sm">Tipo</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">
                    {order.type === 'COMPRA' ? 'Compra' : 'Cotización'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Truck className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-800 text-sm">Envío</span>
                  </div>
                  <p className="text-base font-bold text-gray-900">
                    {getShippingMethodText(order.shippingMethod, totals.subtotal)}
                  </p>
                </div>
              </div>

              {/* Información de Entrega */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-blue-900 text-base mb-1">Información de Entrega</h3>
                    <p className="text-blue-800 text-sm">
                      {order.shippingMethod === 'RETIRO_TIENDA' 
                        ? 'Tu pedido estará listo para retiro en nuestra tienda. Te notificaremos cuando esté disponible.'
                        : 'Recibirás notificaciones por correo y SMS con el seguimiento de tu envío.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segunda Columna - Productos y Resumen */}
          <div className="space-y-8">
            
            {/* Productos */}
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="bg-white pb-6">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <Package className="h-6 w-6 text-emerald-600" />
                  <span>Productos Pedidos</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-sm mr-4 overflow-hidden flex-shrink-0">
                        {item.product.mainImage ? (
                          <Image
                            src={item.product.mainImage}
                            alt={item.productName}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{item.productName}</h4>
                        <p className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded border inline-block">
                          {item.productSku}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500 mb-1">Cantidad</p>
                        <p className="font-bold text-lg text-gray-900">{item.quantity}</p>
                        <p className="text-xs text-gray-500 mt-1">${item.unitPrice.toLocaleString()}</p>
                        <p className="font-bold text-emerald-600 text-sm">${item.subtotal.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumen de Totales */}
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="bg-white pb-6">
                <CardTitle className="text-xl text-emerald-600">Resumen de Totales</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-6 pb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal productos:</span>
                    <span className="text-sm font-semibold text-gray-900">${totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Envío:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {totals.shipping === 0 ? 'Gratis' : `$${totals.shipping.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-emerald-900">Total Final:</span>
                      <span className="text-xl font-black text-emerald-600">${totals.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Condiciones */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center text-xs">
              <p className="text-amber-800">
                <strong>Condiciones de Pago:</strong> {' '}
                {order.type === 'COMPRA' 
                  ? 'El pago se realizará contra entrega según condiciones comerciales.'
                  : 'Esta cotización es válida por 30 días.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-wrap gap-4 justify-center mt-16">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Inicio</span>
          </Button>
          
          <Button
            onClick={() => router.push('/mis-pedidos')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Ver Mis Pedidos
          </Button>
          
          {/* Botón para Ver Boleta en Nueva Pestaña */}
          <Button
            onClick={viewBoleta}
            variant="outline"
            className="flex items-center space-x-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Eye className="h-4 w-4" />
            <span>Ver Boleta</span>
          </Button>
          
          {/* Botón de Descarga con Estados Visuales */}
          <Button
            onClick={downloadComprobante}
            disabled={downloadState === 'downloading'}
            variant="outline"
            className={`flex items-center space-x-2 transition-all duration-200 ${
              downloadState === 'success' 
                ? 'border-green-500 text-green-700 bg-green-50' 
                : downloadState === 'error'
                ? 'border-red-500 text-red-700 bg-red-50'
                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
            }`}
          >
            {downloadState === 'downloading' && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                <span>Generando PDF...</span>
              </>
            )}
            {downloadState === 'success' && (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span>PDF Descargado</span>
              </>
            )}
            {downloadState === 'error' && (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Error - Reintentar</span>
              </>
            )}
            {downloadState === 'idle' && (
              <>
                <Download className="h-4 w-4" />
                <span>Descargar PDF</span>
              </>
            )}
          </Button>
          
          <Button
            onClick={() => router.push('/catalogo')}
            variant="outline"
          >
            Seguir Comprando
          </Button>
        </div>

        {/* Mensaje de Estado de Descarga */}
        {downloadState === 'success' && (
          <div className="text-center mb-4">
            <p className="text-xs text-green-600 animate-fade-in">
              Comprobante PDF descargado exitosamente. Revisa tu carpeta de descargas.
            </p>
          </div>
        )}

        {downloadState === 'error' && (
          <div className="text-center mb-4">
            <p className="text-xs text-red-600 animate-fade-in">
              Error al generar PDF. Haz clic en "Reintentar" para intentar nuevamente.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-20">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <h3 className="font-bold mb-6 text-xl">¿Necesitas Ayuda?</h3>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-gray-600">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-emerald-600" />
                  <span className="text-base font-medium">+56 9 1234 5678</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-emerald-600" />
                  <span className="text-base font-medium">soporte@ecofor.cl</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Export default con Suspense
export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <OrderConfirmationContent />
    </Suspense>
  )
}