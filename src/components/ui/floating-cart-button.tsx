"use client"
import { cn } from "@/lib"
import { ShoppingCart, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useCatalog } from "@/contexts/CatalogContext"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"








interface FloatingCartButtonProps {
  className?: string
}

export function FloatingCartButton({ className }: FloatingCartButtonProps) {
  const { getTotalItems, openCart, canUseCart, loading } = useCart()
  const { isLoading: catalogLoading } = useCatalog()
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [previousTotal, setPreviousTotal] = useState(0)
  const totalItems = getTotalItems()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Mostrar el botón solo si:
  // 1. El usuario puede usar el carrito
  // 2. Está en la página del catálogo
  // 3. El catálogo NO está cargando
  useEffect(() => {
    const isCatalogPage = pathname === '/catalogo' || pathname.startsWith('/catalogo/')
    setIsVisible(canUseCart && isCatalogPage && !catalogLoading)
  }, [canUseCart, pathname, catalogLoading])

  // Animación cuando se agregan productos
  useEffect(() => {
    if (totalItems > previousTotal && previousTotal >= 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 800)
      return () => clearTimeout(timer)
    }
    setPreviousTotal(totalItems)
  }, [totalItems, previousTotal])

  // Manejar tooltip
  const handleMouseEnter = () => {
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  if (!isVisible) return null

  const handleClick = () => {
    // Efecto de ripple al hacer clic
    if (buttonRef.current) {
      const ripple = document.createElement('div')
      ripple.className = 'absolute inset-0 rounded-full bg-white/30 animate-ping'
      buttonRef.current.appendChild(ripple)
      
      setTimeout(() => {
        ripple.remove()
      }, 600)
    }
    openCart()
  }

  return (
    <div className={cn(
      "fixed z-50",
      "bottom-4 right-4 sm:bottom-6 sm:right-6",
      className
    )}>
      {/* Botón principal del carrito */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={loading}
        className={cn(
          "group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg transition-all duration-300 ease-out overflow-hidden",
          "hover:shadow-2xl hover:scale-105 hover:from-emerald-500 hover:to-emerald-700",
          "active:scale-95 active:shadow-lg",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          "focus:outline-none focus:ring-4 focus:ring-emerald-300/50",
          isAnimating && "animate-pulse scale-110"
        )}
        aria-label="Abrir carrito de compras"
      >
        {/* Efecto de brillo animado en hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-pulse" />
        
        {/* Ondas de expansión cuando se agregan productos */}
        {isAnimating && (
          <>
            <div className="absolute inset-0 rounded-full bg-emerald-300/40 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-emerald-200/30 animate-ping animation-delay-150" />
          </>
        )}
        
        {/* Icono del carrito */}
        <div className="relative z-10">
          {loading ? (
            <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 text-white animate-spin" />
          ) : (
            <ShoppingCart className={cn(
              "h-6 w-6 sm:h-7 sm:w-7 text-white transition-all duration-200",
              "group-hover:scale-110 group-hover:rotate-3",
              isAnimating && "animate-bounce"
            )} />
          )}
        </div>


        {/* Efecto de partículas cuando hay productos */}
        {totalItems > 0 && !isAnimating && (
          <div className="absolute inset-0 rounded-full bg-emerald-300/20 animate-pulse" />
        )}
      </button>

      {/* Badge de cantidad - Fuera del botón */}
      {totalItems > 0 && !loading && (
        <div className={cn(
          "absolute -top-2 -right-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-xs sm:text-sm font-bold shadow-lg transition-all duration-300 border-2 border-white z-10",
          "group-hover:scale-110 group-hover:from-red-600 group-hover:to-red-700",
          isAnimating && "animate-bounce scale-125"
        )}>
          <span className="leading-none">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        </div>
      )}

      {/* Tooltip mejorado */}
      <div className={cn(
        "absolute bottom-16 sm:bottom-20 right-0 transition-all duration-300 pointer-events-none",
        showTooltip ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}>
        <div className="bg-gray-900/95 backdrop-blur-sm text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-xl shadow-2xl whitespace-nowrap border border-gray-700">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4 text-emerald-400" />
            <span>
              {totalItems > 0 
                ? `${totalItems} producto${totalItems !== 1 ? 's' : ''} en el carrito`
                : 'Ver carrito de compras'
              }
            </span>
          </div>
          <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95" />
        </div>
      </div>

      {/* Efecto de notificación cuando se agrega un producto */}
      {isAnimating && (
        <div className="absolute -top-6 sm:-top-8 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
          ¡Agregado!
        </div>
      )}
    </div>
  )
}
