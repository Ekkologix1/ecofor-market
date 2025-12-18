// ================================
// TIPOS E INTERFACES PARA UPLOAD STOCK
// ================================

export interface StockUploadMetadata {
  fileName: string
  totalRows: number
  updatedCount: number
  createdCount: number
  deletedCount?: number
  errorsCount: number
  duplicatesCount: number
  notFoundCount?: number
  lowStockCount?: number
  processingTimeMs?: number
  batchSize?: number
  operationType: 'sync_all' | 'update_only' | 'add_only' | 'mass_deletion'
  operationMode: string
  cancelled?: boolean
  [key: string]: string | number | boolean | undefined
}

export interface ProductToUpdate {
  codigo: string
  nombre: string
  stock: number
  rowNumber: number
}

export interface ExcelRow {
  [key: string]: string | number | undefined
}

export interface ExistingProduct {
  id: string
  sku: string
  name: string
  stock: number
  active: boolean
  categoryId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface PreProcessAnalysis {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicates: number
  newProducts: number
  existingProducts: number
  lowStockProducts: number
  errors: Array<{
    row: number
    message: string
    data?: any
  }>
  warnings: Array<{
    row: number
    message: string
    data?: any
  }>
}

export interface UploadProgress {
  uploadId: string
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled'
  progress: number
  message: string
  startTime: number
  fileName?: string
  metadata?: Partial<StockUploadMetadata>
}

export interface UploadResult {
  cancelled: boolean
  message: string
  stats: {
    totalProcessed: number
    updated: number
    created: number
    deleted: number
    processingTimeSeconds: number
  }
  preview: Array<{
    sku: string
    action: 'created' | 'updated' | 'deleted' | 'error'
    message: string
    productId?: string
    codigo?: string
    nombre?: string
    stockAnterior?: number
    stockNuevo?: number
    diferencia?: number
    accion?: string
  }>
  warnings: string[]
}

export interface UploadConfig {
  BATCH_SIZE: number
  MAX_FILE_SIZE: number
  ALLOWED_FILE_TYPES: string[]
  PROGRESS_UPDATE_INTERVAL: number
  TIMEOUT_MS: number
}

export type OperationMode = 'sync_all' | 'update_only' | 'add_only' | 'mass_deletion' | 'analyze_only'
