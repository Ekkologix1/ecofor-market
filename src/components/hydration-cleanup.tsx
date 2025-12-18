"use client"
import { useEffect } from 'react'
import { initializeHydrationCleanup } from '@/lib/hydration-cleanup'




export function HydrationCleanup() {
  useEffect(() => {
    // Esperar un poco para que las extensiones carguen
    const timer = setTimeout(() => {
      console.log('🔧 Iniciando limpieza de atributos problemáticos...')
      
      // Inicializar limpieza automática de atributos problemáticos
      const cleanup = initializeHydrationCleanup()
      
      return cleanup
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return null
}
