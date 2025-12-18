import { authOptions } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { ProgressStore } from "@/lib/progressStore"




// src/app/api/admin/upload-stock/active/route.ts






export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const progressStore = ProgressStore.getInstance()
    const activeUploads = progressStore.getActiveUploads(session.user.id)

    return NextResponse.json({
      activeUploads: activeUploads.map(upload => ({
        uploadId: upload.uploadId,
        status: upload.status,
        progress: upload.progress,
        message: upload.message,
        startTime: upload.startTime,
        fileName: upload.fileName || 'Archivo desconocido'
      }))
    })

  } catch (error) {
    console.error('Error getting active uploads:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Nuevo endpoint para cancelar uploads
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const uploadId = searchParams.get('uploadId')

    if (!uploadId) {
      return NextResponse.json(
        { error: "Upload ID requerido" },
        { status: 400 }
      )
    }

    const progressStore = ProgressStore.getInstance()
    const cancelled = progressStore.cancelUpload(uploadId, session.user.id)

    if (cancelled) {
      return NextResponse.json({ 
        success: true, 
        message: "Upload cancelado exitosamente" 
      })
    } else {
      return NextResponse.json(
        { error: "Upload no encontrado o no se pudo cancelar" },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error cancelling upload:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}