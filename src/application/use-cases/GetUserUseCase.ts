// ============================================
// USE CASE: GetUserUseCase
// Caso de uso para obtener un usuario por ID
// ============================================

import { injectable, inject } from 'tsyringe'
import { User, UserRepository, UserId } from '@/domain'
import { UserResponseDto } from '../dto/UserDto'

@injectable()
export class GetUserUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(userId: string): Promise<UserResponseDto | null> {
    const userIdVO = new UserId(userId)
    const user = await this.userRepository.findById(userIdVO)
    
    if (!user) {
      return null
    }

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
