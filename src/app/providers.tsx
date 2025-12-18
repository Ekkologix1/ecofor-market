"use client"
import { SessionProvider } from "next-auth/react"
import { CartProvider, useCart } from "@/contexts/CartContext"
import { CatalogProvider } from "@/contexts/CatalogContext"
import dynamic from "next/dynamic"

// Lazy loading de componentes pesados
const FloatingCartButton = dynamic(() => import("@/components/ui/floating-cart-button").then(mod => ({ default: mod.FloatingCartButton })), {
  ssr: false,
  loading: () => null
})

const CartSidebar = dynamic(() => import("@/components/ui/cart-sidebar").then(mod => ({ default: mod.CartSidebar })), {
  ssr: false,
  loading: () => null
})

const CartToast = dynamic(() => import("@/components/ui/cart-toast").then(mod => ({ default: mod.CartToast })), {
  ssr: false,
  loading: () => null
})

const HydrationCleanup = dynamic(() => import("@/components/hydration-cleanup").then(mod => ({ default: mod.HydrationCleanup })), {
  ssr: false,
  loading: () => null
})




interface ProvidersProps {
  children: React.ReactNode
}

function CartComponents() {
  const { showToast, toastProduct, hideToast } = useCart()
  
  return (
    <>
      <HydrationCleanup />
      <FloatingCartButton />
      <CartSidebar />
      <CartToast 
        isVisible={showToast}
        productName={toastProduct}
        onClose={hideToast}
      />
    </>
  )
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refrescar sesión cada 5 minutos
      refetchOnWindowFocus={true} // Refrescar sesión cuando la ventana recupera el foco
    >
      <CartProvider>
        <CatalogProvider>
          {children}
          <CartComponents />
        </CatalogProvider>
      </CartProvider>
    </SessionProvider>
  )
}