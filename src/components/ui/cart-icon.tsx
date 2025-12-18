"use client"
import { ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"
import { useCart } from "@/contexts/CartContext"










export function CartIcon() {
  const { getTotalItems, openCart, canUseCart, loading } = useCart()
  const totalItems = getTotalItems()

  // Solo mostrar el carrito si el usuario puede usarlo
  if (!canUseCart) {
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={openCart}
        disabled={loading}
        className="relative hover:bg-green-50 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 text-green-700 animate-spin" />
        ) : (
          <ShoppingCart className="h-5 w-5 text-green-700" />
        )}
        {totalItems > 0 && !loading && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white text-xs"
          >
            {totalItems}
          </Badge>
        )}
      </Button>
    </div>
  )
}