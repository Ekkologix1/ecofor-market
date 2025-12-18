// ================================
// HANDLER PRINCIPAL PARA UPLOAD STOCK
// ================================

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions, prisma } from '@/lib'
import { ProgressStore } from '@/lib/progressStore'
import { parseFile, convertToProducts, analyzeFileIntent } from './file-parser'
import { 
  getExistingProducts, 
  processSyncAllMode, 
  processUpdateOnlyMode, 
  processAddOnlyMode 
} from './product-processor'
import { CONFIG, ERROR_MESSAGES } from './config'
import { OperationMode, StockUploadMetadata } from './types'

/**
 * Valida el archivo subido
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Verificar tamaño
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    return { valid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE }
  }
  
  // Verificar tipo de archivo
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !CONFIG.ALLOWED_FILE_TYPES.includes(fileExtension)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE }
  }
  
  return { valid: true }
}

/**
 * Valida los permisos del usuario
 */
function validateUserPermissions(session: any): { valid: boolean; error?: string } {
  if (!session) {
    return { valid: false, error: 'No autorizado - Sesión requerida' }
  }
  
  const hasAccess = session.user?.role === 'ADMIN' || session.user?.role === 'VENDEDOR'
  if (!hasAccess) {
    return { valid: false, error: 'No autorizado - Permisos insuficientes' }
  }
  
  return { valid: true }
}

/**
 * Maneja la carga de stock
 */
