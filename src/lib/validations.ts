import { z } from "zod"

// Validación RUT chileno básica
const rutRegex = /^[0-9]+-[0-9kK]{1}$/

// ============ AUTENTICACIÓN Y USUARIOS ============

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres")
})

export const registerNaturalSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  rut: z.string().regex(rutRegex, "RUT inválido (formato: 12345678-9)"),
  shippingAddress: z.string().min(10, "Dirección debe tener al menos 10 caracteres"),
  phone: z.string().min(9, "Teléfono debe tener al menos 9 caracteres")
})

export const registerEmpresaSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(2, "Nombre contacto debe tener al menos 2 caracteres"),
  rut: z.string().regex(rutRegex, "RUT empresa inválido (formato: 76123456-7)"),
  phone: z.string().min(9, "Teléfono debe tener al menos 9 caracteres"),
  company: z.string().min(2, "Razón social es requerida"),
  businessType: z.string().min(2, "Giro comercial es requerido"),
  billingAddress: z.string().min(5, "Dirección de facturación es requerida"),
  shippingAddress: z.string().min(5, "Dirección de despacho es requerida")
})

export const createRoleUserSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  rut: z.string().regex(rutRegex, "RUT inválido (formato: 12345678-9)"),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "VENDEDOR"], {
    message: "Debe seleccionar un rol válido (ADMIN o VENDEDOR)"
  })
})

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres").optional(),
  phone: z.string().min(9, "Teléfono debe tener al menos 9 caracteres").optional(),
  
  // Campos específicos para empresas
  company: z.string().optional(),
  businessType: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  
  // Cambio de contraseña (opcional)
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Nueva contraseña debe tener al menos 6 caracteres").optional(),
  confirmPassword: z.string().optional()
}).refine((data) => {
  // Si se proporciona nueva contraseña, debe coincidir con confirmación
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false
  }
  // Si se proporciona nueva contraseña, debe haber contraseña actual
  if (data.newPassword && !data.currentPassword) {
    return false
  }
  return true
}, {
  message: "Las contraseñas no coinciden o falta la contraseña actual"
})

// ============ CARRITO DE COMPRAS ============

export const addToCartSchema = z.object({
  productId: z.string().min(1, "ID del producto es requerido"),
  quantity: z.number()
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad debe ser al menos 1")
    .max(999, "La cantidad no puede ser mayor a 999")
})

export const updateCartItemSchema = z.object({
  productId: z.string().min(1, "ID del producto es requerido"),
  quantity: z.number()
    .int("La cantidad debe ser un número entero")
    .min(0, "La cantidad debe ser al menos 0")
    .max(999, "La cantidad no puede ser mayor a 999")
})

// Esquemas para servicios (sin mensajes de error personalizados para uso interno)
export const addItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1).max(999)
})

export const updateCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1).max(999)
  }))
})

export const updateItemSchema = z.object({
  quantity: z.number().min(1).max(999)
})

export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1).max(999),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0)
})

// ============ SISTEMA DE PEDIDOS ============

export const createOrderSchema = z.object({
  type: z.enum(["COMPRA", "COTIZACION"], {
    message: "Tipo debe ser COMPRA o COTIZACION"
  }),
  shippingAddress: z.string().min(10, "Dirección de despacho debe tener al menos 10 caracteres"),
  billingAddress: z.string().optional(),
  shippingMethod: z.enum([
    "RETIRO_TIENDA", 
    "DESPACHO_GRATIS", 
    "RUTA_PROGRAMADA", 
    "COURIER", 
    "DESPACHO_ESPECIAL"
  ], {
    message: "Método de despacho inválido"
  }),
  shippingCity: z.string().optional(),
  customerNotes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
  estimatedDate: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  items: z.array(z.object({
    productId: z.string().min(1, "ID del producto es requerido"),
    quantity: z.number()
      .int("La cantidad debe ser un número entero")
      .min(1, "La cantidad debe ser al menos 1")
      .max(999, "La cantidad no puede ser mayor a 999"),
    unitPrice: z.number().min(0, "El precio debe ser mayor o igual a 0"),
    discount: z.number().min(0).max(100).default(0)
  })).min(1, "Debe agregar al menos un producto al pedido")
})

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "ID del pedido es requerido"),
  newStatus: z.enum([
    "RECIBIDO",
    "VALIDANDO", 
    "APROBADO",
    "PREPARANDO",
    "LISTO",
    "EN_RUTA",
    "ENTREGADO",
    "COTIZACION",
    "CANCELADO",
    "RECHAZADO",
    "EN_ESPERA"
  ], {
    message: "Estado del pedido inválido"
  }),
  reason: z.string().optional(),
  notes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url("URL de tracking inválida").optional(),
  estimatedDate: z.string().datetime("Fecha estimada inválida").optional()
})

