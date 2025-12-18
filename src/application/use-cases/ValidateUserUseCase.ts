// ============================================
// USE CASE: ValidateUserUseCase
// Caso de uso para validar/invalidar un usuario
// ============================================

import { injectable, inject } from 'tsyringe'
import { User, UserId, UserRepository } from '@/domain'
import { UserResponseDto } from '../dto/UserDto'

@injectable()
export class ValidateUserUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(userId: string, validated: boolean): Promise<UserResponseDto> {
    const userIdVO = new UserId(userId)
    const user = await this.userRepository.findById(userIdVO)
    
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    // Aplicar la validación usando el método del dominio
    if (validated) {
      user.validate()
    } else {
      user.unvalidate()
    }

    // Guardar los cambios
    await this.userRepository.save(user)

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
