// ============================================
// DOMAIN REPOSITORY INTERFACE: UserRepository
// Define el contrato para persistencia de usuarios
// ============================================

import { User } from '../entities/User'
import { UserId } from '../value-objects/UserId'
import { Email } from '../value-objects/Email'

export interface UserRepository {
  // Operaciones básicas CRUD
  save(user: User): Promise<void>
  findById(id: UserId): Promise<User | null>
  findByEmail(email: Email): Promise<User | null>
  delete(id: UserId): Promise<void>

  // Operaciones de búsqueda
  findAll(): Promise<User[]>
  findByRole(role: string): Promise<User[]>
  findValidated(): Promise<User[]>
  findPendingValidation(): Promise<User[]>

  // Operaciones de conteo
  count(): Promise<number>
  countByRole(role: string): Promise<number>

  // Operaciones de paginación
  findPaginated(page: number, limit: number): Promise<{
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>
}
