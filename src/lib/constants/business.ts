// ============================================
// CONSTANTES DE NEGOCIO - ECOFOR MARKET
// Centraliza todas las constantes del negocio
// ============================================

// ============ CONSTANTES DE ENVÍO ============

export const SHIPPING = {
  // Monto mínimo para envío gratis
  FREE_SHIPPING_MINIMUM: 35000,
  
  // Costos de envío
  COSTS: {
    STANDARD: 5000,      // Envío estándar (despacho gratis si no alcanza mínimo)
    COURIER: 8000,       // Courier externo (FedEx, etc.)
    PICKUP: 0,           // Retiro en tienda
    FREE: 0              // Envío gratis (cuando alcanza mínimo)
  },
  
  // Métodos de envío disponibles
  METHODS: {
    RETIRO_TIENDA: 'RETIRO_TIENDA',
    DESPACHO_GRATIS: 'DESPACHO_GRATIS',
    RUTA_PROGRAMADA: 'RUTA_PROGRAMADA',
    COURIER: 'COURIER',
    DESPACHO_ESPECIAL: 'DESPACHO_ESPECIAL'
  },
  
  // Zonas de envío y tiempos de entrega
  AREAS: {
    'Gran Concepción': '24-48 horas',
    'Chillán': 'Jueves',
    'Los Ángeles': 'Viernes',
    'Otras zonas': '3-5 días hábiles'
  },
  
  // Ciudades principales
  CITIES: {
    CONCEPCION: 'Concepción',
    CHILLAN: 'Chillán',
    LOS_ANGELES: 'Los Ángeles'
  },
  
  // Zonas de envío
  ZONES: {
    GRAN_CONCEPCION: 'Gran Concepción',
    BIO_BIO_REGION: 'Región del Bío-Bío'
  }
} as const

// ============ CONSTANTES DE PRODUCTOS ============

export const PRODUCT = {
  // Límites de cantidad
  QUANTITY_LIMITS: {
    MIN: 1,
    MAX: 999,
    MAX_PER_CART: 999
  },
  
  // Límites de descuento
  DISCOUNT_LIMITS: {
    MIN: 0,
    MAX: 100, // 100%
    DEFAULT: 0
  },
  
  // Stock
  STOCK: {
    DEFAULT: 0,
    MIN_ALERT: 5,
    MAX_PER_PRODUCT: 9999999
  },
  
  // Precios
  PRICE: {
    MIN: 1000, // Precio mínimo por producto
    MAX: 99999999 // Precio máximo
  },
  
  // Unidades disponibles
  UNITS: {
    UNIDAD: 'unidad',
    CAJA: 'caja',
    LITRO: 'litro',
    KILO: 'kilo',
    METRO: 'metro',
    PAR: 'par'
  },
  
  // Estados del producto
  STATUS: {
    ACTIVE: true,
    INACTIVE: false,
    FEATURED: true,
    PROMOTION: true
  }
} as const

// ============ CONSTANTES DE PEDIDOS ============

export const ORDER = {
  // Número de orden
  NUMBER: {
    PREFIX: 'ECO',
    YEAR_FORMAT: 'YYYY',
    SEQUENCE_PADDING: 3 // 001, 002, 003...
  },
  
  // Tipos de pedido
  TYPES: {
    COMPRA: 'COMPRA',
    COTIZACION: 'COTIZACION'
  },
  
  // Estados del pedido
  STATUS: {
    RECIBIDO: 'RECIBIDO',
    EN_PROCESO: 'EN_PROCESO',
    ENVIADO: 'ENVIADO',
    ENTREGADO: 'ENTREGADO',
    CANCELADO: 'CANCELADO'
  },
  
  // Límites
  LIMITS: {
    MAX_ITEMS: 50,
    MAX_NOTES_LENGTH: 1000,
    MAX_ADDRESS_LENGTH: 500
  }
} as const

// ============ CONSTANTES DE USUARIOS ============

export const USER = {
  // Tipos de usuario
  TYPES: {
    NATURAL: 'NATURAL',
    EMPRESA: 'EMPRESA'
  },
  
  // Roles de usuario
  ROLES: {
    USER: 'USER',
    ADMIN: 'ADMIN',
    VENDEDOR: 'VENDEDOR'
  },
  
  // Validación
  VALIDATION: {
    REQUIRED: true,
    NOT_REQUIRED: false
  }
} as const

// ============ CONSTANTES DE CARRITO ============

export const CART = {
  // Límites
  LIMITS: {
    MAX_ITEMS: 50,
    MAX_QUANTITY_PER_ITEM: 999,
    MAX_TOTAL_ITEMS: 1000
  },
  
  // Tiempos
  TIMEOUTS: {
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
    CLEANUP_INTERVAL: 5 * 60 * 1000  // 5 minutos
  }
} as const

