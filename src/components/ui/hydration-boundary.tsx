"use client"
import { ReactNode } from 'react'



interface HydrationBoundaryProps {
  children: ReactNode
  suppressHydrationWarning?: boolean
}

/**
 * Componente que actúa como boundary para problemas de hidratación
 * causados por extensiones del navegador
 */
export function HydrationBoundary({ 
  children, 
  suppressHydrationWarning = true 
}: HydrationBoundaryProps) {
  return (
    <div suppressHydrationWarning={suppressHydrationWarning}>
      {children}
    </div>
  )
}