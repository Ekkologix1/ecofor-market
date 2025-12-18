import { z } from "zod"

// ============ INTERFACES Y TIPOS ============

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationResult {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
  skip: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationResult
}

// ============ ESQUEMAS DE VALIDACIÓN ============

export const paginationSchema = z.object({
  page: z.number()
    .int("La página debe ser un número entero")
    .min(1, "La página debe ser mayor a 0")
    .default(1),
  limit: z.number()
    .int("El límite debe ser un número entero")
    .min(1, "El límite debe ser mayor a 0")
    .max(100, "El límite no puede ser mayor a 100")
    .default(10)
})

export const paginationQuerySchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 1)
    .pipe(z.number().int().min(1)),
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val) : 10)
    .pipe(z.number().int().min(1).max(100))
})

// ============ UTILIDADES DE PAGINACIÓN ============

/**
 * Calcula los parámetros de paginación a partir de page y limit
 */
export function calculatePagination(params: PaginationParams): PaginationResult {
  const { page, limit } = params
  const skip = (page - 1) * limit
  const totalPages = 0 // Se calculará después de obtener el totalCount
  const hasMore = false // Se calculará después de obtener el totalCount

  return {
    page,
    limit,
    totalCount: 0, // Se establecerá después de la consulta
    totalPages,
    hasMore,
    skip
  }
}

/**
 * Completa la información de paginación con el totalCount
 */
export function completePagination(pagination: Omit<PaginationResult, 'totalCount'>, totalCount: number): PaginationResult {
  const totalPages = Math.ceil(totalCount / pagination.limit)
  const hasMore = pagination.page < totalPages

  return {
    ...pagination,
    totalCount,
    totalPages,
    hasMore
  }
}

/**
 * Función helper para crear una respuesta paginada completa
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: Omit<PaginationResult, 'totalCount'>,
  totalCount: number
): PaginatedResponse<T> {
  const completePaginationInfo = completePagination(pagination, totalCount)

  return {
    data,
    pagination: completePaginationInfo
  }
}

/**
 * Función helper para extraer parámetros de paginación de URLSearchParams
 */
export function extractPaginationFromUrl(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  return { page, limit }
}

/**
 * Función helper para validar parámetros de paginación
 */
export function validatePaginationParams(params: Record<string, unknown>): PaginationParams {
  return paginationSchema.parse(params)
}

/**
 * Función helper para validar parámetros de paginación desde query string
 */
export function validatePaginationQuery(params: Record<string, unknown>): PaginationParams {
  const result = paginationQuerySchema.parse(params)
  return { page: result.page, limit: result.limit }
}

// ============ FUNCIONES ESPECÍFICAS PARA PRISMA ============

/**
 * Función helper para crear opciones de paginación para Prisma
 */
export function createPrismaPaginationOptions(pagination: PaginationParams) {
  return {
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit
  }
}

/**
 * Función helper para ejecutar consultas paginadas con Prisma
 */
export async function executePaginatedQuery<T>(
  queryFn: (options: { skip: number; take: number }) => Promise<T[]>,
  countFn: () => Promise<number>,
  pagination: PaginationParams
): Promise<PaginatedResponse<T>> {
  const paginationInfo = calculatePagination(pagination)
  
  const [data, totalCount] = await Promise.all([
    queryFn({ skip: paginationInfo.skip, take: paginationInfo.limit }),
    countFn()
  ])

  return createPaginatedResponse(data, paginationInfo, totalCount)
}

// ============ CONSTANTES DE PAGINACIÓN ============

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
} as const

export const PAGINATION_LIMITS = {
  SMALL: 10,
  MEDIUM: 20,
  LARGE: 50,
  EXTRA_LARGE: 100
} as const

// ============ TIPOS TYPESCRIPT ============

export type PaginationData = z.infer<typeof paginationSchema>
export type PaginationQueryData = z.infer<typeof paginationQuerySchema>
