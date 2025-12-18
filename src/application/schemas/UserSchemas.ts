// ============================================
// VALIDATION SCHEMAS: UserSchemas
// Schemas de validación con Zod para usuarios
// ============================================

import { z } from 'zod'
import { UserRole, UserType } from '@/domain'

// Schema para crear usuario
export const CreateUserSchema = z.object({
  name: z.string().nullable().optional().transform(val => val ?? null),
  email: z.string().email({ message: 'Email inválido' }),
  role: z.nativeEnum(UserRole, {
    message: 'Rol de usuario inválido'
  }),
  type: z.nativeEnum(UserType, {
    message: 'Tipo de usuario inválido'
  })
})

// Schema para actualizar usuario
export const UpdateUserSchema = z.object({
  name: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole).optional(),
  validated: z.boolean().optional()
})

// Schema para validar usuario
export const ValidateUserSchema = z.object({
  validated: z.boolean()
})

// Schema para parámetros de usuario
export const UserParamsSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'ID de usuario inválido'
  })
})

// Schema para query parameters de listado
export const UserListQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  role: z.nativeEnum(UserRole).optional(),
  validated: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
})

// Tipos inferidos de los schemas
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type ValidateUserInput = z.infer<typeof ValidateUserSchema>
export type UserParams = z.infer<typeof UserParamsSchema>
export type UserListQuery = z.infer<typeof UserListQuerySchema>

// Funciones helper para validación
export const validateCreateUser = (data: unknown) => CreateUserSchema.parse(data)
export const validateUpdateUser = (data: unknown) => UpdateUserSchema.parse(data)
export const validateUserParams = (data: unknown) => UserParamsSchema.parse(data)
export const validateUserListQuery = (data: unknown) => UserListQuerySchema.parse(data)
export const validateUserValidation = (data: unknown) => ValidateUserSchema.parse(data)

// Función para manejar errores de validación
export const formatValidationError = (error: z.ZodError) => {
  return error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message
  }))
}
