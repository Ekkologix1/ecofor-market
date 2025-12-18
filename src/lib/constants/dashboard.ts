// ============================================
// CONSTANTES DEL DASHBOARD
// Centraliza todas las rutas, roles y configuraciones
// ============================================

export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  DASHBOARD: '/dashboard',
  CATALOGO: '/catalogo',
  PEDIDOS: '/mis-pedidos',
  PERFIL: '/perfil',
  COTIZACIONES: '/cotizaciones',
  CONFIGURACION: '/configuracion',
  ADMIN: {
    STOCK: '/admin/stock',
    PEDIDOS: '/admin/pedidos',
    USUARIOS: '/admin/usuarios',
    USUARIOS_TODOS: '/admin/usuarios/todos',
    ROLES: '/admin/roles',
    ACTIVIDAD: '/admin/actividad',
  },
} as const

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  VENDEDOR: 'VENDEDOR',
  USER: 'USER',
} as const

export const USER_TYPES = {
  NATURAL: 'NATURAL',
  EMPRESA: 'EMPRESA',
} as const

export const DROPDOWN_CONFIG = {
  ID: 'user-dropdown',
  ANIMATION_DURATION: 200,
  Z_INDEX: 9999,
} as const

export const API_ENDPOINTS = {
  LOGOUT: '/api/auth/logout',
} as const

// Tipos derivados de las constantes
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES]
export type Route = typeof ROUTES[keyof typeof ROUTES]