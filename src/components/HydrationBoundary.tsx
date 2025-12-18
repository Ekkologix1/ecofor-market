"use client"
import { ReactNode, useEffect, useState } from 'react'
import { useHydrationFix } from '@/hooks/useHydrationFix'
import { suppressHydrationWarnings } from '@/lib/suppress-hydration-warnings'




interface HydrationBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  suppressHydrationWarning?: boolean
}

/**
 * Componente que maneja problemas de hidratación y proporciona un límite
 * para evitar que los errores se propaguen a componentes padre
 */
export function HydrationBoundary({ 
  children, 
  fallback = null, 
  suppressHydrationWarning = false 
}: HydrationBoundaryProps) {
  useHydrationFix()
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Activar supresión de warnings de hidratación
    suppressHydrationWarnings()
    // Reset error state when component mounts
    setHasError(false)
  }, [])

  // Si hay un error de hidratación, mostrar fallback
  if (hasError) {
    return <>{fallback}</>
  }

  return (
    <div 
      suppressHydrationWarning={suppressHydrationWarning}
      onError={() => setHasError(true)}
    >
      {children}
    </div>
  )
}

/**
 * Componente que solo renderiza su contenido en el cliente
 * Útil para evitar problemas de hidratación con contenido dinámico
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode, fallback?: ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Componente que maneja contenido que puede cambiar entre servidor y cliente
 * Útil para timestamps, IDs únicos, etc.
 */
export function DynamicContent({ 
  children, 
  fallback = null,
  suppressHydrationWarning = true 
}: { 
  children: ReactNode, 
  fallback?: ReactNode,
  suppressHydrationWarning?: boolean 
}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <span suppressHydrationWarning={suppressHydrationWarning}>
      {isClient ? children : fallback}
    </span>
  )
}
