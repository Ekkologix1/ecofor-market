// src/lib/errorHandler.ts
import { NextResponse } from "next/server"
import { ZodError } from "zod"

// ============ CLASES DE ERROR PERSONALIZADAS ============

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly code?: string
  public readonly details?: Record<string, unknown>

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code
    this.details = details

    // Mantener el stack trace correcto
    Error.captureStackTrace(this, this.constructor)
  }
}

// Errores específicos del dominio de la aplicación
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, true, "VALIDATION_ERROR", details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "No autorizado") {
    super(message, 401, true, "AUTHENTICATION_ERROR")
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "No tienes permisos para realizar esta acción") {
    super(message, 403, true, "AUTHORIZATION_ERROR")
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Recurso") {
    super(`${resource} no encontrado`, 404, true, "NOT_FOUND_ERROR")
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, "CONFLICT_ERROR")
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, true, "BUSINESS_LOGIC_ERROR", details)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Demasiadas solicitudes. Intenta nuevamente más tarde") {
    super(message, 429, true, "RATE_LIMIT_ERROR")
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Error de base de datos") {
    super(message, 500, true, "DATABASE_ERROR")
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `Error en servicio externo: ${service}`,
      502,
      true,
      "EXTERNAL_SERVICE_ERROR"
    )
  }
}

// ============ ERROR CODES Y MESSAGES ============

export const ERROR_CODES = {
  // Errores de validación
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  
  // Errores de autenticación/autorización
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  USER_NOT_VALIDATED: "USER_NOT_VALIDATED",
  
  // Errores de recursos
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  
  // Errores de negocio
  BUSINESS_LOGIC_ERROR: "BUSINESS_LOGIC_ERROR",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  INVALID_OPERATION: "INVALID_OPERATION",
  ORDER_ALREADY_PROCESSED: "ORDER_ALREADY_PROCESSED",
  
  // Errores de conflicto
  CONFLICT_ERROR: "CONFLICT_ERROR",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",
  
  // Errores de límite
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  
  // Errores de sistema
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR"
} as const

export const ERROR_MESSAGES = {
  // Errores de validación
  [ERROR_CODES.VALIDATION_ERROR]: "Datos de entrada inválidos",
  [ERROR_CODES.INVALID_INPUT]: "Los datos proporcionados no son válidos",
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: "Faltan campos requeridos",
  
  // Errores de autenticación
  [ERROR_CODES.AUTHENTICATION_ERROR]: "No autorizado",
  [ERROR_CODES.AUTHORIZATION_ERROR]: "No tienes permisos para realizar esta acción",
  [ERROR_CODES.INVALID_CREDENTIALS]: "Credenciales inválidas",
  [ERROR_CODES.TOKEN_EXPIRED]: "Token expirado",
  [ERROR_CODES.USER_NOT_VALIDATED]: "Usuario no validado",
  
  // Errores de recursos
  [ERROR_CODES.NOT_FOUND_ERROR]: "Recurso no encontrado",
  [ERROR_CODES.RESOURCE_NOT_FOUND]: "El recurso solicitado no existe",
  [ERROR_CODES.PRODUCT_NOT_FOUND]: "Producto no encontrado",
  [ERROR_CODES.USER_NOT_FOUND]: "Usuario no encontrado",
  [ERROR_CODES.ORDER_NOT_FOUND]: "Pedido no encontrado",
  
  // Errores de negocio
  [ERROR_CODES.BUSINESS_LOGIC_ERROR]: "Error en la lógica de negocio",
  [ERROR_CODES.INSUFFICIENT_STOCK]: "Stock insuficiente",
  [ERROR_CODES.INVALID_OPERATION]: "Operación no válida",
  [ERROR_CODES.ORDER_ALREADY_PROCESSED]: "El pedido ya ha sido procesado",
  
  // Errores de conflicto
  [ERROR_CODES.CONFLICT_ERROR]: "Conflicto de datos",
  [ERROR_CODES.DUPLICATE_RESOURCE]: "El recurso ya existe",
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: "El recurso ya está registrado",
  
  // Errores de límite
  [ERROR_CODES.RATE_LIMIT_ERROR]: "Demasiadas solicitudes. Intenta nuevamente más tarde",
  
  // Errores de sistema
  [ERROR_CODES.DATABASE_ERROR]: "Error de base de datos",
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: "Error en servicio externo",
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: "Error interno del servidor"
} as const

