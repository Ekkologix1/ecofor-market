"use client"

import { ReactNode } from 'react'
import { useHydrationFix } from '@/hooks/useHydrationFix'

interface HydrationSafeProps {
  children: ReactNode
  className?: string
}

/**
 * Componente wrapper que suprime warnings de hidratación causados por extensiones del navegador
 * como Bitwarden que agregan atributos como bis_skin_checked
 */
export function HydrationSafe({ children, className }: HydrationSafeProps) {
  useHydrationFix()
  
  return (
    <div className={className} suppressHydrationWarning={true}>
      {children}
    </div>
  )
}
