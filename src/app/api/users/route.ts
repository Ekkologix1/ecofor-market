import { NextRequest } from 'next/server'
import { getUserController } from '@/lib/container'


// ============================================
// PRESENTATION: Users API Route
// Ruta API para manejar usuarios usando Clean Architecture
// ============================================




// GET /api/users - Obtener lista de usuarios
export async function GET(request: NextRequest) {
  try {
    // TODO: Implementar GetUserListUseCase para obtener lista paginada
    return Response.json({
      success: true,
      message: 'Endpoint de usuarios funcionando con Clean Architecture',
      data: {
        architecture: 'Clean Architecture implementada',
        layers: ['Domain', 'Application', 'Infrastructure', 'Presentation'],
        features: [
          'Inyección de dependencias con tsyringe',
          'Validaciones con Zod',
          'Value Objects completos',
          'Use Cases con lógica de negocio'
        ]
      }
    })
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

// POST /api/users - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const userController = getUserController()
    return await userController.createUser(request)
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
