"use client"
import { cn } from "@/lib"
import { CheckCircle, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"






interface CartToastProps {
  isVisible: boolean
  productName: string
  onClose: () => void
}

export function CartToast({ isVisible, productName, onClose }: CartToastProps) {
  const [shouldRender, setShouldRender] = useState(false)
  const pathname = usePathname()

  // No mostrar el toast en páginas de checkout
  const isCheckoutPage = pathname?.startsWith('/checkout')

  useEffect(() => {
    if (isVisible && !isCheckoutPage) {
      setShouldRender(true)
      const timer = setTimeout(() => {
        onClose()
      }, 1200) // Reducido a 1.2 segundos para mejor fluidez
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 200) // Reducido de 300ms a 200ms para salida más rápida
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose, isCheckoutPage])

  // Ocultar toast inmediatamente cuando se navega a checkout
  useEffect(() => {
    if (isCheckoutPage && isVisible) {
      onClose()
    }
  }, [isCheckoutPage, isVisible, onClose])

  // No renderizar si estamos en checkout o no debe mostrarse
  if (!shouldRender || isCheckoutPage) return null

  return (
    <div className={cn(
      "fixed top-20 right-6 z-50 transition-all duration-200 ease-out transform-gpu",
      isVisible 
        ? "opacity-100 translate-x-0 scale-100" 
        : "opacity-0 translate-x-full scale-95"
    )}>
      <div className="bg-white border border-emerald-200 rounded-xl shadow-2xl p-4 max-w-sm backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 animate-fade-in">
              ¡Agregado al carrito!
            </p>
            <p className="text-xs text-gray-500 truncate animate-slide-up">
              {productName}
            </p>
          </div>
          <div className="flex-shrink-0">
            <ShoppingCart className="w-4 h-4 text-emerald-600 animate-bounce" />
          </div>
        </div>
        
        {/* Barra de progreso optimizada */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div className={cn(
            "bg-gradient-to-r from-emerald-500 to-emerald-600 h-1 rounded-full transition-all ease-out",
            isVisible ? "w-0 animate-[progress-smooth_1.2s_ease-out_forwards]" : "w-full"
          )} />
        </div>
      </div>
    </div>
  )
}
