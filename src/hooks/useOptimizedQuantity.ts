import { useCallback, useRef } from 'react'

interface UseOptimizedQuantityProps {
  onUpdateQuantity: (quantity: number) => Promise<void>
  onRemoveItem: () => Promise<void>
  currentQuantity: number
  stock: number
  onImmediateUpdate?: (quantity: number) => void
}

export function useOptimizedQuantity({
  onUpdateQuantity,
  onRemoveItem,
  currentQuantity,
  stock,
  onImmediateUpdate
}: UseOptimizedQuantityProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedUpdateQuantity = useCallback((newQuantity: number) => {
    // Cancelar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Establecer nuevo timeout con debounce más corto
    timeoutRef.current = setTimeout(async () => {
      try {
        await onUpdateQuantity(newQuantity)
      } catch (error) {
        console.error('Error updating quantity:', error)
      }
    }, 150) // Reducido a 150ms para mejor respuesta
  }, [onUpdateQuantity])

  const handleIncrease = useCallback(() => {
    if (currentQuantity < stock) {
      const newQuantity = currentQuantity + 1
      // Notificar cambio inmediato para activar loading
      if (onImmediateUpdate) {
        onImmediateUpdate(newQuantity)
      }
      // Actualizar inmediatamente y luego hacer debounce de la API
      debouncedUpdateQuantity(newQuantity)
      return newQuantity
    }
    return currentQuantity
  }, [currentQuantity, stock, debouncedUpdateQuantity, onImmediateUpdate])

  const handleDecrease = useCallback(() => {
    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1
      // Notificar cambio inmediato para activar loading
      if (onImmediateUpdate) {
        onImmediateUpdate(newQuantity)
      }
      // Actualizar inmediatamente y luego hacer debounce de la API
      debouncedUpdateQuantity(newQuantity)
      return newQuantity
    } else {
      // Si la cantidad es 1, eliminar item inmediatamente
      onRemoveItem()
      return 0
    }
  }, [currentQuantity, onRemoveItem, debouncedUpdateQuantity, onImmediateUpdate])

  const handleRemove = useCallback(() => {
    // Cancelar cualquier actualización pendiente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    onRemoveItem()
  }, [onRemoveItem])

  return {
    handleIncrease,
    handleDecrease,
    handleRemove
  }
}