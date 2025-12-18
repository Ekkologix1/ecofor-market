// src/lib/progressStore.ts

interface UploadData {
  status: 'starting' | 'reading' | 'validating' | 'processing' | 'uploading' | 'completed' | 'error' | 'cancelled' | 'analysis_complete'
  progress: number
  message: string
  currentBatch: number
  totalBatches: number
  processedProducts: number
  totalProducts: number
  errors: string[]
  startTime: number
  userId?: string
  fileName?: string
  lastActivity: number
}

export class ProgressStore {
  private static instance: ProgressStore
  private uploads: Map<string, UploadData> = new Map()
  private listeners: Map<string, (data: UploadData) => void> = new Map()
  private cancellationTokens: Map<string, boolean> = new Map()
  private readonly MAX_UPLOADS = 100
  private readonly CLEANUP_INTERVAL = 60000 // 1 minuto
  private readonly MAX_AGE = 3600000 // 1 hora

  private constructor() {
    // Limpieza automática periódica
    setInterval(() => this.autoCleanup(), this.CLEANUP_INTERVAL)
  }

  static getInstance(): ProgressStore {
    if (!ProgressStore.instance) {
      ProgressStore.instance = new ProgressStore()
    }
    return ProgressStore.instance
  }

  createUpload(uploadId: string, userId?: string, fileName?: string) {
    if (!this.isValidUploadId(uploadId)) {
      throw new Error(`Invalid uploadId format: ${uploadId}`)
    }

    // Limpiar automáticamente si hay demasiados uploads
    if (this.uploads.size >= this.MAX_UPLOADS) {
      this.forceCleanup()
    }

    this.uploads.set(uploadId, {
      status: 'starting',
      progress: 0,
      message: 'Iniciando procesamiento...',
      currentBatch: 0,
      totalBatches: 0,
      processedProducts: 0,
      totalProducts: 0,
      errors: [],
      startTime: Date.now(),
      userId: userId,
      fileName: fileName,
      lastActivity: Date.now()
    })
    this.cancellationTokens.set(uploadId, false)
    console.log(`[PROGRESS STORE] Upload creado: ${uploadId} (usuario: ${userId}, archivo: ${fileName})`)
  }

  updateProgress(uploadId: string, update: Partial<UploadData>): boolean {
    const current = this.uploads.get(uploadId)
    if (!current) {
      console.log(`[PROGRESS STORE] Upload no encontrado: ${uploadId}`)
      return false
    }

    // Verificar si está cancelado
    if (this.cancellationTokens.get(uploadId)) {
      console.log(`[PROGRESS STORE] Upload cancelado, ignorando actualización: ${uploadId}`)
      return false
    }

    const updated = { 
      ...current, 
      ...update,
      progress: update.progress !== undefined ? Math.min(update.progress, 100) : current.progress,
      lastActivity: Date.now()
    }
    this.uploads.set(uploadId, updated)
    
    // Notificar a listeners
    const listener = this.listeners.get(uploadId)
    if (listener) {
      try {
        listener(updated)
        console.log(`[PROGRESS STORE] Progreso enviado: ${updated.progress}% - ${updated.message}`)
      } catch (error) {
        console.error('[PROGRESS STORE] Error notificando listener:', error)
      }
    } else {
      console.log(`[PROGRESS STORE] No hay listener para ${uploadId}, progreso: ${updated.progress}%`)
    }
    return true
  }

  // Verificar si un upload está cancelado
  isCancelled(uploadId: string): boolean {
    const cancelled = this.cancellationTokens.get(uploadId)
    return cancelled === true
  }

  // Cancelar un upload
  cancelUpload(uploadId: string, userId?: string): boolean {
    const upload = this.uploads.get(uploadId)
    if (!upload) {
      console.log(`[PROGRESS STORE] Upload no encontrado para cancelar: ${uploadId}`)
      return false
    }

    // Verificar permisos si se proporciona userId
    if (userId && upload.userId !== userId) {
      console.log(`[PROGRESS STORE] Usuario ${userId} no autorizado para cancelar ${uploadId}`)
      return false
    }

    // Marcar como cancelado
    this.cancellationTokens.set(uploadId, true)
    
    // Actualizar estado a cancelado
    this.updateProgress(uploadId, {
      status: 'cancelled',
      message: 'Operación cancelada por el usuario'
    })

    // LIMPIEZA INMEDIATA para evitar que aparezca en getActiveUploads
    setTimeout(() => {
      this.uploads.delete(uploadId)
      this.listeners.delete(uploadId)
      this.cancellationTokens.delete(uploadId)
      console.log(`[PROGRESS STORE] Limpieza inmediata completada para upload cancelado: ${uploadId}`)
    }, 1000) // 1 segundo de delay para que el SSE tenga tiempo de enviar el mensaje de cancelación

    console.log(`[PROGRESS STORE] Upload cancelado: ${uploadId}`)
    return true
  }

