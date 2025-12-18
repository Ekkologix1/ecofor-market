// ============================================
// USE CASE: CreateUserUseCase
// Caso de uso para crear un nuevo usuario
// ============================================

import { injectable, inject } from 'tsyringe'
import { User, Email, UserRepository } from '@/domain'
import { CreateUserDto, UserResponseDto } from '../dto/UserDto'

@injectable()
export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    // Validar que el email no exista
    const email = new Email(dto.email)
    const existingUser = await this.userRepository.findByEmail(email)
    
    if (existingUser) {
      throw new Error('El email ya está registrado')
    }

    // Crear el usuario
    const user = User.create({
      name: dto.name,
      email: dto.email,
      role: dto.role,
      type: dto.type,
      validated: false // Los usuarios nuevos no están validados por defecto
    })

    // Guardar en el repositorio
    await this.userRepository.save(user)

    // Retornar DTO de respuesta
    return this.toUserResponseDto(user)
  }

  private toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id.getValue(),
      name: user.name,
      email: user.email,
      role: user.role,
      type: user.type,
      validated: user.validated,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }
}
