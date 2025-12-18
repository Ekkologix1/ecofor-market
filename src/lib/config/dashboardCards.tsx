// ============================================
// CONFIGURACIÓN DE TARJETAS DEL DASHBOARD
// Define las tarjetas que ve cada tipo de usuario
// ============================================

import {
  Package,
  ShoppingCart,
  FileText,
  FileSpreadsheet,
  User,
  Users,
  Shield,
  Activity,
  Star,
  ArrowRight,
} from 'lucide-react'
import { ROUTES } from '@/lib/constants/dashboard'

export interface DashboardCard {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBgColor: string
  buttonText: string
  buttonVariant?: 'default' | 'outline'
  buttonGradient?: string
  route: string
  badge?: {
    text: string
    icon?: React.ComponentType<{ className?: string }>
    color: string
  }
  borderAccent?: boolean
  metadata?: {
    label: string
    value: string | number
    valueBgColor: string
    valueTextColor: string
  }
}

// Tarjetas para usuarios NATURAL
export const NATURAL_USER_CARDS: DashboardCard[] = [
  {
    id: 'catalogo',
    title: 'Catálogo de Productos',
    description: 'Explora nuestros productos de aseo, papelería y EPP',
    icon: Package,
    iconColor: 'text-emerald-600',
    iconBgColor: 'bg-emerald-100',
    buttonText: 'Explorar Catálogo',
    buttonGradient: 'from-emerald-600 to-teal-600',
    route: ROUTES.CATALOGO,
    badge: {
      text: 'Destacado',
      icon: Star,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    borderAccent: true,
    metadata: {
      label: 'Categorías disponibles:',
      value: 4,
      valueBgColor: 'bg-emerald-50',
      valueTextColor: 'text-emerald-700',
    },
  },
  {
    id: 'pedidos',
    title: 'Mis Pedidos',
    description: 'Revisa el estado de tus pedidos y compras anteriores',
    icon: ShoppingCart,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    buttonText: 'Ver Pedidos',
    buttonVariant: 'outline',
    route: ROUTES.PEDIDOS,
    metadata: {
      label: 'Pedidos activos:',
      value: 0,
      valueBgColor: 'bg-blue-50',
      valueTextColor: 'text-blue-700',
    },
  },
]

// Tarjetas para usuarios EMPRESA
export const EMPRESA_USER_CARDS: DashboardCard[] = [
  {
    id: 'catalogo',
    title: 'Catálogo de Productos',
    description: 'Más de 1000+ productos con precios mayoristas exclusivos',
    icon: Package,
    iconColor: 'text-emerald-600',
    iconBgColor: 'bg-emerald-100',
    buttonText: 'Ver Catálogo Empresarial',
    buttonGradient: 'from-emerald-600 to-teal-600',
    route: ROUTES.CATALOGO,
    badge: {
      text: 'Destacado',
      icon: Star,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    borderAccent: true,
    metadata: {
      label: 'Categorías disponibles:',
      value: 4,
      valueBgColor: 'bg-emerald-50',
      valueTextColor: 'text-emerald-700',
    },
  },
  {
    id: 'ordenes',
    title: 'Órdenes de Compra',
    description: 'Gestiona tu historial de órdenes y facturas empresariales',
    icon: ShoppingCart,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    buttonText: 'Ver Órdenes',
    buttonVariant: 'outline',
    route: ROUTES.PEDIDOS,
    metadata: {
      label: 'Pedidos activos:',
      value: 0,
      valueBgColor: 'bg-blue-50',
      valueTextColor: 'text-blue-700',
    },
  },
  {
    id: 'cotizaciones',
    title: 'Cotizaciones',
    description: 'Solicita cotizaciones personalizadas para compras grandes y proyectos especiales',
    icon: FileText,
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-100',
    buttonText: 'Nueva Cotización',
    buttonGradient: 'from-purple-600 to-purple-700',
    route: ROUTES.COTIZACIONES,
    metadata: {
      label: 'Cotizaciones pendientes:',
      value: 0,
      valueBgColor: 'bg-purple-50',
      valueTextColor: 'text-purple-700',
    },
  },
]

// Tarjetas para ADMIN
export const ADMIN_CARDS: DashboardCard[] = [
  {
    id: 'stock',
    title: 'Carga de Stock Diario',
    description: 'Actualizar inventario desde ERP Laudus',
    icon: FileSpreadsheet,
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-100',
    buttonText: 'Gestionar Stock',
    buttonGradient: 'from-green-600 to-green-700',
    route: ROUTES.ADMIN.STOCK,
  },
  {
    id: 'pedidos',
    title: 'Gestión de Pedidos',
    description: 'Administrar estados, tracking y seguimiento de pedidos',
    icon: Package,
    iconColor: 'text-cyan-600',
    iconBgColor: 'bg-cyan-100',
    buttonText: 'Ver Pedidos',
    buttonGradient: 'from-cyan-600 to-blue-600',
    route: ROUTES.ADMIN.PEDIDOS,
  },
  {
    id: 'validar-usuarios',
    title: 'Validar Usuarios',
    description: 'Revisar y aprobar usuarios pendientes de verificación',
    icon: User,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    buttonText: 'Ver Pendientes',
    buttonGradient: 'from-blue-600 to-blue-700',
    route: ROUTES.ADMIN.USUARIOS,
  },
  {
    id: 'gestion-usuarios',
    title: 'Gestión de Usuarios',
    description: 'Administrar todos los usuarios registrados en el sistema',
    icon: Users,
    iconColor: 'text-emerald-600',
    iconBgColor: 'bg-emerald-100',
    buttonText: 'Ver Todos',
    buttonVariant: 'outline',
    route: ROUTES.ADMIN.USUARIOS_TODOS,
  },
  {
    id: 'roles',
    title: 'Gestión de Roles',
    description: 'Crear administradores y vendedores (máx. 3 admins)',
    icon: Shield,
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-100',
    buttonText: 'Gestionar Roles',
    buttonVariant: 'outline',
    route: ROUTES.ADMIN.ROLES,
  },
  {
    id: 'actividad',
    title: 'Actividad de Usuarios',
    description: 'Monitorear actividad y tiempo de sesión',
    icon: Activity,
    iconColor: 'text-orange-600',
    iconBgColor: 'bg-orange-100',
    buttonText: 'Ver Actividad',
    buttonVariant: 'outline',
    route: ROUTES.ADMIN.ACTIVIDAD,
  },
]

// Tarjetas para VENDEDOR (ACTUALIZADO - incluye carga de stock)
export const VENDEDOR_CARDS: DashboardCard[] = [
  {
    id: 'pedidos',
    title: 'Gestión de Pedidos',
    description: 'Administrar estados, tracking y seguimiento de pedidos',
    icon: Package,
    iconColor: 'text-cyan-600',
    iconBgColor: 'bg-cyan-100',
    buttonText: 'Ver Pedidos',
    buttonGradient: 'from-cyan-600 to-blue-600',
    route: ROUTES.ADMIN.PEDIDOS,
    badge: {
      text: 'Principal',
      icon: Star,
      color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    },
    borderAccent: true,
  },
  {
    id: 'stock',
    title: 'Carga de Stock Diario',
    description: 'Actualizar inventario desde ERP Laudus',
    icon: FileSpreadsheet,
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-100',
    buttonText: 'Gestionar Stock',
    buttonGradient: 'from-green-600 to-green-700',
    route: ROUTES.ADMIN.STOCK,
  },
  {
    id: 'actividad',
    title: 'Actividad de Clientes',
    description: 'Monitorear actividad y tiempo de sesión de clientes',
    icon: Activity,
    iconColor: 'text-orange-600',
    iconBgColor: 'bg-orange-100',
    buttonText: 'Ver Actividad',
    buttonVariant: 'outline',
    route: ROUTES.ADMIN.ACTIVIDAD,
  },
  {
    id: 'catalogo',
    title: 'Catálogo de Productos',
    description: 'Ver productos disponibles y precios',
    icon: Package,
    iconColor: 'text-emerald-600',
    iconBgColor: 'bg-emerald-100',
    buttonText: 'Ver Catálogo',
    buttonVariant: 'outline',
    route: ROUTES.CATALOGO,
  },
]