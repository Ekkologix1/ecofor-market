import { prisma, executePaginatedQuery, type PaginatedResponse } from "@/lib"
import { SoftDeleteService, OptimisticLockingService, softDeleteMiddleware } from "@/lib/soft-delete"
import type { User, Prisma } from "@prisma/client"

// Aplicar middleware de soft delete
softDeleteMiddleware(prisma)

// src/services/userService.ts



// Interfaces para tipos
export interface UserFilters {
  type?: string
  role?: string
  validated?: boolean
  page?: number
  limit?: number
}

export interface UserSelectFields {
  id: boolean
  name: boolean
  email: boolean
  rut: boolean
  phone: boolean
  type: boolean
  role: boolean
  validated: boolean
  company: boolean
  createdAt: boolean
  updatedAt?: boolean
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasMore: boolean
  }
}

export class UserService {
  private static softDeleteService = new SoftDeleteService(prisma)
  private static optimisticLockingService = new OptimisticLockingService(prisma)
  // Obtener todos los usuarios con filtros opcionales
  static async getAllUsers(filters: UserFilters = {}): Promise<PaginatedResponse<Partial<User>>> {
    const {
      type,
      role,
      validated,
      page = 1,
      limit = 10
    } = filters

    // Construir condiciones de filtro
    const where: {
      type?: string
      role?: string
      validated?: boolean
      deletedAt?: null
    } = {
      deletedAt: null // Solo usuarios no eliminados
    }
    
    if (type) {
      where.type = type
    }
    
    if (role) {
      where.role = role
    }
    
    if (validated !== undefined) {
      where.validated = validated
    }

    // Usar la función de paginación centralizada
    return await executePaginatedQuery(
      (options) => prisma.user.findMany({
        where: where as Prisma.UserWhereInput,
        select: {
          id: true,
          name: true,
          email: true,
          rut: true,
          phone: true,
          type: true,
          role: true,
          validated: true,
          company: true,
          createdAt: true
        },
        orderBy: {
          createdAt: "desc"
        },
        ...options
      }),
      () => prisma.user.count({ where: where as Prisma.UserWhereInput }),
      { page, limit }
    )
  }

