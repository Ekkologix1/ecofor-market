// ============================================
// INFRASTRUCTURE: PrismaUserRepository
// Implementación del repositorio de usuarios usando Prisma
// ============================================

import { PrismaClient } from '@prisma/client'
import { User, UserId, Email, UserRepository } from '@/domain'

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    const userData = user.toPersistence()
    
    await this.prisma.user.upsert({
      where: { id: userData.id.getValue() },
      update: {
        name: userData.name ?? '',
        email: userData.email,
        role: userData.role,
        type: userData.type,
        validated: userData.validated,
        updatedAt: userData.updatedAt
      },
      create: {
        id: userData.id.getValue(),
        name: userData.name ?? '',
        email: userData.email,
        password: '', // TODO: Implementar manejo de contraseñas
        role: userData.role,
        type: userData.type,
        validated: userData.validated,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    })
  }

  async findById(id: UserId): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id: id.getValue() }
    })

    if (!userData) {
      return null
    }

    return User.fromPersistence({
      id: new UserId(userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role as any,
      type: userData.type as any,
      validated: userData.validated,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    })
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email: email.getValue() }
    })

    if (!userData) {
      return null
    }

    return User.fromPersistence({
      id: new UserId(userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role as any,
      type: userData.type as any,
      validated: userData.validated,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    })
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.getValue() }
    })
  }

  async findAll(): Promise<User[]> {
    const usersData = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return usersData.map(userData => User.fromPersistence({
      id: new UserId(userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role as any,
      type: userData.type as any,
      validated: userData.validated,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    }))
  }

  async findByRole(role: string): Promise<User[]> {
    const usersData = await this.prisma.user.findMany({
      where: { role: role as any },
      orderBy: { createdAt: 'desc' }
    })

    return usersData.map(userData => User.fromPersistence({
      id: new UserId(userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role as any,
      type: userData.type as any,
      validated: userData.validated,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    }))
  }

  async findValidated(): Promise<User[]> {
    const usersData = await this.prisma.user.findMany({
      where: { validated: true },
      orderBy: { createdAt: 'desc' }
    })

    return usersData.map(userData => User.fromPersistence({
      id: new UserId(userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role as any,
      type: userData.type as any,
      validated: userData.validated,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    }))
  }

  async findPendingValidation(): Promise<User[]> {
    const usersData = await this.prisma.user.findMany({
      where: { validated: false },
      orderBy: { createdAt: 'desc' }
    })

    return usersData.map(userData => User.fromPersistence({
      id: new UserId(userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role as any,
      type: userData.type as any,
      validated: userData.validated,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    }))
  }

  async count(): Promise<number> {
    return await this.prisma.user.count()
  }

  async countByRole(role: string): Promise<number> {
    return await this.prisma.user.count({
      where: { role: role as any }
    })
  }

  async findPaginated(page: number, limit: number): Promise<{
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    const [usersData, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count()
    ])

    const users = usersData.map(userData => User.fromPersistence({
      id: new UserId(userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role as any,
      type: userData.type as any,
      validated: userData.validated,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    }))

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}