// ============ ERROR HANDLER CENTRALIZADO ============

export interface ErrorResponse {
  error: string
  code?: string
  details?: Record<string, unknown> | Array<{
    field: string
    message: string
    code: string
  }>
  timestamp: string
  path?: string
}

export class ErrorHandler {
  /**
   * Maneja errores y devuelve una respuesta NextResponse apropiada
   */
  static handleError(error: unknown, path?: string): NextResponse<ErrorResponse> {
    console.error("Error handled:", {
      error,
      path,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Error personalizado de la aplicación
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          timestamp: new Date().toISOString(),
          path
        },
        { status: error.statusCode }
      )
    }

    // Error de validación Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Datos de entrada inválidos",
          code: ERROR_CODES.VALIDATION_ERROR,
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          })),
          timestamp: new Date().toISOString(),
          path
        },
        { status: 400 }
      )
    }

    // Error de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      
      switch (prismaError.code) {
        case 'P2002':
          return NextResponse.json(
            {
              error: "El recurso ya existe",
              code: ERROR_CODES.DUPLICATE_RESOURCE,
              details: { field: prismaError.meta?.target },
              timestamp: new Date().toISOString(),
              path
            },
            { status: 409 }
          )
        
        case 'P2025':
          return NextResponse.json(
            {
              error: "Recurso no encontrado",
              code: ERROR_CODES.RESOURCE_NOT_FOUND,
              timestamp: new Date().toISOString(),
              path
            },
            { status: 404 }
          )
        
        case 'P2003':
          return NextResponse.json(
            {
              error: "Referencia inválida",
              code: ERROR_CODES.INVALID_OPERATION,
              details: { field: prismaError.meta?.field_name },
              timestamp: new Date().toISOString(),
              path
            },
            { status: 400 }
          )
        
        default:
          return NextResponse.json(
            {
              error: "Error de base de datos",
              code: ERROR_CODES.DATABASE_ERROR,
              timestamp: new Date().toISOString(),
              path
            },
            { status: 500 }
          )
      }
    }

    // Error estándar de JavaScript
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          timestamp: new Date().toISOString(),
          path
        },
        { status: 500 }
      )
    }

    // Error desconocido
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        path
      },
      { status: 500 }
    )
  }

  /**
   * Wrapper para manejar errores en funciones async
   */
  static async handleAsync<T>(
    asyncFn: () => Promise<T>,
    path?: string
  ): Promise<T | NextResponse<ErrorResponse>> {
    try {
      return await asyncFn()
    } catch (error) {
      return this.handleError(error, path)
    }
  }

  /**
   * Crea un error de validación con detalles específicos
   */
  static createValidationError(message: string, details?: Record<string, unknown>): ValidationError {
    return new ValidationError(message, details)
  }

  /**
   * Crea un error de negocio con detalles específicos
   */
  static createBusinessError(message: string, details?: Record<string, unknown>): BusinessLogicError {
    return new BusinessLogicError(message, details)
  }

  /**
   * Crea un error de recurso no encontrado
   */
  static createNotFoundError(resource: string): NotFoundError {
    return new NotFoundError(resource)
  }

  /**
   * Crea un error de conflicto
   */
  static createConflictError(message: string): ConflictError {
    return new ConflictError(message)
  }
}

// ============ UTILIDADES DE ERROR ============

/**
 * Verifica si un error es operacional (manejable por el cliente)
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

/**
 * Convierte un error desconocido en un AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 500, false)
  }
  
  return new AppError("Error desconocido", 500, false)
}

/**
 * Middleware de error para Next.js API routes
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      const request = args[0] as Request
      const path = request?.url ? new URL(request.url).pathname : undefined
      return ErrorHandler.handleError(error, path)
    }
  }
}

// ============ EXPORTACIONES ============

export default ErrorHandler
