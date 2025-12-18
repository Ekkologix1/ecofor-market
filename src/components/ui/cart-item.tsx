"use client"
import { memo, useCallback, useEffect, useState } from "react"
import { Plus, Minus, Trash2, Loader2 } from "lucide-react"
import { Button } from "./button"
import { Badge } from "./badge"
import { ProductImage } from "./product-image"
import { useItemActions } from "@/hooks/useItemActions"
import { useOptimizedQuantity } from "@/hooks/useOptimizedQuantity"
import { useImmediateFeedback } from "@/hooks/useImmediateFeedback"










interface CartItemProps {
  item: {
    id: string
    productId: string
    name: string
    sku: string
    basePrice: number
    finalPrice: number
    quantity: number
    stock: number
    unit: string
    brand?: string
    category: {
      name: string
      slug: string
    }
    discount?: {
      percentage: number
      amount: number
      reason: string
    }
    product: {
      id: string
      name: string
      sku: string
      mainImage?: string | null
      unit: string
      brand?: string
      stock: number
      active: boolean
      category: {
        name: string
        slug: string
      }
    }
  }
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  onRemoveItem: (itemId: string) => Promise<boolean>
  formatPrice: (price: number) => string
  onSyncQuantity?: (itemId: string, quantity: number) => void
}

const CartItem = memo(function CartItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
  formatPrice,
  onSyncQuantity
}: CartItemProps) {
  
  // Hook personalizado para manejar acciones del item
  const { isUpdatingQuantity, isRemoving, updateQuantity, removeItem } = useItemActions({
    onUpdateQuantity,
    onRemoveItem,
    itemId: item.id
  })
  
  // Hook para feedback inmediato
  const { showLoading } = useImmediateFeedback({ isUpdatingQuantity, isRemoving })
  
  const [localQuantity, setLocalQuantity] = useState(item.quantity)

  // Sincronizar con la cantidad del servidor
  useEffect(() => {
    setLocalQuantity(item.quantity)
  }, [item.quantity])

  // Hook optimizado para manejo de cantidades con debouncing
  const { handleIncrease, handleDecrease, handleRemove } = useOptimizedQuantity({
    onUpdateQuantity: async (quantity: number) => {
      await updateQuantity(quantity)
    },
    onRemoveItem: async () => {
      await removeItem()
    },
    currentQuantity: localQuantity,
    stock: item.stock,
    onImmediateUpdate: (quantity: number) => {
      // Esto activará el estado de loading inmediatamente
      setLocalQuantity(quantity)
    }
  })

  // Funciones de callback optimizadas
  const handleIncreaseQuantity = useCallback(() => {
    handleIncrease()
  }, [handleIncrease])

  const handleDecreaseQuantity = useCallback(() => {
    handleDecrease()
  }, [handleDecrease])

  const handleRemoveItem = useCallback(() => {
    handleRemove()
  }, [handleRemove])

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      
      {/* Header del producto con imagen */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start space-x-3 flex-1 pr-2">
          {/* Imagen del producto */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <ProductImage
              productId={item.product.id}
              mainImage={item.product.mainImage}
              alt={item.name}
              sizes="64px"
            />
          </div>
          
          <div className="flex-1 min-w-0 cart-item-content">
            <h4 className="font-bold text-gray-900 line-clamp-2 mb-2 leading-tight text-base">
              {item.name}
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded">
                {item.sku}
              </span>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          onClick={handleRemoveItem}
          disabled={isRemoving}
          className="text-red-500 hover:bg-red-50 p-1 rounded h-6 w-6 flex-shrink-0"
        >
          {isRemoving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Precio y controles */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {item.discount && item.discount.percentage > 0 ? (
            <>
              <span className="text-lg font-bold text-emerald-600">
                {formatPrice(item.finalPrice)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(item.basePrice)}
              </span>
              <Badge className="bg-red-100 text-red-700 text-xs font-bold">
                -{item.discount.percentage}%
              </Badge>
            </>
          ) : (
            <span className="text-lg font-bold text-emerald-600">
              {formatPrice(item.finalPrice)}
            </span>
          )}
        </div>

        {/* Controles de cantidad */}
        <div className="flex items-center space-x-2 bg-white rounded border border-gray-200">
        <Button
          variant="ghost"
          onClick={handleDecreaseQuantity}
          disabled={showLoading}
          className="quantity-control h-6 w-6 p-0 hover:bg-gray-100"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className={`quantity-number text-sm font-bold px-2 min-w-[1.5rem] text-center ${
          showLoading ? 'text-blue-500 quantity-updating' : 'text-gray-900'
        } ${showLoading ? 'quantity-indicator' : ''}`}>
          {localQuantity}
        </span>
        <Button
          variant="ghost"
          onClick={handleIncreaseQuantity}
          disabled={localQuantity >= item.stock || showLoading}
          className="quantity-control h-6 w-6 p-0 hover:bg-gray-100"
        >
          <Plus className="h-3 w-3" />
        </Button>
        </div>
      </div>


      {/* Información adicional */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs">
        <div className="text-gray-600">
          <span>Stock: </span>
          <span className={`font-semibold ${
            item.stock <= 5 ? 'text-orange-600' : 'text-gray-700'
          }`}>
            {item.stock} {item.unit}
          </span>
          {item.stock <= 5 && (
            <span className="text-orange-600 ml-1">
              (Pocas)
            </span>
          )}
        </div>
        {item.discount && item.discount.percentage > 0 && (
          <div className="text-emerald-600 font-semibold">
            Ahorro: {formatPrice(item.discount.amount)}
          </div>
        )}
      </div>

      {/* Razón del descuento */}
      {item.discount && item.discount.percentage > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="bg-emerald-50 rounded p-2 border border-emerald-200">
            <p className="text-xs text-emerald-700 font-medium">
              {item.discount.reason}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Solo re-renderizar si los campos relevantes han cambiado
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.finalPrice === nextProps.item.finalPrice &&
    prevProps.item.product.mainImage === nextProps.item.product.mainImage
  )
})

export { CartItem }
