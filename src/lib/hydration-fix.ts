/**
 * Utilidades para manejar problemas de hidratación
 */

const problematicAttributes = [
  'bis_skin_checked',
  'data-bis_skin_checked',
  'data-adblock',
  'data-adblocker',
  'data-adsbygoogle-status',
  'data-google-query-id',
  'data-bitwarden-watching',
  'data-1password-ignore',
  'data-lastpass-icon-root',
  'data-bis_size',
  'data-bitwarden',
  'data-1password',
  'data-lastpass',
  'data-grammarly',
  'data-grammarly-shadow-root',
  'data-loom',
  'data-loom-shadow-root'
]

/**
 * Limpia atributos problemáticos agregados por extensiones del navegador
 * Esta función se ejecuta en el cliente después de la hidratación
 */
export function cleanupBrowserExtensions() {
  if (typeof window === 'undefined') return

  let cleanupCount = 0
  const maxCleanups = 10

  const cleanup = () => {
    if (cleanupCount >= maxCleanups) return
    
    cleanupCount++
    const elements = document.querySelectorAll('*')
    let removedCount = 0
    
    elements.forEach(element => {
      problematicAttributes.forEach(attr => {
        if (element.hasAttribute(attr)) {
          element.removeAttribute(attr)
          removedCount++
        }
      })
    })
    
    // Si se removieron atributos, programar otra limpieza
    if (removedCount > 0 && cleanupCount < maxCleanups) {
      setTimeout(cleanup, 50)
    }
  }

  // Ejecutar limpieza inmediatamente
  cleanup()

  // Ejecutar limpieza después de delays para capturar atributos añadidos tardíamente
  setTimeout(cleanup, 100)
  setTimeout(cleanup, 500)
  setTimeout(cleanup, 1000)
  setTimeout(cleanup, 2000)

  // Observer para limpiar atributos que se añadan dinámicamente
  const observer = new MutationObserver((mutations) => {
    let shouldCleanup = false
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes') {
        const target = mutation.target as Element
        if (problematicAttributes.some(attr => target.hasAttribute(attr))) {
          shouldCleanup = true
        }
      }
    })
    
    if (shouldCleanup) {
      setTimeout(cleanup, 0)
    }
  })

  // Observar cambios en todo el documento
  observer.observe(document.documentElement, {
    attributes: true,
    subtree: true,
    attributeFilter: problematicAttributes
  })

  return () => observer.disconnect()
}

/**
 * Detecta si hay extensiones del navegador que puedan causar problemas de hidratación
 */
export function detectProblematicExtensions() {
  if (typeof window === 'undefined') return false

  // Verificar si hay elementos con atributos típicos de extensiones problemáticas
  const testElements = document.querySelectorAll('*')
  return Array.from(testElements).some(element => {
    const attrs = Array.from(element.attributes).map(attr => attr.name)
    return attrs.some(attr => 
      problematicAttributes.some(prob => attr.includes(prob))
    )
  })
}