  // Obtener uploads activos para un usuario
  getActiveUploads(userId?: string): Array<{ uploadId: string } & UploadData> {
    const activeUploads: Array<{ uploadId: string } & UploadData> = []
    
    for (const [uploadId, upload] of this.uploads.entries()) {
      // Solo incluir uploads del usuario si se especifica
      if (userId && upload.userId !== userId) {
        continue
      }

      // EXCLUIR uploads cancelados, completados o con errores
      if (['completed', 'error', 'cancelled'].includes(upload.status)) {
        continue
      }

      // EXCLUIR uploads que están marcados como cancelados
      if (this.cancellationTokens.get(uploadId)) {
        continue
      }

      // Solo incluir uploads que están procesando
      if (['starting', 'reading', 'validating', 'processing', 'uploading', 'analysis_complete'].includes(upload.status)) {
        activeUploads.push({
          uploadId,
          ...upload
        })
      }
    }

    return activeUploads
  }

  subscribe(uploadId: string, callback: (data: UploadData) => void) {
    this.listeners.set(uploadId, callback)
    console.log(`[PROGRESS STORE] Cliente suscrito a ${uploadId}`)
    
    // Enviar datos existentes inmediatamente si los hay
    const existing = this.uploads.get(uploadId)
    if (existing) {
      console.log(`[PROGRESS STORE] Enviando datos existentes: ${existing.progress}%`)
      try {
        callback(existing)
      } catch (error) {
        console.error('[PROGRESS STORE] Error enviando datos existentes:', error)
      }
    }
  }

  unsubscribe(uploadId: string) {
    this.listeners.delete(uploadId)
    console.log(`[PROGRESS STORE] Cliente desuscrito de ${uploadId}`)
  }

  getProgress(uploadId: string) {
    return this.uploads.get(uploadId)
  }

  cleanup(uploadId: string) {
    setTimeout(() => {
      this.uploads.delete(uploadId)
      this.listeners.delete(uploadId)
      this.cancellationTokens.delete(uploadId)
      console.log(`[PROGRESS STORE] Limpieza completada para ${uploadId}`)
    }, 30000)
  }

  // Validar formato de uploadId
  private isValidUploadId(uploadId: string): boolean {
    return typeof uploadId === 'string' && uploadId.length > 0 && uploadId.startsWith('upload_')
  }

  // Limpieza forzada cuando hay demasiados uploads
  private forceCleanup() {
    console.log('[PROGRESS STORE] Forzando limpieza por límite de uploads')
    const now = Date.now()
    let cleaned = 0

    for (const [uploadId, upload] of this.uploads.entries()) {
      // Eliminar uploads completados o con más de 30 minutos
      if (upload.status === 'completed' || upload.status === 'error' || 
          upload.status === 'cancelled' || now - upload.lastActivity > 1800000) {
        this.uploads.delete(uploadId)
        this.listeners.delete(uploadId)
        this.cancellationTokens.delete(uploadId)
        cleaned++
      }
    }

    console.log(`[PROGRESS STORE] Limpieza forzada completada: ${cleaned} uploads eliminados`)
  }

  // Limpieza automática de uploads antiguos
  private autoCleanup() {
    const now = Date.now()
    let cleaned = 0

    for (const [uploadId, upload] of this.uploads.entries()) {
      if (now - upload.lastActivity > this.MAX_AGE) {
        console.log(`[PROGRESS STORE] Limpiando upload antiguo: ${uploadId}`)
        this.uploads.delete(uploadId)
        this.listeners.delete(uploadId)
        this.cancellationTokens.delete(uploadId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[PROGRESS STORE] Limpieza automática: ${cleaned} uploads eliminados`)
    }
  }

  // Método de debug para inspeccionar el estado
  getDebugInfo() {
    return {
      totalUploads: this.uploads.size,
      totalListeners: this.listeners.size,
      totalCancellationTokens: this.cancellationTokens.size,
      uploads: Array.from(this.uploads.entries()).map(([id, upload]) => ({
        id,
        status: upload.status,
        progress: upload.progress,
        userId: upload.userId,
        fileName: upload.fileName
      }))
    }
  }
}