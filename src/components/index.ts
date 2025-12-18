// ============================================
// COMPONENTS EXPORTS
// Exporta todos los componentes de la aplicación
// ============================================

// Error Handling Components
export { default as ErrorBoundary } from './ErrorBoundary'
export { default as PageErrorBoundary } from './PageErrorBoundary'
export { useErrorHandler } from './ErrorBoundary'

// Hydration Components
export * from './HydrationBoundary'
export { HydrationSafe } from './HydrationSafe'

// Auth Components
export * from './auth/login-form'
export * from './auth/register-empresa-form'
export * from './auth/register-natural-form'
export * from './auth/user-type-selector'
export * from './auth/ProtectedRoute'

// Header Components
export { default as Header3 } from './Header3'

// Dashboard Components
export * from './dashboard/BackgroundDecorations'
export * from './dashboard/DashboardCard'
export * from './dashboard/DashboardCardsSection'
export * from './dashboard/DashboardHeader'
export * from './dashboard/LoadingScreen'
export * from './dashboard/UserDropdown'
export * from './dashboard/WelcomeSection'

// PDF Components
export * from './pdf/OrderComprobante'

// UI Components
export * from './ui/alert'
export * from './ui/animated-order-button'
export * from './ui/badge'
export * from './ui/button'
export * from './ui/card'
export * from './ui/cart-icon'
export * from './ui/cart-sidebar'
export * from './ui/form'
export * from './ui/input'
export * from './ui/label'
export * from './ui/progress'
