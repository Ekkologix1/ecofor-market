'use client'

import React, { useState, useEffect } from 'react'

interface AnimatedOrderButtonProps {
  onComplete: () => void
  disabled?: boolean
  totalAmount?: string
  loading?: boolean
  buttonText?: string
}

export default function AnimatedOrderButton({ 
  onComplete, 
  disabled = false, 
  totalAmount,
  loading = false,
  buttonText = 'Confirmar Pedido'
}: AnimatedOrderButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleClick = () => {
    if (disabled || loading || isProcessing) return
    
    setIsProcessing(true)
    onComplete()
  }

  // Reset processing state when loading changes
  useEffect(() => {
    if (!loading) {
      setIsProcessing(false)
    }
  }, [loading])

  const displayText = loading ? 'Procesando...' : isProcessing ? 'Confirmando...' : buttonText

  return (
    <div className="relative">
      <button
        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-emerald-400 disabled:to-emerald-500 text-white font-bold py-5 px-12 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-200 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        onClick={handleClick}
        disabled={disabled || loading || isProcessing}
      >
        {displayText}
      </button>
      
      {totalAmount && !loading && (
        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
          <p className="text-center text-sm text-gray-700">
            Total a pagar: <span className="font-bold text-lg text-emerald-700">{totalAmount}</span>
          </p>
        </div>
      )}
    </div>
  )
}