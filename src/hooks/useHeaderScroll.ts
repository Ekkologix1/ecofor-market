import { useState, useEffect, useRef } from 'react'

/**
 * Hook para controlar la visibilidad del header al hacer scroll
 * Oculta el header al scrollear hacia abajo y lo muestra al scrollear hacia arriba
 * 
 * @param threshold - Píxeles mínimos de scroll antes de ocultar el header (default: 100)
 * @returns { headerVisible: boolean } - Estado de visibilidad del header
 */
export function useHeaderScroll(threshold: number = 100) {
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Detectar dirección del scroll
      if (currentScrollY > lastScrollY.current && currentScrollY > threshold) {
        // Scrolleando hacia abajo y ya pasamos el threshold
        setHeaderVisible(false)
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolleando hacia arriba
        setHeaderVisible(true)
      }
      
      // Si estamos en la parte superior, siempre mostrar el header
      if (currentScrollY < 10) {
        setHeaderVisible(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return { headerVisible }
}



