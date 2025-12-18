import { useState, useCallback } from 'react'

interface UseItemActionsProps {
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  onRemoveItem: (itemId: string) => Promise<boolean>
  itemId: string
}

export function useItemActions({ onUpdateQuantity, onRemoveItem, itemId }: UseItemActionsProps) {
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const updateQuantity = useCallback(async (quantity: number) => {
    setIsUpdatingQuantity(true)
    try {
      await onUpdateQuantity(itemId, quantity)
    } finally {
      setIsUpdatingQuantity(false)
    }
  }, [onUpdateQuantity, itemId])

  const removeItem = useCallback(async () => {
    setIsRemoving(true)
    try {
      await onRemoveItem(itemId)
    } finally {
      setIsRemoving(false)
    }
  }, [onRemoveItem, itemId])

  return {
    isUpdatingQuantity,
    isRemoving,
    updateQuantity,
    removeItem
  }
}
