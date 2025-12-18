// ============================================
// DOMAIN ENTITY: User
// Representa un usuario en el dominio de negocio
// ============================================

import { UserId } from '../value-objects/UserId'

export enum UserRole {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR', 
  USER = 'USER'
}

export enum UserType {
  EMPRESA = 'EMPRESA',
  NATURAL = 'NATURAL'
}

export interface UserProps {
  id: UserId
  name: string | null
  email: string
  role: UserRole
  type: UserType
  validated: boolean
  createdAt: Date
  updatedAt: Date
}

export class User {
  private constructor(private props: UserProps) {}

  // Factory method para crear un usuario
  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date()
    return new User({
      ...props,
      id: UserId.create(),
      createdAt: now,
      updatedAt: now
    })
  }

  // Factory method para reconstruir desde persistencia
  static fromPersistence(props: UserProps): User {
    return new User(props)
  }

  // Getters
  get id(): UserId {
    return this.props.id
  }

  get name(): string | null {
    return this.props.name
  }

  get email(): string {
    return this.props.email
  }

  get role(): UserRole {
    return this.props.role
  }

  get type(): UserType {
    return this.props.type
  }

  get validated(): boolean {
    return this.props.validated
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business methods
  validate(): void {
    this.props.validated = true
    this.props.updatedAt = new Date()
  }

  unvalidate(): void {
    this.props.validated = false
    this.props.updatedAt = new Date()
  }

  updateRole(newRole: UserRole): void {
    this.props.role = newRole
    this.props.updatedAt = new Date()
  }

  updateName(newName: string | null): void {
    this.props.name = newName
    this.props.updatedAt = new Date()
  }

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN
  }

  isVendedor(): boolean {
    return this.props.role === UserRole.VENDEDOR
  }

  isUser(): boolean {
    return this.props.role === UserRole.USER
  }

  isEmpresa(): boolean {
    return this.props.type === UserType.EMPRESA
  }

  isNatural(): boolean {
    return this.props.type === UserType.NATURAL
  }

  // Método para obtener los datos para persistencia
  toPersistence(): UserProps {
    return { ...this.props }
  }
}