  // Obtener usuarios pendientes de validación
  static async getPendingUsers() {
    return await prisma.user.findMany({
      where: {
        validated: false,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        rut: true,
        phone: true,
        type: true,
        role: true,
        validated: true,
        company: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  }

  // Obtener usuario por ID con información completa
  static async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { 
        id: userId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        rut: true,
        phone: true,
        type: true,
        role: true,
        validated: true,
        company: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        activityLogs: {
          select: {
            id: true,
            action: true,
            description: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })
  }

  // Validar usuario
  static async validateUser(userId: string, validatedBy: string) {
    return await prisma.$transaction(async (tx) => {
      // Actualizar estado de validación
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { 
          validated: true,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          validated: true
        }
      })

      // Log de actividad
      await tx.activityLog.create({
        data: {
          userId: userId,
          action: "user_validated",
          description: `Usuario validado por administrador`,
          metadata: {
            validatedBy,
            validatedAt: new Date().toISOString()
          }
        }
      })

      return updatedUser
    })
  }

  // Toggle validación de usuario
  static async toggleUserValidation(userId: string, validatedBy: string) {
    return await prisma.$transaction(async (tx) => {
      // Obtener usuario actual
      const user = await tx.user.findUnique({
        where: { 
          id: userId,
          deletedAt: null
        },
        select: { validated: true, name: true }
      })

      if (!user) {
        throw new Error("Usuario no encontrado")
      }

      const newValidationStatus = !user.validated

      // Actualizar estado de validación
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { 
          validated: newValidationStatus,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          validated: true
        }
      })

      // Log de actividad
      await tx.activityLog.create({
        data: {
          userId: userId,
          action: newValidationStatus ? "user_validated" : "user_unvalidated",
          description: `Usuario ${newValidationStatus ? 'validado' : 'invalidado'} por administrador`,
          metadata: {
            validatedBy,
            previousStatus: user.validated,
            newStatus: newValidationStatus,
            changedAt: new Date().toISOString()
          }
        }
      })

      return updatedUser
    })
  }

  // Asignar rol a usuario
  static async assignRole(userId: string, role: "ADMIN" | "VENDEDOR", assignedBy: string) {
    return await prisma.$transaction(async (tx) => {
      // Verificar que el usuario existe
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true }
      })

      if (!user) {
        throw new Error("Usuario no encontrado")
      }

      // Actualizar rol
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { 
          role,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      })

      // Log de actividad
      await tx.activityLog.create({
        data: {
          userId: userId,
          action: "role_assigned",
          description: `Rol asignado: ${role}`,
          metadata: {
            assignedBy,
            previousRole: user.role,
            newRole: role,
            assignedAt: new Date().toISOString()
          }
        }
      })

      return updatedUser
    })
  }

  // Eliminar rol de usuario
  static async removeRole(userId: string, removedBy: string) {
    return await prisma.$transaction(async (tx) => {
      // Verificar que el usuario existe
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true }
      })

      if (!user) {
        throw new Error("Usuario no encontrado")
      }

      // Actualizar rol a null
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { 
          role: undefined,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      })

      // Log de actividad
      await tx.activityLog.create({
        data: {
          userId: userId,
          action: "role_removed",
          description: `Rol eliminado`,
          metadata: {
            removedBy,
            previousRole: user.role,
            removedAt: new Date().toISOString()
          }
        }
      })

      return updatedUser
    })
  }

  // Obtener usuarios con roles
  static async getUsersWithRoles() {
    return await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "VENDEDOR"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        validated: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  }

  // Obtener actividad del usuario
  static async getUserActivity(userId: string, limit: number = 50) {
    return await prisma.activityLog.findMany({
      where: { userId },
      select: {
        id: true,
        action: true,
        description: true,
        metadata: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  }

  // Buscar usuarios por término
  static async searchUsers(searchTerm: string, limit: number = 20) {
    return await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { rut: { contains: searchTerm, mode: 'insensitive' } },
          { company: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        rut: true,
        type: true,
        role: true,
        validated: true,
        company: true
      },
      orderBy: {
        name: 'asc'
      },
      take: limit
    })
  }

  // Obtener estadísticas de usuarios
  static async getUserStats() {
    const [
      totalUsers,
      validatedUsers,
      pendingUsers,
      empresaUsers,
      naturalUsers,
      adminUsers
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { validated: true, deletedAt: null } }),
      prisma.user.count({ where: { validated: false, deletedAt: null } }),
      prisma.user.count({ where: { type: 'EMPRESA', deletedAt: null } }),
      prisma.user.count({ where: { type: 'NATURAL', deletedAt: null } }),
      prisma.user.count({ where: { role: 'ADMIN', deletedAt: null } })
    ])

    return {
      totalUsers,
      validatedUsers,
      pendingUsers,
      empresaUsers,
      naturalUsers,
      adminUsers
    }
  }

  // ============ SOFT DELETE METHODS ============

  /**
   * Soft delete de usuario (eliminación lógica)
   */
  static async softDeleteUser(userId: string, deletedBy?: string): Promise<void> {
    await this.softDeleteService.softDeleteUser(userId, deletedBy)
    
    // Log de actividad
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "user_soft_deleted",
        description: `Usuario eliminado (soft delete)`,
        metadata: {
          deletedBy,
          deletedAt: new Date().toISOString()
        }
      }
    })
  }

  /**
   * Restaurar usuario eliminado
   */
  static async restoreUser(userId: string, restoredBy?: string): Promise<void> {
    await this.softDeleteService.restoreUser(userId)
    
    // Log de actividad
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "user_restored",
        description: `Usuario restaurado desde eliminación lógica`,
        metadata: {
          restoredBy,
          restoredAt: new Date().toISOString()
        }
      }
    })
  }

  /**
   * Obtener usuarios eliminados
   */
  static async getDeletedUsers() {
    return await prisma.user.findMany({
      where: {
        deletedAt: { not: null }
      },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        role: true,
        deletedAt: true,
        createdAt: true
      },
      orderBy: {
        deletedAt: 'desc'
      }
    })
  }

  // ============ OPTIMISTIC LOCKING METHODS ============

  /**
   * Actualizar usuario con verificación de versión
   */
  static async updateUserWithVersion(
    userId: string,
    version: number,
    data: {
      name?: string
      email?: string
      phone?: string
      company?: string
      businessType?: string
      billingAddress?: string
      shippingAddress?: string
    },
    updatedBy?: string
  ): Promise<void> {
    try {
      await this.optimisticLockingService.updateUserWithVersion(userId, version, data)
      
      // Log de actividad
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: "user_updated",
          description: `Usuario actualizado con verificación de versión`,
          metadata: {
            updatedBy,
            updatedFields: Object.keys(data),
            updatedAt: new Date().toISOString()
          }
        }
      })
    } catch (error) {
      throw new Error(`Error actualizando usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  /**
   * Obtener usuario con versión actual
   */
  static async getUserWithVersion(userId: string) {
    return await prisma.user.findUnique({
      where: { 
        id: userId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true,
        role: true,
        validated: true,
        company: true,
        businessType: true,
        billingAddress: true,
        shippingAddress: true,
        version: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }

  /**
   * Validar usuario con verificación de versión
   */
  static async validateUserWithVersion(
    userId: string, 
    version: number, 
    validatedBy: string
  ): Promise<void> {
    await this.optimisticLockingService.updateUserWithVersion(
      userId, 
      version, 
      { 
        validated: true
      }
    )

    // Log de actividad
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "user_validated_with_version",
        description: `Usuario validado con verificación de versión`,
        metadata: {
          validatedBy,
          validatedAt: new Date().toISOString()
        }
      }
    })
  }
}
