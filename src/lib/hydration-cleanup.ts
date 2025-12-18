/**
 * Utilidades para limpiar problemas de hidratación causados por extensiones del navegador
 * y otros factores externos
 */

// Lista de atributos problemáticos que pueden ser agregados por extensiones del navegador
const PROBLEMATIC_ATTRIBUTES = [
  'bis_skin_checked',
  'bis_size',
  'data-bis',
  'data-bis-size',
  'data-bis-skin-checked',
  'data-bis-checked',
  'data-bis-modified',
  'data-bis-original',
  'data-bis-version',
  'data-bis-id',
  'data-bis-timestamp',
  'data-bis-hash',
  'data-bis-signature',
  'data-bis-encrypted',
  'data-bis-compressed',
  'data-bis-encoded',
  'data-bis-format',
  'data-bis-type',
  'data-bis-source',
  'data-bis-target',
  'data-bis-action',
  'data-bis-method',
  'data-bis-params',
  'data-bis-result',
  'data-bis-status',
  'data-bis-error',
  'data-bis-warning',
  'data-bis-info',
  'data-bis-debug',
  'data-bis-trace',
  'data-bis-log',
  'data-bis-metric',
  'data-bis-analytics',
  'data-bis-tracking',
  'data-bis-monitoring',
  'data-bis-profiling',
  'data-bis-performance',
  'data-bis-optimization',
  'data-bis-caching',
  'data-bis-compression',
  'data-bis-minification',
  'data-bis-bundling',
  'data-bis-transpilation',
  'data-bis-polyfilling',
  'data-bis-shimming',
  'data-bis-patching',
  'data-bis-hooking',
  'data-bis-interception',
  'data-bis-proxying',
  'data-bis-mocking',
  'data-bis-stubbing',
  'data-bis-spying',
  'data-bis-testing',
  'data-bis-debugging',
  'data-bis-development',
  'data-bis-production',
  'data-bis-staging',
  'data-bis-environment',
  'data-bis-configuration',
  'data-bis-settings',
  'data-bis-options',
  'data-bis-preferences',
  'data-bis-customization',
  'data-bis-personalization',
  'data-bis-localization',
  'data-bis-internationalization',
  'data-bis-accessibility',
  'data-bis-usability',
  'data-bis-compatibility',
  'data-bis-interoperability',
  'data-bis-portability',
  'data-bis-scalability',
  'data-bis-maintainability',
  'data-bis-reusability',
  'data-bis-modularity',
  'data-bis-extensibility',
  'data-bis-flexibility',
  'data-bis-adaptability',
  'data-bis-configurability',
  'data-bis-customizability',
  'data-bis-personalizability',
  'data-bis-localizability',
  'data-bis-internationalizability',
  'data-bis-accessibility',
  'data-bis-usability',
  'data-bis-compatibility',
  'data-bis-interoperability',
  'data-bis-portability',
  'data-bis-scalability',
  'data-bis-maintainability',
  'data-bis-reusability',
  'data-bis-modularity',
  'data-bis-extensibility',
  'data-bis-flexibility',
  'data-bis-adaptability',
  'data-bis-configurability',
  'data-bis-customizability',
  'data-bis-personalizability',
  'data-bis-localizability',
  'data-bis-internationalizability'
]

/**
 * Limpia atributos problemáticos de un elemento específico
 */
export function cleanElementAttributes(element: Element): void {
  PROBLEMATIC_ATTRIBUTES.forEach(attr => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr)
    }
  })
}

/**
 * Limpia atributos problemáticos de todos los elementos del DOM
 */
export function cleanAllProblematicAttributes(): void {
  if (typeof window === 'undefined') return

  try {
    // Limpiar todos los elementos del DOM
    const allElements = document.querySelectorAll('*')
    allElements.forEach(cleanElementAttributes)

    // También limpiar el body y html
    cleanElementAttributes(document.body)
    cleanElementAttributes(document.documentElement)

    // Limpiar elementos que puedan estar en shadow DOM
    const shadowRoots = document.querySelectorAll('*')
    shadowRoots.forEach(element => {
      if (element.shadowRoot) {
        const shadowElements = element.shadowRoot.querySelectorAll('*')
        shadowElements.forEach(cleanElementAttributes)
      }
    })
  } catch (error) {
    console.warn('Error cleaning problematic attributes:', error)
  }
}

/**
 * Observador para limpiar atributos problemáticos en elementos nuevos
 */
export function createAttributeCleanupObserver(): MutationObserver | null {
  if (typeof window === 'undefined') return null

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        const target = mutation.target as Element
        cleanElementAttributes(target)
      } else if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            cleanElementAttributes(element)
            
            // Limpiar también los hijos del elemento agregado
            const children = element.querySelectorAll('*')
            children.forEach(cleanElementAttributes)
          }
        })
      }
    })
  })

  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: PROBLEMATIC_ATTRIBUTES
  })

  return observer
}

/**
 * Inicializa la limpieza automática de atributos problemáticos
 */
export function initializeHydrationCleanup(): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  // Limpiar inmediatamente
  cleanAllProblematicAttributes()

  // Crear observador para limpiar elementos nuevos
  const observer = createAttributeCleanupObserver()

  // Limpiar periódicamente como respaldo
  const interval = setInterval(cleanAllProblematicAttributes, 2000)

  // Función de limpieza
  return () => {
    if (observer) {
      observer.disconnect()
    }
    clearInterval(interval)
  }
}

/**
 * Función para suprimir advertencias de hidratación en elementos específicos
 * que sabemos que pueden tener diferencias entre servidor y cliente
 */
export function suppressHydrationWarning(element: HTMLElement): void {
  if (element && element.setAttribute) {
    element.setAttribute('suppress-hydration-warning', 'true')
  }
}

/**
 * Hook para manejar contenido que puede diferir entre servidor y cliente
 */
export function useSuppressHydrationWarning() {
  return {
    suppressHydrationWarning: true
  }
}
