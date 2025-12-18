// ============================================
// PRESENTATION: UserController
// Controlador para manejar las peticiones HTTP de usuarios
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { injectable, inject } from 'tsyringe'
import { CreateUserUseCase, GetUserUseCase, ValidateUserUseCase, CreateUserDto, UserResponseDto } from '@/application'
import { 
  validateCreateUser, 
  validateUpdateUser, 
  validateUserParams, 
  validateUserValidation,
  formatValidationError 
} from '../../application/schemas/UserSchemas'

@injectable()
export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private validateUserUseCase: ValidateUserUseCase
  ) {}

  async createUser(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json()
      
      // Validar datos de entrada con Zod
      const validatedData = validateCreateUser(body)
      const createUserDto: CreateUserDto = validatedData

      const user = await this.createUserUseCase.execute(createUserDto)

      return NextResponse.json(
        { 
          success: true, 
          data: user,
          message: 'Usuario creado exitosamente' 
        },
        { status: 201 }
      )
    } catch (error) {
      // Manejar errores de validación de Zod
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Datos de entrada inválidos',
            validationErrors: formatValidationError(error as any)
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Error interno del servidor' 
        },
        { status: 400 }
      )
    }
  }

  async getUserById(userId: string): Promise<NextResponse> {
    try {
      // Validar parámetros
      const validatedParams = validateUserParams({ userId })
      
      const user = await this.getUserUseCase.execute(validatedParams.userId)

      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Usuario no encontrado' 
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { 
          success: true, 
          data: user 
        },
        { status: 200 }
      )
    } catch (error) {
      // Manejar errores de validación de Zod
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Parámetros inválidos',
            validationErrors: formatValidationError(error as any)
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Error interno del servidor' 
        },
        { status: 500 }
      )
    }
  }

  async validateUser(userId: string, validated: boolean): Promise<NextResponse> {
    try {
      // Validar parámetros
      const validatedParams = validateUserParams({ userId })
      const validatedData = validateUserValidation({ validated })
      
      const user = await this.validateUserUseCase.execute(
        validatedParams.userId, 
        validatedData.validated
      )

      return NextResponse.json(
        { 
          success: true, 
          data: user,
          message: `Usuario ${validated ? 'validado' : 'invalidado'} exitosamente` 
        },
        { status: 200 }
      )
    } catch (error) {
      // Manejar errores de validación de Zod
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Datos de entrada inválidos',
            validationErrors: formatValidationError(error as any)
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Error interno del servidor' 
        },
        { status: 400 }
      )
    }
  }
}