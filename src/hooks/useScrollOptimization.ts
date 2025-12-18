"use client"
import { useEffect, useRef } from 'react'

export function useScrollOptimization() {
  const ticking = useRef(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
          // Optimizar elementos durante scroll rápido
          if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
            // Reducir complejidad de backdrop-blur durante scroll rápido
            document.documentElement.classList.add('fast-scroll')
          } else {
            document.documentElement.classList.remove('fast-scroll')
          }
          
          lastScrollY.current = currentScrollY
          ticking.current = false
        })
        ticking.current = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
}

// Hook para detectar scroll rápido
export function useFastScrollDetection() {
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      // Marcar como scroll activo
      document.documentElement.classList.add('scrolling')
      
      // Limpiar timeout anterior
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
      
      // Después de 150ms sin scroll, remover clase
      scrollTimeout.current = setTimeout(() => {
        document.documentElement.classList.remove('scrolling')
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])
}
