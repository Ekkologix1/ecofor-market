// ============================================
// DTO: UserDto
// Data Transfer Objects para la capa de aplicación
// ============================================

import { UserRole, UserType } from '../../domain/entities/User'

export interface CreateUserDto {
  name: string | null
  email: string
  role: UserRole
  type: UserType
}

export interface UpdateUserDto {
  name?: string | null
  role?: UserRole
}

export interface UserResponseDto {
  id: string
  name: string | null
  email: string
  role: UserRole
  type: UserType
  validated: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserListDto {
  users: UserResponseDto[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ValidateUserDto {
  userId: string
  validated: boolean
}
