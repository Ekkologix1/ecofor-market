"use client"

import { useEffect } from 'react'

/**
 * Hook para suprimir warnings de hidratación causados por extensiones del navegador
 * como Bitwarden que agregan atributos como bis_skin_checked
 */
export function useHydrationFix() {
  useEffect(() => {
    // Suprimir warnings específicos de hidratación en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error
      
      console.error = (...args) => {
        // Filtrar warnings de hidratación causados por extensiones del navegador
        const message = args[0]
        if (
          typeof message === 'string' &&
          (message.includes('hydrated but some attributes') ||
           message.includes('bis_skin_checked') ||
           message.includes('hydration mismatch'))
        ) {
          // No mostrar estos warnings específicos
          return
        }
        
        // Mostrar otros errores normalmente
        originalConsoleError.apply(console, args)
      }
      
      // Cleanup: restaurar console.error original
      return () => {
        console.error = originalConsoleError
      }
    }
  }, [])
}