// ============ CONSTANTES DE PAGINACIÓN ============

export const PAGINATION = {
  // Límites por defecto
  DEFAULTS: {
    PAGE: 1,
    LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  // Tamaños de página predefinidos
  LIMITS: {
    SMALL: 10,
    MEDIUM: 20,
    LARGE: 50,
    EXTRA_LARGE: 100
  }
} as const

// ============ CONSTANTES DE ARCHIVOS ============

export const FILE = {
  // Límites de tamaño
  SIZE_LIMITS: {
    MAX_UPLOAD: 100 * 1024 * 1024, // 100MB
    MAX_STOCK_FILE: 50 * 1024 * 1024, // 50MB
    MAX_IMAGE: 5 * 1024 * 1024 // 5MB
  },
  
  // Formatos permitidos
  ALLOWED_FORMATS: {
    IMAGES: ['.jpg', '.jpeg', '.png', '.webp', '.avif'],
    EXCEL: ['.xlsx', '.xls'],
    CSV: ['.csv']
  },
  
  // Límites de procesamiento
  PROCESSING: {
    MAX_UPLOADS: 100,
    BATCH_SIZE: 1000,
    TIMEOUT: 30 * 60 * 1000, // 30 minutos
    TRANSACTION_TIMEOUT: 45000 // 45 segundos
  }
} as const

// ============ CONSTANTES DE RATE LIMITING ============

export const RATE_LIMIT = {
  // Límites por endpoint
  LIMITS: {
    LOGIN: {
      ATTEMPTS: 5,
      WINDOW: '1 m' // 1 minuto
    },
    REGISTER: {
      ATTEMPTS: 3,
      WINDOW: '10 m' // 10 minutos
    },
    CHECKOUT: {
      ATTEMPTS: 10,
      WINDOW: '1 h' // 1 hora
    },
    API: {
      ATTEMPTS: 100,
      WINDOW: '15 m' // 15 minutos
    },
    UPLOAD: {
      ATTEMPTS: 5,
      WINDOW: '1 h' // 1 hora
    }
  }
} as const

// ============ CONSTANTES DE SEGURIDAD ============

export const SECURITY = {
  // CSRF
  CSRF: {
    TOKEN_EXPIRY: 30 * 60 * 1000, // 30 minutos
    CLEANUP_INTERVAL: 5 * 60 * 1000 // 5 minutos
  },
  
  // Sesiones
  SESSION: {
    TIMEOUT: 30 * 60 * 1000, // 30 minutos
    MAX_AGE: 7 * 24 * 60 * 60 * 1000 // 7 días
  },
  
  // Contraseñas
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_SPECIAL_CHARS: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_UPPERCASE: true
  }
} as const

// ============ CONSTANTES DE UI/UX ============

export const UI = {
  // Animaciones
  ANIMATIONS: {
    DROPDOWN_DURATION: 200,
    TRANSITION_DURATION: 300,
    HOVER_SCALE: 1.02
  },
  
  // Z-index
  Z_INDEX: {
    DROPDOWN: 9999,
    MODAL: 10000,
    TOOLTIP: 10001
  },
  
  // Tamaños
  SIZES: {
    BUTTON_HEIGHT: 48, // h-12
    INPUT_HEIGHT: 48, // h-12
    CARD_PADDING: 24, // p-6
    BORDER_RADIUS: 12 // rounded-xl
  }
} as const

// ============ CONSTANTES DE NOTIFICACIONES ============

export const NOTIFICATIONS = {
  // Tiempos de duración
  DURATION: {
    SUCCESS: 3000, // 3 segundos
    ERROR: 5000,   // 5 segundos
    WARNING: 4000, // 4 segundos
    INFO: 3000     // 3 segundos
  },
  
  // Posiciones
  POSITION: {
    TOP_RIGHT: 'top-right',
    TOP_LEFT: 'top-left',
    BOTTOM_RIGHT: 'bottom-right',
    BOTTOM_LEFT: 'bottom-left'
  }
} as const

// ============ CONSTANTES DE EMPRESA ============

export const COMPANY = {
  // Información de la empresa
  INFO: {
    NAME: 'ECOFOR Market',
    DESCRIPTION: 'Insumos de aseo, papelería, químicos y EPP',
    EMAIL: 'contacto@ecofor.cl',
    PHONE: '+56 41 123 4567',
    ADDRESS: 'Concepción, Chile'
  },
  
  // Configuración del negocio
  BUSINESS: {
    CURRENCY: 'CLP',
    CURRENCY_SYMBOL: '$',
    DECIMAL_PLACES: 0,
    THOUSAND_SEPARATOR: '.',
    DECIMAL_SEPARATOR: ','
  },
  
  // Horarios
  HOURS: {
    OPEN: '08:00',
    CLOSE: '18:00',
    TIMEZONE: 'America/Santiago'
  }
} as const

