/**
 * Configuración específica para desarrollo que optimiza el rendimiento
 * Desactiva funciones innecesarias para acelerar el inicio del servidor
 */

export const devConfig = {
  // Desactivar logging excesivo en desarrollo
  disableVerboseLogging: true,
  
  // Desactivar funciones de desarrollo que pueden ralentizar el inicio
  disableRedisInDevelopment: true,
  disableRateLimitingInDevelopment: true,
  
  // Configuraciones de performance
  skipNonEssentialInitializations: true,
  
  // Timeouts optimizados para desarrollo
  timeouts: {
    redis: 2000, // Reducir timeout de Redis
    database: 5000, // Timeout de base de datos
    rateLimit: 1000, // Timeout de rate limiting
  }
}

// Función para verificar si una funcionalidad debe estar deshabilitada en desarrollo
export function shouldDisableInDevelopment(feature: keyof typeof devConfig): boolean {
  return process.env.NODE_ENV === 'development' && devConfig[feature] === true
}

// Función para obtener timeout optimizado
export function getOptimizedTimeout(type: keyof typeof devConfig.timeouts): number {
  return devConfig.timeouts[type]
}
