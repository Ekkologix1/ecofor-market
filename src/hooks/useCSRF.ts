"use client"

import { useState, useEffect, useCallback } from "react"

interface CSRFTokenData {
  token: string
  expiresIn: number
}

interface UseCSRFReturn {
  token: string | null
  isLoading: boolean
  error: string | null
  refreshToken: () => Promise<void>
  isExpired: boolean
}

export function useCSRF(): UseCSRFReturn {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number>(0)

  const fetchToken = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include", // Incluir cookies de sesión
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: CSRFTokenData = await response.json()
      setToken(data.token)
      setExpiresAt(Date.now() + (data.expiresIn * 1000))
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      console.error("Error fetching CSRF token:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshToken = useCallback(async () => {
    await fetchToken()
  }, [fetchToken])

  // Cargar token inicial
  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  // Verificar expiración cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      if (expiresAt > 0 && Date.now() >= expiresAt - 60000) { // Renovar 1 minuto antes de expirar
        console.log('Token CSRF próximo a expirar, renovando...')
        fetchToken()
      }
    }, 60000) // Verificar cada minuto

    return () => clearInterval(interval)
  }, [expiresAt, fetchToken])

  const isExpired = expiresAt > 0 && Date.now() >= expiresAt

  return {
    token,
    isLoading,
    error,
    refreshToken,
    isExpired
  }
}

// Hook simplificado para obtener solo el token
export function useCSRFToken(): string | null {
  const { token } = useCSRF()
  return token
}

// Función helper para incluir token CSRF en requests
export function withCSRFToken(headers: HeadersInit = {}): HeadersInit {
  return {
    ...headers,
    "X-CSRF-Token": "placeholder" // Se debe reemplazar con el token real
  }
}
