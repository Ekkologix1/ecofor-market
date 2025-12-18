"use client"
import { Button } from "@/components/ui"
import { cn } from "@/lib"
import { useEffect, useRef, useCallback, memo } from "react"
import { X, AlertTriangle, Trash2, ShoppingCart, Shield, Zap } from "lucide-react"






interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  icon?: React.ReactNode
  isLoading?: boolean
}

const ConfirmationModal = memo(function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'danger',
  icon,
  isLoading = false
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  
  // Memoizar la función de escape para evitar recreaciones
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose()
    }
  }, [isOpen, onClose])

  // Memoizar la función de confirmar
  const handleConfirm = useCallback(() => {
    onConfirm()
  }, [onConfirm])

  // Memoizar la función de cerrar
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])
  
  // Cerrar con Escape y manejo de focus - optimizado
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      
      // Focus inmediato sin timeout para mejor performance
      requestAnimationFrame(() => {
        confirmButtonRef.current?.focus()
      })
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  // Estilos simplificados para mejor performance
  const variantStyles = {
    danger: {
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      buttonBg: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    },
    warning: {
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      buttonBg: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
    },
    info: {
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      buttonBg: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop simplificado */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        onClick={handleClose}
      />
      
      {/* Modal simplificado */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md transform transition-all duration-200 ease-out"
      >
        {/* Contenedor principal simplificado */}
        <div className="relative rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
          
          {/* Header simplificado */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Icono simplificado */}
                <div className={cn("p-2 rounded-lg", styles.iconBg)}>
                  {icon || (
                    variant === 'danger' ? (
                      <Trash2 className={cn("h-5 w-5", styles.iconColor)} />
                    ) : variant === 'warning' ? (
                      <AlertTriangle className={cn("h-5 w-5", styles.iconColor)} />
                    ) : (
                      <ShoppingCart className={cn("h-5 w-5", styles.iconColor)} />
                    )
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Confirmación requerida
                  </p>
                </div>
              </div>
              
              {/* Botón cerrar simplificado */}
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="px-6 py-4">
            <div className="mb-6">
              <p className="text-gray-700 text-base leading-relaxed">
                {message}
              </p>
              
              {/* Indicador de seguridad */}
              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Esta acción es irreversible</span>
              </div>
            </div>

            {/* Botones de acción simplificados */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 h-10 px-4 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                {cancelText}
              </Button>
              
              <Button
                ref={confirmButtonRef}
                onClick={handleConfirm}
                disabled={isLoading}
                className={cn(
                  "flex-1 h-10 px-4 rounded-lg text-white font-medium transition-colors",
                  styles.buttonBg
                )}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    {confirmText}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export { ConfirmationModal }
