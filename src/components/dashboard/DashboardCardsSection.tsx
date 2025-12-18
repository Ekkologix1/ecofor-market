"use client"
// ============================================
// COMPONENTE: DashboardCardsSection
// Sección que renderiza las tarjetas del dashboard según rol
// ============================================








import { Badge } from "@/components/ui"
import { useEffect, useState } from "react"
import { DashboardCard } from "./DashboardCard"
import type { DashboardCard as DashboardCardType } from "@/lib/config/dashboardCards"

interface DashboardCardsSectionProps {
  title: string
  badgeText?: string
  badgeIcon?: React.ComponentType<{ className?: string }>
  badgeColor?: string
  cards: DashboardCardType[]
  isValidated: boolean
  gridCols?: 'auto' | 2 | 3 | 4
  loadDynamicStats?: boolean
}

interface DashboardStats {
  activeOrders: number
  pendingQuotes: number
  totalOrders: number
}

export function DashboardCardsSection({
  title,
  badgeText,
  badgeIcon: BadgeIcon,
  badgeColor = "bg-red-100 text-red-800 border-red-300",
  cards,
  isValidated,
  gridCols = 'auto',
  loadDynamicStats = false,
}: DashboardCardsSectionProps) {
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [updatedCards, setUpdatedCards] = useState<DashboardCardType[]>(cards)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar estadísticas dinámicas con optimizaciones
  useEffect(() => {
    const fetchStats = async () => {
      if (!loadDynamicStats || !isValidated) {
        setIsLoading(false)
        return
      }

      try {
        // Verificar caché local primero
        const cachedStats = sessionStorage.getItem('dashboard-stats')
        const cacheTimestamp = sessionStorage.getItem('dashboard-stats-timestamp')
        const now = Date.now()
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

        if (cachedStats && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
          const data = JSON.parse(cachedStats)
          setStats(data)
          setIsLoading(false)
          return
        }

        // Fetch con timeout para evitar bloqueos
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout

        const response = await fetch('/api/dashboard/stats', {
          signal: controller.signal,
          credentials: 'include', // Importante: incluir cookies de sesión
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          setStats(data)
          
          // Guardar en caché
          sessionStorage.setItem('dashboard-stats', JSON.stringify(data))
          sessionStorage.setItem('dashboard-stats-timestamp', now.toString())
        } else {
          // No mostrar error si es 401 o 403 (usuario no autenticado/no autorizado) - es esperado
          // Solo loguear errores reales del servidor (500, etc.)
          if (response.status >= 500) {
            try {
              const errorData = await response.json()
              console.error('Dashboard stats API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData.error || 'Server error'
              })
            } catch {
              console.error('Dashboard stats API error:', {
                status: response.status,
                statusText: response.statusText
              })
            }
          }
          // Para 401/403, simplemente no hacer nada - es comportamiento esperado
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Dashboard stats request timed out')
        } else {
          // No mostrar error si es un error de autenticación
          const errorMessage = error instanceof Error ? error.message : String(error)
          if (!errorMessage.includes('Usuario no autorizado') && !errorMessage.includes('no autorizado')) {
            console.error('Error loading dashboard stats:', error)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [loadDynamicStats, isValidated])

  // Actualizar valores de las tarjetas cuando cambien las stats
  useEffect(() => {
    if (!loadDynamicStats) {
      setUpdatedCards(cards)
      setIsLoading(false)
      return
    }

    const newCards = cards.map(card => {
      // Mostrar indicador de carga para tarjetas dinámicas
      if (isLoading && loadDynamicStats) {
        // Actualizar "Pedidos activos" para usuarios NATURAL
        if (card.id === 'pedidos' && card.metadata?.label === 'Pedidos activos:') {
          return {
            ...card,
            metadata: {
              ...card.metadata,
              value: '...'
            }
          }
        }

        // Actualizar "Pedidos activos" para usuarios EMPRESA (tarjeta ordenes)
        if (card.id === 'ordenes' && card.metadata?.label === 'Pedidos activos:') {
          return {
            ...card,
            metadata: {
              ...card.metadata,
              value: '...'
            }
          }
        }

        // Actualizar "Cotizaciones pendientes" para EMPRESA
        if (card.id === 'cotizaciones' && card.metadata?.label === 'Cotizaciones pendientes:') {
          return {
            ...card,
            metadata: {
              ...card.metadata,
              value: '...'
            }
          }
        }
      }

      // Actualizar con datos reales cuando estén disponibles
      if (stats) {
        // Actualizar "Pedidos activos" para usuarios NATURAL
        if (card.id === 'pedidos' && card.metadata?.label === 'Pedidos activos:') {
          return {
            ...card,
            metadata: {
              ...card.metadata,
              value: stats.activeOrders
            }
          }
        }

        // Actualizar "Pedidos activos" para usuarios EMPRESA (tarjeta ordenes)
        if (card.id === 'ordenes' && card.metadata?.label === 'Pedidos activos:') {
          return {
            ...card,
            metadata: {
              ...card.metadata,
              value: stats.activeOrders
            }
          }
        }

        // Actualizar "Cotizaciones pendientes" para EMPRESA
        if (card.id === 'cotizaciones' && card.metadata?.label === 'Cotizaciones pendientes:') {
          return {
            ...card,
            metadata: {
              ...card.metadata,
              value: stats.pendingQuotes
            }
          }
        }
      }

      return card
    })

    setUpdatedCards(newCards)
  }, [stats, cards, isLoading, loadDynamicStats])
  
  const getGridClass = () => {
    switch (gridCols) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2'
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {badgeText && (
          <Badge className={`px-4 py-2 ${badgeColor}`}>
            {BadgeIcon && <BadgeIcon className="w-4 h-4 mr-2" />}
            {badgeText}
          </Badge>
        )}
      </div>
      
      <div className={`grid ${getGridClass()} gap-6`}>
        {updatedCards.map((card) => (
          <DashboardCard
            key={card.id}
            card={card}
            disabled={!isValidated && card.id !== 'stock'}
          />
        ))}
      </div>
    </div>
  )
}