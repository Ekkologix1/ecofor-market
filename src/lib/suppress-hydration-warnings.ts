/**
 * Utilidad para suprimir warnings de hidratación causados por extensiones del navegador
 * Se ejecuta globalmente en todas las páginas
 */

let isSuppressionActive = false

export function suppressHydrationWarnings() {
  if (typeof window === 'undefined' || isSuppressionActive) return
  
  isSuppressionActive = true
  
  // Interceptar console.error para filtrar warnings de hidratación
  const originalError = console.error
  
  console.error = (...args: any[]) => {
    const message = args[0]
    
    // Filtrar warnings específicos de hidratación
    if (
      typeof message === 'string' &&
      (message.includes('hydrated but some attributes') ||
       message.includes('bis_skin_checked') ||
       message.includes('hydration mismatch') ||
       message.includes('A tree hydrated but some attributes') ||
       message.includes('https://react.dev/link/hydration-mismatch'))
    ) {
      // No mostrar estos warnings
      return
    }
    
    // Filtrar errores de API esperados (401 - no autenticado)
    if (
      typeof message === 'string' &&
      (message.includes('Dashboard stats API error') ||
       message.includes('Usuario no autorizado') ||
       message.includes('no autorizado'))
    ) {
      // No mostrar errores de autenticación esperados
      return
    }
    
    // Filtrar objetos vacíos o errores sin mensaje útil
    if (args.length === 1 && typeof args[0] === 'object' && Object.keys(args[0]).length === 0) {
      return
    }
    
    // Mostrar otros errores normalmente
    originalError.apply(console, args)
  }
  
  // También interceptar console.warn por si acaso
  const originalWarn = console.warn
  
  console.warn = (...args: any[]) => {
    const message = args[0]
    
    if (
      typeof message === 'string' &&
      (message.includes('hydrated but some attributes') ||
       message.includes('bis_skin_checked') ||
       message.includes('hydration mismatch') ||
       message.includes('https://react.dev/link/hydration-mismatch'))
    ) {
      return
    }
    
    originalWarn.apply(console, args)
  }
  
  console.log('🔧 Supresión de warnings de hidratación activada globalmente')
}

// Auto-ejecutar inmediatamente en el cliente
if (typeof window !== 'undefined') {
  suppressHydrationWarnings()
}