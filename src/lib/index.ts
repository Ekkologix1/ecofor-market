// ============================================
// LIB EXPORTS
// Exporta todas las utilidades y configuraciones
// ============================================

// Core utilities
export * from './utils'
export * from './db'
export * from './auth'
export * from './validations'
export * from './errorHandler'
export * from './logger-client'
export * from './structured-logger'
// Note: Server-side logger is imported conditionally in auth.ts to avoid client-side issues
export * from './pagination'
export * from './rateLimiter'
export * from './csrf'
export * from './cache-client'

// Constants
export * from './constants/business'
export * from './constants/dashboard'

// Re-export types with explicit names to resolve conflicts
export type { UserRole as BusinessUserRole, UserType as BusinessUserType } from './constants/business'
export type { UserRole as DashboardUserRole, UserType as DashboardUserType } from './constants/dashboard'

// Export the most commonly used types as default
export type { UserRole, UserType } from './constants/dashboard'

// Configuration
export * from './config/dashboardCards'

// Middleware
export * from './middleware/auth'
export * from './middleware/authWithRateLimit'

// Stores
export * from './progressStore'
