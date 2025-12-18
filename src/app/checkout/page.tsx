'use client'


import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui"
import { useCSRF } from "@/hooks"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, MapPin, Truck, Package, CreditCard, AlertCircle, Store, Gift, Sparkles, ShoppingBag, Calendar, FileText, Building, User, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { SHIPPING, calculateShippingCost, isFreeShipping, formatPrice } from '@/lib/constants/business'
import AnimatedOrderButton from '@/components/ui/animated-order-button'



import { HydrationBoundary } from "@/components/HydrationBoundary"

interface CheckoutFormData {
  type: 'COMPRA' | 'COTIZACION'
  shippingAddress: string
  shippingCity: string
  shippingMethod: 'RETIRO_TIENDA' | 'DESPACHO_GRATIS'
  customerNotes: string
  // Campos específicos para cotizaciones
  desiredDeliveryDate: string
  quotationDescription: string
  clientType: 'EMPRESA' | 'NATURAL'
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { items, summary, clearCart, loading: cartLoading } = useCart()
  const { token: csrfToken, isLoading: csrfLoading, error: csrfError } = useCSRF()

  const [formData, setFormData] = useState<CheckoutFormData>({
    type: 'COMPRA',
    shippingAddress: '',
    shippingCity: 'Gran Concepción',
    shippingMethod: 'RETIRO_TIENDA',
    customerNotes: '',
    // Campos específicos para cotizaciones
    desiredDeliveryDate: '',
    quotationDescription: '',
    clientType: 'NATURAL' // Se actualizará automáticamente basándose en la sesión
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Función para validar un campo específico y actualizar errores
  const validateField = (fieldName: string, value: string) => {
    const newErrors = { ...errors }

    // Limpiar error del campo si ya no es válido
    if (newErrors[fieldName]) {
      delete newErrors[fieldName]
    }

    // Validaciones específicas por campo
    if (fieldName === 'quotationDescription' && formData.type === 'COTIZACION') {
      if (!value.trim()) {
        newErrors[fieldName] = 'La descripción de la cotización es obligatoria'
      }
    }

    if (fieldName === 'desiredDeliveryDate' && formData.type === 'COTIZACION') {
      if (!value) {
        newErrors[fieldName] = 'La fecha de entrega deseada es obligatoria'
      }
    }

    if (fieldName === 'shippingAddress') {
      if (!value.trim()) {
        newErrors[fieldName] = 'La dirección es obligatoria'
      } else if (value.trim().length < 10) {
        newErrors[fieldName] = 'La dirección debe tener al menos 10 caracteres'
      }
    }

    if (fieldName === 'shippingCity' && formData.type === 'COMPRA' && formData.shippingMethod === 'DESPACHO_GRATIS') {
      if (!value.trim()) {
        newErrors[fieldName] = 'La ciudad es obligatoria para despacho'
      }
    }

    setErrors(newErrors)
  }
  const [clientTypeInitialized, setClientTypeInitialized] = useState(false)

  // Estado para rastrear si ya intentamos cargar el carrito
  const [hasCheckedCart, setHasCheckedCart] = useState(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Limpiar timeout anterior si existe
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current)
      redirectTimeoutRef.current = null
    }

    // Si hay items (incluyendo temporales), no redirigir nunca
    if (items.length > 0) {
      setHasCheckedCart(true)
      // Cancelar cualquier timeout pendiente
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
      return
    }

    // No hacer nada mientras el carrito está cargando
    if (cartLoading) {
      setHasCheckedCart(false)
      return
    }

    // Solo redirigir si el carrito está vacío Y ya terminó de cargar Y no hemos verificado aún
    // NO redirigir automáticamente - solo si el usuario realmente no tiene items después de esperar
    if (!hasCheckedCart && items.length === 0 && !cartLoading) {
      console.log('⏳ Carrito vacío detectado, esperando 5 segundos antes de redirigir...')
      redirectTimeoutRef.current = setTimeout(() => {
        // Verificar nuevamente antes de redirigir
        // Solo redirigir si realmente está vacío después de esperar
        if (items.length === 0 && !cartLoading) {
          console.log('⚠️ Carrito sigue vacío después de esperar, redirigiendo al catálogo')
          router.push('/catalogo')
        } else {
          console.log('✅ Carrito tiene items después de esperar:', items.length)
        }
        setHasCheckedCart(true)
      }, 5000) // Aumentar a 5 segundos para dar más tiempo a que el carrito se cargue
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
        redirectTimeoutRef.current = null
      }
    }
  }, [items, router, cartLoading, hasCheckedCart])

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
    } else if (!session.user.validated) {
      router.push('/dashboard')
    }
  }, [session, router])

  // Detectar automáticamente el tipo de cliente basándose en la sesión del usuario
  useEffect(() => {
    if (session?.user?.type && !clientTypeInitialized) {
      // Usar directamente los tipos de la base de datos
      const userClientType = session.user.type as 'EMPRESA' | 'NATURAL'

      // Inicializando tipo de cliente basado en la sesión
      setFormData(prev => ({
        ...prev,
        clientType: userClientType
      }))
      setClientTypeInitialized(true)
    }
  }, [session?.user?.type, clientTypeInitialized])

  const calculateShippingCostLocal = () => {
    // Para cotizaciones no hay costo de envío
    if (formData.type === 'COTIZACION') return 0

    if (formData.shippingMethod === 'RETIRO_TIENDA') return 0
    if (formData.shippingMethod === 'DESPACHO_GRATIS') {
      return calculateShippingCost('DESPACHO_GRATIS', summary.total)
    }
    return 0
  }

  const shippingCost = calculateShippingCostLocal()
  const finalTotal = summary.total + shippingCost

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validaciones comunes
    if (!formData.shippingAddress.trim()) {
      newErrors.shippingAddress = 'La dirección es obligatoria'
    }

    // Validaciones específicas para COMPRA
    if (formData.type === 'COMPRA') {
      if (formData.shippingMethod === 'DESPACHO_GRATIS' && !formData.shippingCity.trim()) {
        newErrors.shippingCity = 'La ciudad es obligatoria para despacho'
      }
    }

    // Validaciones específicas para COTIZACION
    if (formData.type === 'COTIZACION') {
      if (!formData.quotationDescription.trim()) {
        newErrors.quotationDescription = 'La descripción de la cotización es obligatoria'
      }
      if (!formData.desiredDeliveryDate) {
        newErrors.desiredDeliveryDate = 'La fecha de entrega deseada es obligatoria'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Función para validar si el botón debe estar habilitado
  const isButtonEnabled = () => {
    // Validación básica común
    if (!formData.shippingAddress.trim()) {
      return false
    }

    // Validaciones específicas para cotizaciones
    if (formData.type === 'COTIZACION') {
      return formData.quotationDescription.trim().length > 0 &&
        formData.desiredDeliveryDate.length > 0
    }

    // Para compras, validación adicional de ciudad si es despacho
    if (formData.type === 'COMPRA' && formData.shippingMethod === 'DESPACHO_GRATIS' && !formData.shippingCity.trim()) {
      return false
    }

    return true
  }

  const handleSubmitOrder = async () => {
    if (!validateForm()) return

    // Verificar que el usuario esté autenticado antes de intentar crear el pedido
    if (!session || !session.user) {
      setErrors({ submit: 'Debes estar autenticado para crear un pedido. Redirigiendo al login...' })
      setTimeout(() => {
        router.push('/auth/login?redirect=' + encodeURIComponent('/checkout'))
      }, 2000)
      return
    }

    if (!csrfToken) {
      setErrors({ submit: 'Error de seguridad. Recarga la página e intenta de nuevo.' })
      return
    }

    setIsSubmitting(true)

    try {
      // Preparar datos del pedido
      const orderData = {
        type: formData.type,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.finalPrice,
          discount: 0
        })),
        shippingAddress: formData.shippingAddress,
        shippingMethod: formData.shippingMethod,
        shippingCity: formData.shippingCity,
        customerNotes: formData.type === 'COTIZACION'
          ? formData.quotationDescription
          : formData.customerNotes,
        estimatedDate: formData.type === 'COTIZACION' && formData.desiredDeliveryDate
          ? (() => {
            // Evitar problemas de zona horaria agregando el tiempo local
            const dateString = formData.desiredDeliveryDate
            const date = new Date(dateString + 'T12:00:00') // Mediodía para evitar cambios de día
            return date
          })()
          : undefined
      }


      // Llamada optimizada con timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout

      console.log('🔍 Enviando pedido:', {
        hasSession: !!session,
        userId: session?.user?.id,
        hasCSRFToken: !!csrfToken,
        csrfTokenLength: csrfToken?.length,
        itemsCount: items.length
      })

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        credentials: 'include', // Importante: incluir cookies
        body: JSON.stringify(orderData),
        signal: controller.signal
      })

      console.log('🔍 Respuesta recibida:', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Error al crear el pedido'

        // Si es un error de autenticación (401), redirigir al login
        if (response.status === 401) {
          setErrors({ submit: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' })
          setIsSubmitting(false)
          // Redirigir al login después de un breve delay
          setTimeout(() => {
            router.push('/auth/login?redirect=' + encodeURIComponent('/checkout'))
          }, 2000)
          return
        }

        // Para otros errores, mostrar el mensaje de error
        setErrors({ submit: errorMessage })
        setIsSubmitting(false)
        return
      }

      const result = await response.json()

      // Pedido creado exitosamente

      // Limpiar carrito inmediatamente
      clearCart()

      // Redirección basada en el tipo de pedido
      if (formData.type === 'COTIZACION') {
        // Para cotizaciones, ir a la página de confirmación específica
        const quotationUrl = `/checkout/cotizacion-confirmada?id=${result.order.id}`
        // Redirigiendo a confirmación de cotización
        router.replace(quotationUrl)
      } else {
        // Para compras, usar el flujo existente
        const preferredFlow = localStorage.getItem('ecofor-preferred-flow') || 'confirmation'

        if (preferredFlow === 'catalog') {
          router.replace(`/catalogo?orderConfirmed=true&orderId=${result.order.id}&orderNumber=${result.order.orderNumber}`)
        } else {
          router.replace(`/checkout/confirmacion?orderId=${result.order.id}&orderNumber=${result.order.orderNumber}`)
        }
      }

    } catch (error) {
      // Solo loguear errores que no sean de autenticación (ya manejados arriba)
      if (error instanceof Error && !error.message.includes('Usuario no autenticado')) {
        console.error('Error al crear pedido:', error)
      }

      // Manejo de errores más específico
      let errorMessage = 'Error al procesar el pedido'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'La solicitud tardó demasiado. Intenta de nuevo.'
        } else {
          errorMessage = error.message
        }
      }

      setErrors({ submit: errorMessage })
      setIsSubmitting(false)
    }
  }

  // Mostrar loading mientras se carga el carrito o se verifica
  if (!session || !session.user.validated || (cartLoading && !hasCheckedCart)) {
    return (
      <HydrationBoundary>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600"></div>
        </div>
      </HydrationBoundary>
    )
  }

  // Solo mostrar el mensaje de carrito vacío si realmente está vacío después de verificar
  if (!cartLoading && hasCheckedCart && items.length === 0) {
    return (
      <HydrationBoundary>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Tu carrito está vacío</p>
            <Link href="/catalogo">
              <Button>Volver al Catálogo</Button>
            </Link>
          </div>
        </div>
      </HydrationBoundary>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">

      {/* Header Premium */}
      <header className="backdrop-blur-optimized bg-white/80 shadow-optimized border-b border-emerald-100 gpu-accelerated opacity-0 animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Link href="/catalogo">
                <Button variant="ghost" size="sm" className="flex items-center text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Catálogo
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900">Finalizar Pedido</h1>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform rotate-1"></div>
              <div className="relative bg-white rounded-xl p-3 shadow-xl">
                <Image
                  src="/images/logo-ecofor.png"
                  alt="ECOFOR Market"
                  width={120}
                  height={55}
                  priority
                  className="object-contain"
                  sizes="120px"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">

          {/* Page Description */}
          <div className="text-center mb-8 opacity-0 animate-fade-in-up animation-delay-100">
            <p className="text-lg text-gray-600">Completa la información de tu pedido</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">

            {/* Formulario de Checkout */}
            <div className="lg:col-span-2 space-y-6">

              {/* Tipo de Pedido */}
              <Card className="shadow-lg border-t-4 border-emerald-500 opacity-0 animate-fade-in-up animation-delay-200 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-white">
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    <span>Tipo de Pedido</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'COMPRA' })}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${formData.type === 'COMPRA'
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                        }`}
                    >
                      <div className="text-center">
                        <CreditCard className={`h-6 w-6 mx-auto mb-2 ${formData.type === 'COMPRA' ? 'text-emerald-600' : 'text-gray-400'
                          }`} />
                        <h3 className="font-semibold text-gray-900">Compra</h3>
                        <p className="text-sm text-gray-600">Pedido de compra</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'COTIZACION' })}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${formData.type === 'COTIZACION'
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                        }`}
                    >
                      <div className="text-center">
                        <Package className={`h-6 w-6 mx-auto mb-2 ${formData.type === 'COTIZACION' ? 'text-emerald-600' : 'text-gray-400'
                          }`} />
                        <h3 className="font-semibold text-gray-900">Cotización</h3>
                        <p className="text-sm text-gray-600">Solicitar presupuesto</p>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Método de Envío - Solo para COMPRA */}
              {formData.type === 'COMPRA' && (
                <Card className="shadow-lg border-t-4 border-blue-500 opacity-0 animate-fade-in-up animation-delay-300 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-white">
                    <CardTitle className="flex items-center space-x-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <span>Método de Envío</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 pb-8 space-y-4">
                    {/* Retiro en Tienda */}
                    <label className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${formData.shippingMethod === 'RETIRO_TIENDA'
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow'
                      }`}>
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="RETIRO_TIENDA"
                        checked={formData.shippingMethod === 'RETIRO_TIENDA'}
                        onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value as 'RETIRO_TIENDA' | 'DESPACHO_GRATIS' })}
                        className="text-emerald-600 w-5 h-5"
                      />
                      <Store className={`h-5 w-5 ${formData.shippingMethod === 'RETIRO_TIENDA' ? 'text-emerald-600' : 'text-gray-400'
                        }`} />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Retiro en Tienda</div>
                        <div className="text-sm text-gray-600">Retira tu pedido en nuestra sucursal</div>
                        <div className="text-xs text-gray-500 mt-1">Av. Colón 3815, Talcahuano</div>
                      </div>
                      <div className="font-bold text-emerald-600">Gratis</div>
                    </label>

                    {/* Despacho */}
                    <label className={`flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${formData.shippingMethod === 'DESPACHO_GRATIS'
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow'
                      }`}>
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="DESPACHO_GRATIS"
                        checked={formData.shippingMethod === 'DESPACHO_GRATIS'}
                        onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value as 'RETIRO_TIENDA' | 'DESPACHO_GRATIS' })}
                        className="text-emerald-600 w-5 h-5"
                      />
                      <Truck className={`h-5 w-5 ${formData.shippingMethod === 'DESPACHO_GRATIS' ? 'text-emerald-600' : 'text-gray-400'
                        }`} />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Despacho</div>
                        <div className="text-sm text-gray-600">Envío a domicilio en Gran Concepción</div>
                        <div className="text-xs text-gray-500 mt-1">Entrega en 2-3 días hábiles</div>
                      </div>
                      <div className="text-right">
                        {isFreeShipping(summary.total) ? (
                          <div className="font-bold text-emerald-600">Gratis</div>
                        ) : (
                          <>
                            <div className="font-bold text-gray-900">$5.000</div>
                            <div className="text-xs text-gray-500 mt-1">Gratis sobre $35.000</div>
                          </>
                        )}
                      </div>
                    </label>
                  </CardContent>
                </Card>
              )}

              {/* Información de Cotización - Solo para COTIZACION */}
              {formData.type === 'COTIZACION' && (
                <>
                  {/* Información de la Cotización */}
                  <Card className="shadow-lg border-t-4 border-purple-500 opacity-0 animate-fade-in-up animation-delay-400 hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-white">
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <span>Información de la Cotización</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 pb-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tipo de Cliente
                          </label>
                          <div className="flex items-center space-x-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                            {formData.clientType === 'EMPRESA' ? (
                              <>
                                <Building className="h-6 w-6 text-emerald-600" />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Empresa</div>
                                  <div className="text-sm text-emerald-600 font-medium">Precios mayoristas</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <User className="h-6 w-6 text-blue-600" />
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">Persona Natural</div>
                                  <div className="text-sm text-blue-600 font-medium">Precios al público</div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Fecha Deseada de Entrega (obligatorio)
                          </label>
                          <input
                            type="date"
                            value={formData.desiredDeliveryDate}
                            onChange={(e) => {
                              setFormData({ ...formData, desiredDeliveryDate: e.target.value })
                              validateField('desiredDeliveryDate', e.target.value)
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.desiredDeliveryDate ? 'border-red-500' : 'border-gray-300'
                              }`}
                          />
                          {errors.desiredDeliveryDate && (
                            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {errors.desiredDeliveryDate}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Descripción de la Cotización (obligatorio)
                        </label>
                        <textarea
                          placeholder="Describe brevemente tu necesidad de productos o servicios..."
                          value={formData.quotationDescription}
                          onChange={(e) => {
                            setFormData({ ...formData, quotationDescription: e.target.value })
                            validateField('quotationDescription', e.target.value)
                          }}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.quotationDescription ? 'border-red-500' : 'border-gray-300'
                            }`}
                          rows={3}
                        />
                        {errors.quotationDescription && (
                          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.quotationDescription}
                          </p>
                        )}
                      </div>

                    </CardContent>
                  </Card>

                  {/* Información de Contacto para Cotización */}
                  <Card className="shadow-lg border-t-4 border-green-500 opacity-0 animate-fade-in-up animation-delay-500 hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-white">
                      <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        <span>Información de Contacto</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 pb-8 space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Dirección de Facturación (obligatorio)
                        </label>
                        <input
                          type="text"
                          placeholder="Calle, número, comuna, ciudad"
                          value={formData.shippingAddress}
                          onChange={(e) => {
                            setFormData({ ...formData, shippingAddress: e.target.value })
                            validateField('shippingAddress', e.target.value)
                          }}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.shippingAddress ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.shippingAddress && (
                          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.shippingAddress}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Dirección de Envío - Solo para COMPRA */}
              {formData.type === 'COMPRA' && (
                <Card className="shadow-lg border-t-4 border-purple-500 opacity-0 animate-fade-in-up animation-delay-400 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-white">
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <span>
                        {formData.shippingMethod === 'RETIRO_TIENDA'
                          ? 'Datos de Contacto'
                          : 'Dirección de Despacho'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8 pb-8 space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {formData.shippingMethod === 'RETIRO_TIENDA'
                          ? 'Dirección de Facturación'
                          : 'Dirección Completa'} (obligatorio)
                      </label>
                      <input
                        type="text"
                        placeholder="Calle, número, comuna, ciudad"
                        value={formData.shippingAddress}
                        onChange={(e) => {
                          setFormData({ ...formData, shippingAddress: e.target.value })
                          validateField('shippingAddress', e.target.value)
                        }}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.shippingAddress ? 'border-red-500' : 'border-gray-300'
                          }`}
                      />
                      {errors.shippingAddress && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.shippingAddress}
                        </p>
                      )}
                    </div>

                    {formData.shippingMethod === 'DESPACHO_GRATIS' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ciudad (obligatorio)
                        </label>
                        <select
                          value={formData.shippingCity}
                          onChange={(e) => {
                            setFormData({ ...formData, shippingCity: e.target.value })
                            validateField('shippingCity', e.target.value)
                          }}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${errors.shippingCity ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                          <option value="Gran Concepción">Gran Concepción</option>
                          <option value="Chillán">Chillán</option>
                          <option value="Los Ángeles">Los Ángeles</option>
                          <option value="Temuco">Temuco</option>
                        </select>
                        {errors.shippingCity && (
                          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.shippingCity}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notas Adicionales */}
              <Card className="shadow-lg opacity-0 animate-fade-in-up animation-delay-500 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="pt-6 pb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notas Adicionales (Opcional)
                  </label>
                  <textarea
                    placeholder="Instrucciones especiales, referencias de ubicación, horario preferido, etc."
                    value={formData.customerNotes}
                    onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Resumen del Pedido */}
            <div className="space-y-6 opacity-0 animate-fade-in-left animation-delay-400">
              <Card className="shadow-xl border-t-4 border-emerald-500">
                <CardHeader className="bg-white pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Package className="h-5 w-5 text-emerald-600" />
                    <span>
                      {formData.type === 'COMPRA' ? 'Resumen del Pedido' : 'Resumen de la Cotización'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-6 space-y-6">

                  {/* Items del Carrito */}
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.product.mainImage ? (
                            <Image
                              src={item.product.mainImage}
                              alt={item.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1 leading-tight">{item.name}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-600">
                              {item.quantity} × ${item.finalPrice.toLocaleString()}
                            </p>
                            <p className="font-bold text-gray-900">
                              ${(item.quantity * item.finalPrice).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cálculos */}
                  <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {formData.type === 'COMPRA' ? 'Subtotal' : 'Valor Estimado'}
                      </span>
                      <span className="text-base font-semibold text-gray-900">${summary.total.toLocaleString()}</span>
                    </div>

                    {/* Solo mostrar envío para COMPRA */}
                    {formData.type === 'COMPRA' && (
                      <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                        <span className="text-sm text-gray-600">Envío</span>
                        <span className={`text-base font-semibold ${shippingCost === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString()}`}
                        </span>
                      </div>
                    )}

                    {/* Información adicional para cotizaciones */}
                    {formData.type === 'COTIZACION' && (
                      <div className="pt-3 border-t border-gray-300">
                        <div className="text-xs text-gray-500 text-center">
                          <p>Los precios finales se confirmarán en la cotización</p>
                          <p className="mt-1">Validez: 30 días</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border-2 border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-black text-emerald-600">${finalTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Botón */}
                  <div className="pt-2">
                    {errors.submit && (
                      <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm font-medium">{errors.submit}</p>
                      </div>
                    )}

                    <div className="flex justify-center">
                      <AnimatedOrderButton
                        onComplete={handleSubmitOrder}
                        disabled={!isButtonEnabled()}
                        loading={isSubmitting}
                        buttonText={formData.type === 'COMPRA' ? 'Confirmar Pedido' : 'Solicitar Cotización'}
                      />
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
                      Al continuar, aceptas nuestros términos y condiciones
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}