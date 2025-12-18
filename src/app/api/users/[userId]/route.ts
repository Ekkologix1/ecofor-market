import { NextRequest } from 'next/server'
import { getUserController } from '@/lib/container'


// ============================================
// PRESENTATION: User by ID API Route
// Ruta API para manejar usuarios específicos usando Clean Architecture
// ============================================





// GET /api/users/[userId] - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userController = getUserController()
    const { userId } = await params
    return await userController.getUserById(userId)
  } catch (error) {
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}

// PUT /api/users/[userId] - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const body = await request.json()
    const { userId } = await params
    
    // Si se está enviando validación
    if (typeof body.validated === 'boolean') {
      const userController = getUserController()
      return await userController.validateUser(userId, body.validated)
    }
    
    // Para otras actualizaciones, podrías implementar un UpdateUserUseCase
    return Response.json(
      { 
        success: false, 
        error: 'Funcionalidad de actualización no implementada aún' 
      },
      { status: 501 }
    )
  } catch (error) {
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
