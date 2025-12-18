import { authOptions } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { ProgressStore } from "@/lib/progressStore"




// src/app/api/admin/upload-stock/progress/route.ts






export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

const hasAccess = session?.user?.role === 'ADMIN' || session?.user?.role === 'VENDEDOR'
if (!session || !hasAccess) {
  return new NextResponse("No autorizado", { status: 401 })
}

    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get('uploadId')

    if (!uploadId) {
      return new NextResponse("Upload ID requerido", { status: 400 })
    }

    console.log(`[SSE] Nueva conexión para uploadId: ${uploadId}`)

    const progressStore = ProgressStore.getInstance()

    // Crear el stream de SSE
    let isConnected = true
    
    const stream = new ReadableStream({
      start(controller) {
        console.log(`[SSE] Stream iniciado para ${uploadId}`)
        
        // Enviar datos iniciales si existen
        const initialData = progressStore.getProgress(uploadId)
        if (initialData) {
          const message = `data: ${JSON.stringify(initialData)}\n\n`
          controller.enqueue(new TextEncoder().encode(message))
          console.log(`[SSE] Datos iniciales enviados: ${initialData.progress}% - ${initialData.message}`)
        } else {
          // Enviar datos por defecto
          const defaultData = {
            status: 'starting',
            progress: 0,
            message: 'Conectando...',
            startTime: Date.now()
          }
          const message = `data: ${JSON.stringify(defaultData)}\n\n`
          controller.enqueue(new TextEncoder().encode(message))
          console.log(`[SSE] Datos por defecto enviados`)
        }

        // Suscribirse a actualizaciones
        progressStore.subscribe(uploadId, (data) => {
          if (!isConnected) return
          
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(new TextEncoder().encode(message))
            console.log(`[SSE] Progreso enviado al cliente: ${data.progress}% - ${data.message}`)
            
            // Cerrar stream si está completado o hay error
            if (data.status === 'completed' || data.status === 'error') {
              setTimeout(() => {
                if (isConnected) {
                  controller.close()
                  isConnected = false
                  progressStore.unsubscribe(uploadId)
                  console.log(`[SSE] Stream cerrado para ${uploadId}`)
                }
              }, 2000)
            }
          } catch (error) {
            console.error(`[SSE] Error enviando actualización:`, error)
          }
        })

        // Manejar desconexión del cliente
        request.signal?.addEventListener('abort', () => {
          console.log(`[SSE] Cliente desconectado: ${uploadId}`)
          isConnected = false
          progressStore.unsubscribe(uploadId)
          try {
            controller.close()
          } catch (error) {
            console.error('Error cerrando controller:', error)
          }
        })
      },
      
      cancel() {
        console.log(`[SSE] Stream cancelado para ${uploadId}`)
        isConnected = false
        progressStore.unsubscribe(uploadId)
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'X-Accel-Buffering': 'no' // Para nginx
      }
    })

  } catch (error) {
    console.error('Error en SSE progress endpoint:', error)
    return new NextResponse("Error interno del servidor", { status: 500 })
  }
}