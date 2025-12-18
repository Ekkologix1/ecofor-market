// ============================================
// DEPENDENCY INJECTION CONTAINER
// Configuración de inyección de dependencias con tsyringe
// ============================================

import 'reflect-metadata'
import { container } from 'tsyringe'
import { PrismaClient } from '@prisma/client'

// Repositories
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository'
import { UserRepository } from '@/domain/repositories/UserRepository'

// Use Cases
import { CreateUserUseCase } from '@/application/use-cases/CreateUserUseCase'
import { GetUserUseCase } from '@/application/use-cases/GetUserUseCase'
import { ValidateUserUseCase } from '@/application/use-cases/ValidateUserUseCase'

// Controllers
import { UserController } from '@/presentation/api/UserController'

// ============================================
// REGISTRO DE DEPENDENCIAS
// ============================================

// 1. Registro de instancias singleton
container.registerSingleton(PrismaClient)

// 2. Registro de repositorios
container.register<UserRepository>('UserRepository', {
  useClass: PrismaUserRepository
})

// 3. Registro de Use Cases con dependencias
container.register(CreateUserUseCase, {
  useFactory: (dependencyContainer) => {
    const userRepository = dependencyContainer.resolve<UserRepository>('UserRepository')
    return new CreateUserUseCase(userRepository)
  }
})

container.register(GetUserUseCase, {
  useFactory: (dependencyContainer) => {
    const userRepository = dependencyContainer.resolve<UserRepository>('UserRepository')
    return new GetUserUseCase(userRepository)
  }
})

container.register(ValidateUserUseCase, {
  useFactory: (dependencyContainer) => {
    const userRepository = dependencyContainer.resolve<UserRepository>('UserRepository')
    return new ValidateUserUseCase(userRepository)
  }
})

// 4. Registro de Controladores
container.register(UserController, {
  useFactory: (dependencyContainer) => {
    const createUserUseCase = dependencyContainer.resolve(CreateUserUseCase)
    const getUserUseCase = dependencyContainer.resolve(GetUserUseCase)
    const validateUserUseCase = dependencyContainer.resolve(ValidateUserUseCase)
    return new UserController(createUserUseCase, getUserUseCase, validateUserUseCase)
  }
})

// ============================================
// FUNCIONES HELPER
// ============================================

export const getContainer = () => container

export const getUserController = () => container.resolve(UserController)

export const getCreateUserUseCase = () => container.resolve(CreateUserUseCase)

export const getGetUserUseCase = () => container.resolve(GetUserUseCase)

export const getValidateUserUseCase = () => container.resolve(ValidateUserUseCase)

// Función para limpiar el contenedor (útil para tests)
export const clearContainer = () => {
  container.clearInstances()
}

export default container
