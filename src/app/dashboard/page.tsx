"use client"
import { useAuth } from "@/hooks"
import { BackgroundDecorations, DashboardHeader, WelcomeSection, DashboardCardsSection } from "@/components/dashboard"
import { ProtectedRoute } from "@/components/auth"
import { Shield, Users } from "lucide-react"
import { suppressHydrationWarnings } from "@/lib/suppress-hydration-warnings"
import { HydrationBoundary } from "@/components/HydrationBoundary"
import {
  NATURAL_USER_CARDS,
  EMPRESA_USER_CARDS,
  ADMIN_CARDS,
  VENDEDOR_CARDS,
} from "@/lib/config/dashboardCards"
// ============================================
// DASHBOARD PAGE - REFACTORIZADO
// Página principal del dashboard usando componentes modulares
// ============================================


function DashboardContent() {
  console.log('DashboardContent: Component started')
  
  // Activar supresión de warnings de hidratación
  suppressHydrationWarnings()
  
  const {
    session,
    isLoading,
    isAdmin,
    isVendedor,
    isEmpresa,
    isValidated,
    userName,
    userEmail,
    userRole,
    userType,
  } = useAuth()

  console.log('Dashboard - Session status:', { 
    hasSession: !!session, 
    isLoading, 
    userName,
    userRole,
    validated: session?.validated
  })

  // No mostrar loading screen, continuar con el contenido

  // Si no hay sesión, mostrar mensaje de error en lugar de redirigir
  if (!session) {
    console.log('Dashboard: No session found')
    return (
      <HydrationBoundary>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No hay sesión activa</h1>
            <p className="text-gray-600 mb-4">Por favor, inicia sesión nuevamente</p>
            <button 
              onClick={() => window.location.href = '/auth/login'}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              Ir al Login
            </button>
          </div>
        </div>
      </HydrationBoundary>
    )
  }

  // Determinar qué tarjetas mostrar según el rol
  const getUserCards = () => {
    if (isAdmin) return null // Admin tiene su propio panel
    if (isVendedor) return null // Vendedor tiene su propio panel
    if (isEmpresa) return EMPRESA_USER_CARDS
    return NATURAL_USER_CARDS
  }

  const userCards = getUserCards()

  return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
      <BackgroundDecorations />

      <div className="relative z-10">
        {/* Header */}
        <DashboardHeader
          userName={userName || ''}
          userEmail={userEmail || ''}
          userRole={userRole || ''}
          userType={userType || ''}
          isEmpresa={isEmpresa}
          isValidated={isValidated}
          isAdmin={isAdmin}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Welcome Section */}
            <div className="mb-8">
              <WelcomeSection
                userName={userName || ''}
                isEmpresa={isEmpresa}
                isValidated={isValidated}
              />
            </div>

            {/* Cards Section - Usuario Regular */}
            {!isAdmin && !isVendedor && userCards && (
              <DashboardCardsSection
                title="Acciones Rápidas"
                badgeText={isEmpresa ? "Portal Empresarial" : "Portal Personal"}
                badgeColor="text-emerald-700 border-emerald-300 bg-white/70"
                cards={userCards}
                isValidated={isValidated}
                gridCols={3}
                loadDynamicStats={true}  
              />
            )}

            {/* Cards Section - Vendedor */}
            {isVendedor && (
              <DashboardCardsSection
                title="Panel de Vendedor"
                badgeText="Vendedor"
                badgeIcon={Users}
                badgeColor="bg-blue-100 text-blue-800 px-4 py-2 border border-blue-300"
                cards={VENDEDOR_CARDS}
                isValidated={true}
                gridCols={3}
              />
            )}

            {/* Cards Section - Admin */}
            {isAdmin && (
              <DashboardCardsSection
                title="Panel de Administración"
                badgeText="Administrador"
                badgeIcon={Shield}
                badgeColor="bg-red-100 text-red-800 px-4 py-2 border border-red-300"
                cards={ADMIN_CARDS}
                isValidated={true}
                gridCols={4}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    </HydrationBoundary>
  )
}

export default function DashboardPage() {
  // Temporalmente sin ProtectedRoute para debuggear
  return <DashboardContent />
}