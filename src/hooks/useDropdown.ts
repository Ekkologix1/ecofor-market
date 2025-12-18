"use client"
// ============================================
// CUSTOM HOOK: useDropdown
// Maneja el estado y comportamiento del dropdown de usuario
// ============================================


import { useState, useEffect, useCallback } from 'react'

interface UseDropdownReturn {
  isOpen: boolean
  toggle: () => void
  close: () => void
  open: () => void
}

export function useDropdown(dropdownId: string): UseDropdownReturn {
  const [isOpen, setIsOpen] = useState(false)

  // Función para cerrar el dropdown
  const close = useCallback(() => setIsOpen(false), [])
  
  // Función para abrir el dropdown
  const open = useCallback(() => setIsOpen(true), [])
  
  // Función para toggle del dropdown
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById(dropdownId)
      if (dropdown && !dropdown.contains(event.target as Node)) {
        close()
      }
    }

    // Usar mousedown para mejor detección
    document.addEventListener('mousedown', handleClickOutside)
    // También agregar click como backup
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, dropdownId, close])

  // Cerrar dropdown con la tecla ESC
  useEffect(() => {
    if (!isOpen) return

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [isOpen, close])

  // Cerrar dropdown al hacer scroll
  useEffect(() => {
    if (!isOpen) return

    const handleScroll = () => {
      close()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen, close])

  return {
    isOpen,
    toggle,
    close,
    open,
  }
}