// ============ CONSTANTES DE CATEGORÍAS ============

export const CATEGORIES = {
  // Categorías principales
  MAIN: {
    PAPELERIA: 'Papelería',
    QUIMICOS: 'Químicos',
    LIMPIEZA: 'Limpieza',
    EPP: 'EPP'
  },
  
  // Slugs de categorías
  SLUGS: {
    PAPELERIA: 'papeleria',
    QUIMICOS: 'quimicos',
    LIMPIEZA: 'limpieza',
    EPP: 'epp'
  }
} as const

// ============ TIPOS DERIVADOS ============

// Tipos derivados de las constantes para TypeScript
export type ShippingMethod = typeof SHIPPING.METHODS[keyof typeof SHIPPING.METHODS]
export type ShippingCity = typeof SHIPPING.CITIES[keyof typeof SHIPPING.CITIES]
export type ShippingZone = typeof SHIPPING.ZONES[keyof typeof SHIPPING.ZONES]
export type ProductUnit = typeof PRODUCT.UNITS[keyof typeof PRODUCT.UNITS]
export type OrderType = typeof ORDER.TYPES[keyof typeof ORDER.TYPES]
export type OrderStatus = typeof ORDER.STATUS[keyof typeof ORDER.STATUS]
export type UserType = typeof USER.TYPES[keyof typeof USER.TYPES]
export type UserRole = typeof USER.ROLES[keyof typeof USER.ROLES]
export type CategorySlug = typeof CATEGORIES.SLUGS[keyof typeof CATEGORIES.SLUGS]

// ============ FUNCIONES HELPER ============

/**
 * Calcula el costo de envío basado en el método y subtotal
 */
export function calculateShippingCost(
  method: ShippingMethod,
  subtotal: number
): number {
  switch (method) {
    case SHIPPING.METHODS.RETIRO_TIENDA:
      return SHIPPING.COSTS.PICKUP
    
    case SHIPPING.METHODS.COURIER:
      return SHIPPING.COSTS.COURIER
    
    case SHIPPING.METHODS.DESPACHO_GRATIS:
      return subtotal >= SHIPPING.FREE_SHIPPING_MINIMUM 
        ? SHIPPING.COSTS.FREE 
        : SHIPPING.COSTS.STANDARD
    
    case SHIPPING.METHODS.RUTA_PROGRAMADA:
    case SHIPPING.METHODS.DESPACHO_ESPECIAL:
      return SHIPPING.COSTS.STANDARD
    
    default:
      return SHIPPING.COSTS.STANDARD
  }
}

/**
 * Verifica si el envío es gratis
 */
export function isFreeShipping(subtotal: number): boolean {
  return subtotal >= SHIPPING.FREE_SHIPPING_MINIMUM
}

/**
 * Obtiene el tiempo de entrega para una zona
 */
export function getDeliveryTime(zone: string): string {
  return SHIPPING.AREAS[zone as keyof typeof SHIPPING.AREAS] || SHIPPING.AREAS['Otras zonas']
}

/**
 * Formatea un precio en la moneda local
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: COMPANY.BUSINESS.CURRENCY,
    minimumFractionDigits: COMPANY.BUSINESS.DECIMAL_PLACES,
    maximumFractionDigits: COMPANY.BUSINESS.DECIMAL_PLACES
  }).format(amount)
}

/**
 * Valida si una cantidad está dentro de los límites
 */
export function validateQuantity(quantity: number): boolean {
  return quantity >= PRODUCT.QUANTITY_LIMITS.MIN && 
         quantity <= PRODUCT.QUANTITY_LIMITS.MAX
}

/**
 * Valida si un descuento está dentro de los límites
 */
export function validateDiscount(discount: number): boolean {
  return discount >= PRODUCT.DISCOUNT_LIMITS.MIN && 
         discount <= PRODUCT.DISCOUNT_LIMITS.MAX
}

/**
 * Genera el prefijo del número de orden
 */
export function generateOrderPrefix(): string {
  const year = new Date().getFullYear()
  return `${ORDER.NUMBER.PREFIX}-${year}-`
}

// ============ EXPORTACIONES ============

export default {
  SHIPPING,
  PRODUCT,
  ORDER,
  USER,
  CART,
  PAGINATION,
  FILE,
  RATE_LIMIT,
  SECURITY,
  UI,
  NOTIFICATIONS,
  COMPANY,
  CATEGORIES
}
