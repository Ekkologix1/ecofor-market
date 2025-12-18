"use client"
import { X, Trash2, Truck, AlertCircle, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"
import { Progress } from "./progress"
import { ConfirmationModal } from "./confirmation-modal"
import { CartItem } from "./cart-item"
import { ToastContainer, useToast } from "./toast"
import { useCart } from "@/contexts/CartContext"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"













export function CartSidebar() {
  const router = useRouter()
  const {
    items,
    summary,
    isOpen, 
    loading,
    itemOperationsLoading,
    error,
    closeCart, 
    updateQuantity, 
    removeItem, 
    clearCart
  } = useCart()

  const [showClearModal, setShowClearModal] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const savedScrollY = useRef<number>(0)
  
  // Hook para toasts
  const { toasts, removeToast, clearAllToasts, showSuccess, showError, showInfo } = useToast()

  // Limpiar notificaciones residuales cuando se abre el carrito
  useEffect(() => {
    if (isOpen && toasts.length > 0) {
      // Limpiar toasts antiguos al abrir el carrito
      const timer = setTimeout(() => {
        clearAllToasts()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, toasts.length, clearAllToasts])

  // Resetear estado de navegación cuando el carrito se cierre o se vacíe
  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setIsNavigating(false)
    }
  }, [isOpen, items.length])

  // Función para cerrar el carrito - simplificada
  const handleCloseCart = useCallback(() => {
    // Evitar múltiples llamadas simultáneas
    if (!isOpen) return
    
    // Limpiar todos los toasts al cerrar el carrito
    clearAllToasts()
    
    closeCart()
  }, [isOpen, closeCart, clearAllToasts])

  // Función para ir al checkout - optimizada para evitar parpadeo
  const handleCheckout = useCallback(() => {
    if (isNavigating || items.length === 0) return // Evitar múltiples navegaciones y carrito vacío
    
    setIsNavigating(true)
    handleCloseCart()
    
    // Usar timeout en lugar de múltiples requestAnimationFrame para mejor control
    setTimeout(() => {
      try {
        router.push("/checkout")
      } catch (error) {
        console.error('Error navigating to checkout:', error)
        setIsNavigating(false)
      }
    }, 300) // Esperar que termine la animación de cierre del carrito
  }, [isNavigating, items.length, handleCloseCart, router])

  // Deshabilitar restauración automática del scroll del navegador
  useEffect(() => {
    // Deshabilitar la restauración automática del scroll
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    
    return () => {
      // Rehabilitar la restauración automática del scroll al desmontar
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto'
      }
    }
  }, [])

  // Bloquear scroll del body cuando el carrito está abierto - solución simplificada
  useEffect(() => {
    if (isOpen) {
      // Guardar la posición actual de scroll
      savedScrollY.current = window.scrollY
      
      // Fijar el body y ocultar el scroll
      document.body.style.position = 'fixed'
      document.body.style.top = `-${savedScrollY.current}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      // Restaurar los estilos del body
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      
      // Restaurar scroll inmediatamente sin delay
      if (savedScrollY.current > 0) {
        const scrollPosition = savedScrollY.current
        savedScrollY.current = 0
        
        // Restaurar scroll inmediatamente
        window.scrollTo(0, scrollPosition)
      }
    }

    return () => {
      // Cleanup - restaurar estilos si el carrito estaba abierto
      if (isOpen) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  const handleClearCart = async () => {
    setShowClearModal(true)
  }

  const confirmClearCart = async () => {
    setIsClearing(true)
    
    // Limpiar todos los toasts existentes
    clearAllToasts()
    
    try {
      const success = await clearCart()
      if (success) {
        // No mostrar notificación de "Carrito vaciado" para evitar conflictos
        // El usuario ya ve que el carrito está vacío
        setShowClearModal(false)
      }
    } catch (error) {
      showError('Error', 'No se pudo vaciar el carrito')
      console.error('Error clearing cart:', error)
    } finally {
      setIsClearing(false)
    }
  }

  if (!isOpen) return null

  const shippingProgress = summary.freeShipping 
    ? 100 
    : (summary.total / 35000) * 100

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay - optimizado para GPU y evitar parpadeo */}
      <div 
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ willChange: 'opacity' }}
        onClick={(e) => {
          // Solo cerrar si el click es directamente en el overlay, no en elementos hijos
          if (e.target === e.currentTarget) {
            handleCloseCart()
          }
        }}
      />
      
      {/* Panel lateral - optimizado para GPU acceleration */}
      <div 
        className={`cart-sidebar absolute right-0 top-0 h-screen w-96 max-w-[90vw] bg-white shadow-2xl border-l border-gray-100 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="flex h-full flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-white">
            <div className="flex items-center space-x-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Mi Carrito</h2>
                <p className="text-xs text-gray-500">{summary.totalItems} productos</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleCloseCart}
              className="hover:bg-gray-100 rounded-lg p-1 h-7 w-7"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Sección de envío */}
          {summary.totalItems > 0 && (
            <div className="px-6 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
              <div className="flex items-center space-x-2 mb-2">
                <Truck className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-800">
                  {summary.freeShipping ? 'Envío Gratuito Incluido' : 'Envío Gratuito'}
                </span>
              </div>
              
              <Progress value={shippingProgress} className="h-1.5 mb-2" />
              
              <p className="text-xs text-emerald-700">
                {summary.freeShipping 
                  ? 'Tu pedido califica para envío gratuito en Gran Concepción'
                  : `Agrega ${formatPrice(summary.remainingForFreeShipping)} más para envío gratuito`
                }
              </p>
            </div>
          )}

          {/* Contenido del carrito */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  {loading ? (
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {loading ? 'Cargando carrito...' : 'Tu carrito está vacío'}
                </h3>
                <p className="text-gray-500 text-center mb-4 text-sm leading-relaxed">
                  {loading 
                    ? 'Obteniendo tus productos...'
                    : 'Explora nuestro catálogo y descubre productos de calidad para tu empresa'
                  }
                </p>
                {!loading && (
                  <Button 
                    onClick={handleCloseCart} 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                  >
                    Explorar Productos
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer con resumen */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 bg-white px-6 py-4 space-y-3">
              
              {/* Resumen de precios */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(summary.subtotal)}</span>
                </div>
                {summary.totalDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-emerald-600">Descuentos:</span>
                    <span className="text-emerald-600 font-semibold">-{formatPrice(summary.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío:</span>
                  <span className={`font-semibold ${summary.freeShipping ? 'text-emerald-600' : 'text-gray-600'}`}>
                    {summary.freeShipping ? 'Gratuito' : 'Por calcular'}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-black text-emerald-600">
                    {formatPrice(summary.total)}
                  </span>
                </div>
                {summary.totalDiscount > 0 && (
                  <p className="text-xs text-emerald-700 mt-1">
                    Has ahorrado {formatPrice(summary.totalDiscount)}
                  </p>
                )}
              </div>

              {/* Información de entrega */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Entrega estimada: <span className="font-semibold">{summary.estimatedDelivery}</span>
                </p>
              </div>

              {/* Botones de acción */}
              <div className="space-y-2">
                <Button 
                  onClick={handleCheckout}
                  disabled={loading || itemOperationsLoading || isNavigating}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  {(loading || itemOperationsLoading || isNavigating) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isNavigating ? 'Redirigiendo...' : 'Procesando...'}
                    </>
                  ) : (
                    'Proceder al Checkout'
                  )}
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCloseCart}
                    className="flex-1 border-2 border-gray-300 hover:bg-gray-50 font-semibold py-2 rounded-lg text-sm"
                  >
                    Seguir Comprando
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleClearCart}
                    disabled={loading || isClearing}
                    className="px-3 text-red-600 hover:bg-red-50 border-2 border-red-200 hover:border-red-300 font-semibold py-2 rounded-lg disabled:opacity-50"
                  >
                    {isClearing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para vaciar carrito */}
      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClearCart}
        title="Vaciar Carrito"
        message="¿Estás seguro de que quieres eliminar todos los productos de tu carrito? Esta acción no se puede deshacer."
        confirmText="Sí, vaciar carrito"
        cancelText="Cancelar"
        variant="danger"
        icon={<Trash2 className="h-5 w-5 text-red-600" />}
        isLoading={isClearing}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}