export const assignOrderSchema = z.object({
  orderId: z.string().min(1, "ID del pedido es requerido"),
  vendedorId: z.string().min(1, "ID del vendedor es requerido")
})

export const addAdminNotesSchema = z.object({
  orderId: z.string().min(1, "ID del pedido es requerido"),
  adminNotes: z.string()
    .min(1, "Las notas administrativas son requeridas")
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
})

export const cancelOrderSchema = z.object({
  orderId: z.string().min(1, "ID del pedido es requerido"),
  cancelReason: z.string()
    .min(5, "La razón de cancelación debe tener al menos 5 caracteres")
    .max(500, "La razón no puede exceder 500 caracteres")
})

export const orderFiltersSchema = z.object({
  status: z.enum([
    "RECIBIDO",
    "VALIDANDO", 
    "APROBADO",
    "PREPARANDO",
    "LISTO",
    "EN_RUTA",
    "ENTREGADO",
    "COTIZACION",
    "CANCELADO",
    "RECHAZADO",
    "EN_ESPERA"
  ]).optional(),
  type: z.enum(["COMPRA", "COTIZACION"]).optional(),
  userId: z.string().optional(),
  assignedTo: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minTotal: z.number().min(0).optional(),
  maxTotal: z.number().min(0).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

// ============ DESCUENTOS Y PRECIOS ============

export const applyDiscountSchema = z.object({
  orderId: z.string().min(1, "ID del pedido es requerido"),
  discountType: z.enum(["PORCENTAJE", "FIJO"], {
    message: "Tipo de descuento debe ser PORCENTAJE o FIJO"
  }),
  discountValue: z.number()
    .min(0, "El descuento no puede ser negativo")
    .max(100, "El descuento porcentual no puede ser mayor a 100%"),
  reason: z.string()
    .min(5, "La razón del descuento debe tener al menos 5 caracteres")
    .max(200, "La razón no puede exceder 200 caracteres")
})

export const calculateShippingSchema = z.object({
  shippingMethod: z.enum([
    "RETIRO_TIENDA", 
    "DESPACHO_GRATIS", 
    "RUTA_PROGRAMADA", 
    "COURIER", 
    "DESPACHO_ESPECIAL"
  ]),
  shippingCity: z.string().optional(),
  shippingZone: z.string().optional(),
  total: z.number().min(0, "El total debe ser mayor o igual a 0"),
  weight: z.number().min(0, "El peso debe ser mayor o igual a 0").optional()
})

// ============ TIPOS TYPESCRIPT ============

export type LoginData = z.infer<typeof loginSchema>
export type RegisterNaturalData = z.infer<typeof registerNaturalSchema>
export type RegisterEmpresaData = z.infer<typeof registerEmpresaSchema>
export type CreateRoleUserData = z.infer<typeof createRoleUserSchema>
export type UpdateProfileData = z.infer<typeof updateProfileSchema>

export type AddToCartData = z.infer<typeof addToCartSchema>
export type UpdateCartItemData = z.infer<typeof updateCartItemSchema>
export type AddItemData = z.infer<typeof addItemSchema>
export type UpdateCartData = z.infer<typeof updateCartSchema>
export type UpdateItemData = z.infer<typeof updateItemSchema>
export type OrderItemData = z.infer<typeof orderItemSchema>
export type CreateOrderData = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusData = z.infer<typeof updateOrderStatusSchema>
export type AssignOrderData = z.infer<typeof assignOrderSchema>
export type AddAdminNotesData = z.infer<typeof addAdminNotesSchema>
export type CancelOrderData = z.infer<typeof cancelOrderSchema>
export type OrderFiltersData = z.infer<typeof orderFiltersSchema>
export type ApplyDiscountData = z.infer<typeof applyDiscountSchema>
export type CalculateShippingData = z.infer<typeof calculateShippingSchema>

// ============ INTERFACES Y TIPOS AUXILIARES ============

export interface CartItem {
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    sku: string
    basePrice: number
    wholesalePrice?: number
    stock: number
    unit: string
    mainImage?: string
  }
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  total: number
  itemCount: number
}

export interface OrderStatusInfo {
  status: string
  label: string
  description: string
  color: string
  icon: string
  allowedNextStates: string[]
  canCancel: boolean
  isTerminal: boolean
}

// ============ CONFIGURACIÓN DE ESTADOS ============

export const ORDER_STATUS_CONFIG: Record<string, OrderStatusInfo> = {
  RECIBIDO: {
    status: "RECIBIDO",
    label: "Recibido",
    description: "Pedido recibido, pendiente de validación",
    color: "blue",
    icon: "inbox",
    allowedNextStates: ["VALIDANDO", "CANCELADO"],
    canCancel: true,
    isTerminal: false
  },
  VALIDANDO: {
    status: "VALIDANDO",
    label: "Validando",
    description: "Revisando disponibilidad y datos del pedido",
    color: "yellow",
    icon: "search",
    allowedNextStates: ["APROBADO", "RECHAZADO", "EN_ESPERA"],
    canCancel: true,
    isTerminal: false
  },
  APROBADO: {
    status: "APROBADO",
    label: "Aprobado",
    description: "Pedido aprobado, listo para preparar",
    color: "green",
    icon: "check-circle",
    allowedNextStates: ["PREPARANDO", "CANCELADO"],
    canCancel: true,
    isTerminal: false
  },
  PREPARANDO: {
    status: "PREPARANDO",
    label: "Preparando",
    description: "Armando el pedido en bodega",
    color: "orange",
    icon: "package",
    allowedNextStates: ["LISTO", "EN_ESPERA"],
    canCancel: false,
    isTerminal: false
  },
  LISTO: {
    status: "LISTO",
    label: "Listo",
    description: "Pedido preparado, listo para despacho",
    color: "purple",
    icon: "check",
    allowedNextStates: ["EN_RUTA"],
    canCancel: false,
    isTerminal: false
  },
  EN_RUTA: {
    status: "EN_RUTA",
    label: "En Ruta",
    description: "Pedido despachado, en camino al cliente",
    color: "indigo",
    icon: "truck",
    allowedNextStates: ["ENTREGADO"],
    canCancel: false,
    isTerminal: false
  },
  ENTREGADO: {
    status: "ENTREGADO",
    label: "Entregado",
    description: "Pedido entregado al cliente",
    color: "emerald",
    icon: "check-badge",
    allowedNextStates: [],
    canCancel: false,
    isTerminal: true
  },
  COTIZACION: {
    status: "COTIZACION",
    label: "Cotización",
    description: "Cotización generada",
    color: "gray",
    icon: "document-text",
    allowedNextStates: ["RECIBIDO"],
    canCancel: true,
    isTerminal: false
  },
  CANCELADO: {
    status: "CANCELADO",
    label: "Cancelado",
    description: "Pedido cancelado",
    color: "red",
    icon: "x-circle",
    allowedNextStates: [],
    canCancel: false,
    isTerminal: true
  },
  RECHAZADO: {
    status: "RECHAZADO",
    label: "Rechazado",
    description: "Pedido rechazado",
    color: "red",
    icon: "x-mark",
    allowedNextStates: [],
    canCancel: false,
    isTerminal: true
  },
  EN_ESPERA: {
    status: "EN_ESPERA",
    label: "En Espera",
    description: "Pedido pausado temporalmente",
    color: "amber",
    icon: "pause",
    allowedNextStates: ["VALIDANDO", "APROBADO", "CANCELADO"],
    canCancel: true,
    isTerminal: false
  }
}