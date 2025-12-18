import { useState, useEffect } from 'react'

interface UseImmediateFeedbackProps {
  isUpdatingQuantity: boolean
  isRemoving: boolean
}

export function useImmediateFeedback({ isUpdatingQuantity, isRemoving }: UseImmediateFeedbackProps) {
  const [showImmediateLoading, setShowImmediateLoading] = useState(false)

  // Activar loading inmediatamente cuando se detecta cambio de cantidad
  useEffect(() => {
    if (isUpdatingQuantity) {
      setShowImmediateLoading(true)
    }
  }, [isUpdatingQuantity])

  // Desactivar loading cuando termina la operación
  useEffect(() => {
    if (!isUpdatingQuantity && !isRemoving) {
      // Pequeño delay para que se vea el feedback
      const timer = setTimeout(() => {
        setShowImmediateLoading(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isUpdatingQuantity, isRemoving])

  return {
    showLoading: showImmediateLoading || isUpdatingQuantity || isRemoving
  }
}