export async function handleStockUpload(
  request: NextRequest, 
  session?: { user: { id: string; validated: boolean } }
) {
  const startTime = Date.now()
  let uploadId: string | null = null
  
  try {
    // Validar sesión (ya validada por withCSRFProtection)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }
    
    const permissionCheck = validateUserPermissions(session)
    if (!permissionCheck.valid) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      )
    }
    
    // Obtener datos del formulario
    const formData = await request.formData()
    const file = formData.get('file') as File
    const operationMode = formData.get('operationMode') as OperationMode
    const confirmOperation = formData.get('confirmOperation') as string
    
    // Reutilizar uploadId existente o crear uno nuevo
    uploadId = formData.get('uploadId') as string || `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Validar archivo
    const fileValidation = validateFile(file)
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      )
    }
    
    // Validar modo de operación
    if (!operationMode || !['sync_all', 'update_only', 'add_only', 'analyze_only'].includes(operationMode)) {
      return NextResponse.json(
        { error: 'Modo de operación no válido' },
        { status: 400 }
      )
    }
    
    // Inicializar progreso
    const progressStore = ProgressStore.getInstance()
    progressStore.updateProgress(uploadId, {
      status: 'starting',
      progress: 0,
      message: 'Iniciando procesamiento...',
      startTime,
      fileName: file.name
    })
    
    // Actualizar progreso
    progressStore.updateProgress(uploadId, {
      status: 'processing',
      progress: 10,
      message: 'Parseando archivo...'
    })
    
    // Parsear archivo
    const excelData = await parseFile(file)
    const productsToUpdate = convertToProducts(excelData)
    
    if (productsToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron productos válidos en el archivo' },
        { status: 400 }
      )
    }
    
    // Actualizar progreso
    progressStore.updateProgress(uploadId, {
      status: 'processing',
      progress: 20,
      message: 'Analizando datos...'
    })
    
    // Análisis previo
    const analysis = analyzeFileIntent(productsToUpdate)
    
    // Actualizar progreso
    progressStore.updateProgress(uploadId, {
      status: 'processing',
      progress: 30,
      message: 'Obteniendo productos existentes...'
    })
    
    // Obtener productos existentes
    const existingProducts = await getExistingProducts()
    
    // Obtener categoría por defecto
    const defaultCategory = await prisma.category.findFirst({
      where: { name: "Papelería Institucional" }
    })
    
    // Actualizar progreso
    progressStore.updateProgress(uploadId, {
      status: 'processing',
      progress: 50,
      message: `Procesando en modo ${operationMode}...`
    })
    
    // Procesar según el modo
    let result
    switch (operationMode) {
      case 'analyze_only':
        // Solo análisis, no procesar - retornar análisis inmediatamente
        const existingSkus = new Set(existingProducts.map(p => p.sku))
        const productsToCreate = productsToUpdate.filter(p => !existingSkus.has(p.codigo))
        const productsToUpdateExisting = productsToUpdate.filter(p => existingSkus.has(p.codigo))
        const productsInSystemNotInFile = existingProducts.filter(p => !productsToUpdate.some(fp => fp.codigo === p.sku))
        
        return NextResponse.json({
          requiresDecision: true,
          uploadId,
          analysis: {
            fileStats: {
              totalRows: productsToUpdate.length,
              validRows: productsToUpdate.length,
              duplicates: [],
              invalidRows: []
            },
            impactAnalysis: {
              productsToCreate: productsToCreate.map(p => ({ sku: p.codigo, name: p.nombre, stock: p.stock })),
              productsToUpdate: productsToUpdateExisting.map(p => {
                const existing = existingProducts.find(ep => ep.sku === p.codigo)
                return { 
                  sku: p.codigo, 
                  name: p.nombre, 
                  currentStock: existing?.stock || 0, 
                  newStock: p.stock 
                }
              }),
              productsToDelete: productsInSystemNotInFile.map(p => ({ 
                sku: p.sku, 
                name: p.name, 
                currentStock: p.stock 
              })),
              warnings: []
            },
            fileAnalysis: {
              operationMode: 'sync_all' as const,
              confidence: 0.8,
              suggestions: [],
              stats: {
                existingInFile: productsToUpdateExisting.length,
                newInFile: productsToCreate.length,
                missingFromFile: productsInSystemNotInFile.length,
                totalInSystem: existingProducts.length,
                overlapPercentage: productsToUpdateExisting.length / existingProducts.length
              },
              recommendations: {
                suggestedMode: 'sync_all' as const,
                reasoning: 'El archivo contiene tanto productos existentes como nuevos',
                risks: []
              }
            }
          },
          message: 'Análisis completado exitosamente',
          stats: {
            fileProducts: productsToUpdate.length,
            systemProducts: existingProducts.length,
            toCreate: productsToCreate.length,
            toUpdate: productsToUpdateExisting.length,
            toDelete: productsInSystemNotInFile.length
          }
        })
        
      case 'sync_all':
        result = await processSyncAllMode(productsToUpdate, existingProducts, defaultCategory?.id)
        break
      case 'update_only':
        result = await processUpdateOnlyMode(productsToUpdate, existingProducts)
        break
      case 'add_only':
        result = await processAddOnlyMode(productsToUpdate, existingProducts, defaultCategory?.id)
        break
      default:
        throw new Error('Modo de operación no válido')
    }
    
    const processingTime = Date.now() - startTime
    
    // Crear metadata
    const metadata: StockUploadMetadata = {
      fileName: file.name,
      totalRows: productsToUpdate.length,
      updatedCount: result.stats.updated,
      createdCount: result.stats.created,
      deletedCount: result.stats.deleted,
      errorsCount: analysis.errors.length,
      duplicatesCount: analysis.duplicates,
      processingTimeMs: processingTime,
      batchSize: CONFIG.BATCH_SIZE,
      operationType: operationMode,
      operationMode,
      cancelled: result.cancelled
    }
    
    // Registrar en activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'stock_upload',
        description: `Carga en modo ${operationMode}: ${result.stats.updated} actualizados, ${result.stats.created} creados, ${result.stats.deleted} eliminados en ${(processingTime / 1000).toFixed(1)}s`,
        metadata
      }
    })
    
    // Actualizar progreso final
    progressStore.updateProgress(uploadId, {
      status: 'completed',
      progress: 100,
      message: 'Procesamiento completado'
    })
    
    // Retornar resultado
    return NextResponse.json({
      success: true,
      message: result.message,
      stats: {
        ...result.stats,
        processingTimeSeconds: Math.round(processingTime / 1000)
      },
      preview: result.preview,
      warnings: result.warnings,
      uploadId
    })
    
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    console.error("Error processing stock upload:", error)
    
    // Actualizar progreso con error si tenemos uploadId
    if (uploadId) {
      try {
        const progressStore = ProgressStore.getInstance()
        progressStore.updateProgress(uploadId, {
          status: 'error',
          message: 'Error interno del servidor'
        })
      } catch (progressError) {
        console.error('Error updating progress in catch:', progressError)
      }
    }
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        processingTimeSeconds: Math.round(processingTimeMs / 1000)
      },
      { status: 500 }
    )
  }
}

/**
 * Obtiene estadísticas de uploads
 */
export async function getUploadStats() {
  try {
    const session = await getServerSession(authOptions)
    
    const hasAccess = session?.user?.role === 'ADMIN' || session?.user?.role === 'VENDEDOR'
    if (!session || !hasAccess) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }
    
    const totalProducts = await prisma.product.count()
    
    const lastUpload = await prisma.activityLog.findFirst({
      where: { action: 'stock_upload' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } }
      }
    })
    
    const monthlyUploads = await prisma.activityLog.count({
      where: {
        action: 'stock_upload',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
    
    const lowStockProductsCount = await prisma.product.count({
      where: {
        OR: [
          { stock: { lte: 5 } },
          { stock: 0 }
        ],
        active: true
      }
    })
    
    return NextResponse.json({
      totalProducts,
      lastUpload: lastUpload ? {
        date: lastUpload.createdAt,
        user: lastUpload.user.name,
        description: lastUpload.description
      } : null,
      monthlyUploads,
      lowStockProductsCount
    })
    
  } catch (error) {
    console.error('Error getting upload stats:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
