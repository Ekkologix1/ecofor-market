import { describe, it, expect } from 'vitest'
import { NextResponse } from 'next/server'
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ErrorHandler,
  isOperationalError,
  toAppError,
  ERROR_CODES
} from '@/lib/errorHandler'
import { ZodError } from 'zod'

describe('Manejo de Errores', () => {
  describe('Clases de Error Personalizadas', () => {
    it('debe crear AppError correctamente', () => {
      const error = new AppError('Test error', 400, true, 'TEST_ERROR')
      
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.isOperational).toBe(true)
      expect(error.code).toBe('TEST_ERROR')
      expect(error).toBeInstanceOf(Error)
    })

    it('debe crear ValidationError con código correcto', () => {
      const error = new ValidationError('Validation failed')
      
      expect(error.message).toBe('Validation failed')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.isOperational).toBe(true)
    })

    it('debe crear AuthenticationError con código correcto', () => {
      const error = new AuthenticationError()
      
      expect(error.message).toBe('No autorizado')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('debe crear AuthorizationError con código correcto', () => {
      const error = new AuthorizationError()
      
      expect(error.message).toBe('No tienes permisos para realizar esta acción')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('AUTHORIZATION_ERROR')
    })

    it('debe crear NotFoundError con código correcto', () => {
      const error = new NotFoundError('Producto')
      
      expect(error.message).toBe('Producto no encontrado')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND_ERROR')
    })

    it('debe crear ConflictError con código correcto', () => {
      const error = new ConflictError('Resource already exists')
      
      expect(error.message).toBe('Resource already exists')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT_ERROR')
    })

    it('debe crear BusinessLogicError con código correcto', () => {
      const error = new BusinessLogicError('Invalid operation')
      
      expect(error.message).toBe('Invalid operation')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('BUSINESS_LOGIC_ERROR')
    })

    it('debe crear RateLimitError con código correcto', () => {
      const error = new RateLimitError()
      
      expect(error.message).toBe('Demasiadas solicitudes. Intenta nuevamente más tarde')
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('RATE_LIMIT_ERROR')
    })

    it('debe crear DatabaseError con código correcto', () => {
      const error = new DatabaseError()
      
      expect(error.message).toBe('Error de base de datos')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('DATABASE_ERROR')
    })

    it('debe crear ExternalServiceError con código correcto', () => {
      const error = new ExternalServiceError('Payment Service')
      
      expect(error.message).toBe('Error en servicio externo: Payment Service')
      expect(error.statusCode).toBe(502)
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR')
    })
  })

  describe('ErrorHandler', () => {
    it('debe manejar AppError correctamente', () => {
      const error = new ValidationError('Test validation error')
      const response = ErrorHandler.handleError(error, '/test')
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
    })

    it('debe manejar ZodError correctamente', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number'
        }
      ])
      
      const response = ErrorHandler.handleError(zodError, '/test')
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
    })

    it('debe manejar error de Prisma P2002', () => {
      const prismaError = {
        code: 'P2002',
        meta: {
          target: ['email']
        }
      }
      
      const response = ErrorHandler.handleError(prismaError, '/test')
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(409)
    })

    it('debe manejar error de Prisma P2025', () => {
      const prismaError = {
        code: 'P2025'
      }
      
      const response = ErrorHandler.handleError(prismaError, '/test')
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(404)
    })

    it('debe manejar error de Prisma P2003', () => {
      const prismaError = {
        code: 'P2003',
        meta: {
          field_name: 'userId'
        }
      }
      
      const response = ErrorHandler.handleError(prismaError, '/test')
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(400)
    })

    it('debe manejar error estándar de JavaScript', () => {
      const error = new Error('Standard JavaScript error')
      const response = ErrorHandler.handleError(error, '/test')
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })

    it('debe manejar error desconocido', () => {
      const unknownError = 'String error'
      const response = ErrorHandler.handleError(unknownError, '/test')
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.status).toBe(500)
    })
  })

  describe('Utilidades de Error', () => {
    it('debe identificar error operacional', () => {
      const operationalError = new ValidationError('Test')
      const nonOperationalError = new AppError('Test', 500, false)
      
      expect(isOperationalError(operationalError)).toBe(true)
      expect(isOperationalError(nonOperationalError)).toBe(false)
      expect(isOperationalError(new Error('Standard'))).toBe(false)
    })

    it('debe convertir error a AppError', () => {
      const standardError = new Error('Standard error')
      const appError = new ValidationError('App error')
      
      const converted1 = toAppError(standardError)
      const converted2 = toAppError(appError)
      
      expect(converted1).toBeInstanceOf(AppError)
      expect(converted1.message).toBe('Standard error')
      expect(converted1.statusCode).toBe(500)
      expect(converted1.isOperational).toBe(false)
      
      expect(converted2).toBe(appError) // No debe cambiar
    })

    it('debe convertir error desconocido a AppError', () => {
      const unknownError = 'String error'
      const converted = toAppError(unknownError)
      
      expect(converted).toBeInstanceOf(AppError)
      expect(converted.message).toBe('Error desconocido')
      expect(converted.statusCode).toBe(500)
      expect(converted.isOperational).toBe(false)
    })
  })

  describe('Códigos de Error', () => {
    it('debe tener todos los códigos de error definidos', () => {
      const expectedCodes = [
        'VALIDATION_ERROR',
        'AUTHENTICATION_ERROR',
        'AUTHORIZATION_ERROR',
        'NOT_FOUND_ERROR',
        'BUSINESS_LOGIC_ERROR',
        'CONFLICT_ERROR',
        'RATE_LIMIT_ERROR',
        'DATABASE_ERROR',
        'EXTERNAL_SERVICE_ERROR'
      ]
      
      expectedCodes.forEach(code => {
        expect(ERROR_CODES).toHaveProperty(code)
        expect(ERROR_CODES[code]).toBe(code)
      })
    })
  })

  describe('Métodos de creación de ErrorHandler', () => {
    it('debe crear ValidationError usando ErrorHandler', () => {
      const error = ErrorHandler.createValidationError('Test validation')
      
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Test validation')
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('debe crear BusinessLogicError usando ErrorHandler', () => {
      const error = ErrorHandler.createBusinessError('Test business logic')
      
      expect(error).toBeInstanceOf(BusinessLogicError)
      expect(error.message).toBe('Test business logic')
      expect(error.code).toBe('BUSINESS_LOGIC_ERROR')
    })

    it('debe crear NotFoundError usando ErrorHandler', () => {
      const error = ErrorHandler.createNotFoundError('Usuario')
      
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.message).toBe('Usuario no encontrado')
      expect(error.code).toBe('NOT_FOUND_ERROR')
    })

    it('debe crear ConflictError usando ErrorHandler', () => {
      const error = ErrorHandler.createConflictError('Test conflict')
      
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.message).toBe('Test conflict')
      expect(error.code).toBe('CONFLICT_ERROR')
    })
  })
})
