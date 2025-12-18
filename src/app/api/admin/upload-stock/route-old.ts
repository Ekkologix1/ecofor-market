









import { authOptions, withCSRFProtection, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { ProgressStore } from "@/lib/progressStore"
import * as XLSX from 'xlsx'

// ================================
// INTERFACES Y TIPOS
// ================================

interface StockUploadMetadata {
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

interface ProductToUpdate {
  codigo: string
  nombre: string
  stock: number
  rowNumber: number
}

interface ExcelRow {
  [key: string]: string | number | undefined
}

interface ExistingProduct {
  id: string
  sku: string
  name: string
  stock: number
  minStock: number | null
}

interface FileAnalysis {
  operationMode: 'sync_all' | 'update_only' | 'add_only'
  confidence: number
  suggestions: string[]
  stats: {
    existingInFile: number
    newInFile: number
    missingFromFile: number
    totalInSystem: number
    overlapPercentage: number
  }
  recommendations: {
    suggestedMode: 'sync_all' | 'update_only' | 'add_only'
    reasoning: string
    risks: string[]
  }
}

interface PreProcessAnalysis {
  fileStats: {
    totalRows: number
    validRows: number
    duplicates: string[]
    invalidRows: string[]
  }
  impactAnalysis: {
    productsToCreate: Array<{sku: string, name: string, stock: number}>
    productsToUpdate: Array<{sku: string, name: string, currentStock: number, newStock: number}>
    productsToDelete: Array<{sku: string, name: string, currentStock: number}>
    warnings: string[]
  }
  fileAnalysis: FileAnalysis
}

// ================================
// CONFIGURACIÓN DEL SISTEMA
// ================================

const CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  MAX_PRODUCTS: 200000,
  BATCH_SIZE: 200,
  TRANSACTION_TIMEOUT: 45000,
  MAX_STOCK_PER_PRODUCT: 9999999,
  REQUEST_TIMEOUT: 30 * 60 * 1000,
  MAX_RETRIES: 3,
  DELETION_THRESHOLD: 10,
  DELETION_BATCH_SIZE: 50,
  OVERLAP_THRESHOLD_SYNC: 0.7,
  OVERLAP_THRESHOLD_UPDATE: 0.3,
  PROGRESS_UPDATE_INTERVAL: 50, // Actualizar progreso cada 50 productos
  CANCELLATION_CHECK_INTERVAL: 1 // Verificar cancelación cada 100 productos
}

// ================================
// FUNCIONES DE ANÁLISIS INTELIGENTE
// ================================

function analyzeFileIntent(
  fileProducts: string[], 
  systemProducts: ExistingProduct[]
): FileAnalysis {
  const systemSkus = systemProducts.map(p => p.sku)
  const fileSkusSet = new Set(fileProducts)
  const systemSkusSet = new Set(systemSkus)
  
  const existingInFile = fileProducts.filter(sku => systemSkusSet.has(sku)).length
  const newInFile = fileProducts.filter(sku => !systemSkusSet.has(sku)).length
  const missingFromFile = systemSkus.filter(sku => !fileSkusSet.has(sku)).length
  
  const overlapPercentage = systemSkus.length > 0 ? existingInFile / systemSkus.length : 0
  
  let suggestedMode: 'sync_all' | 'update_only' | 'add_only'
  let reasoning: string
  let confidence: number
    const risks: string[] = []
  
  if (overlapPercentage >= CONFIG.OVERLAP_THRESHOLD_SYNC) {
    suggestedMode = 'sync_all'
    confidence = 0.8 + (overlapPercentage - CONFIG.OVERLAP_THRESHOLD_SYNC) * 0.2
    reasoning = `El archivo contiene ${Math.round(overlapPercentage * 100)}% de los productos existentes, sugiriendo una sincronización completa.`
    
    if (missingFromFile > 0) {
      risks.push(`Se eliminarían ${missingFromFile} productos que no están en el archivo`)
    }
  } else if (overlapPercentage >= CONFIG.OVERLAP_THRESHOLD_UPDATE) {
    suggestedMode = 'update_only'
    confidence = 0.6 + (overlapPercentage - CONFIG.OVERLAP_THRESHOLD_UPDATE) * 0.4
    reasoning = `El archivo contiene ${Math.round(overlapPercentage * 100)}% de productos existentes, sugiriendo una actualización parcial.`
    
    if (newInFile > 0) {
      risks.push(`${newInFile} productos nuevos no se crearían en modo 'solo actualizar'`)
    }
  } else {
    suggestedMode = 'add_only'
    confidence = 0.7
    reasoning = `El archivo contiene principalmente productos nuevos (${Math.round(overlapPercentage * 100)}% overlap con existentes).`
    
    if (existingInFile > 0) {
      risks.push(`${existingInFile} productos existentes no se actualizarían en modo 'solo agregar'`)
    }
  }
  
  const suggestions = [
    `Productos en archivo: ${fileProducts.length}`,
    `Productos en sistema: ${systemSkus.length}`,
    `Coincidencias: ${existingInFile} (${Math.round(overlapPercentage * 100)}%)`,
    `Nuevos: ${newInFile}`,
    `Faltantes en archivo: ${missingFromFile}`
  ]
  
  return {
    operationMode: suggestedMode,
    confidence,
    suggestions,
    stats: {
      existingInFile,
      newInFile,
      missingFromFile,
      totalInSystem: systemSkus.length,
      overlapPercentage
    },
    recommendations: {
      suggestedMode,
      reasoning,
      risks
    }
  }
}

async function performPreProcessAnalysis(
  productsToUpdate: ProductToUpdate[],
  errors: string[],
  systemProducts: ExistingProduct[]
): Promise<PreProcessAnalysis> {
  const fileSkus = productsToUpdate.map(p => p.codigo)
  const systemProductsMap = new Map(systemProducts.map(p => [p.sku, p]))
  
  const productsToCreate: Array<{sku: string, name: string, stock: number}> = []
  const productsToUpdate_impact: Array<{sku: string, name: string, currentStock: number, newStock: number}> = []
  const productsToDelete: Array<{sku: string, name: string, currentStock: number}> = []
  
  for (const product of productsToUpdate) {
    const existing = systemProductsMap.get(product.codigo)
    if (existing) {
      productsToUpdate_impact.push({
        sku: product.codigo,
        name: product.nombre,
        currentStock: existing.stock,
        newStock: product.stock
      })
    } else {
      productsToCreate.push({
        sku: product.codigo,
        name: product.nombre,
        stock: product.stock
      })
    }
  }
  
  const fileSkusSet = new Set(fileSkus)
  for (const systemProduct of systemProducts) {
    if (!fileSkusSet.has(systemProduct.sku)) {
      productsToDelete.push({
        sku: systemProduct.sku,
        name: systemProduct.name,
        currentStock: systemProduct.stock
      })
    }
  }
  
  const warnings: string[] = []
  if (productsToDelete.length > CONFIG.DELETION_THRESHOLD) {
    warnings.push(`ATENCIÓN: ${productsToDelete.length} productos serían eliminados en modo 'Sincronizar Todo'`)
  }
  if (productsToCreate.length > 100) {
    warnings.push(`Se crearían ${productsToCreate.length} productos nuevos`)
  }
  if (errors.length > 0) {
    warnings.push(`${errors.length} filas tienen errores de formato`)
  }
  
  const fileAnalysis = analyzeFileIntent(fileSkus, systemProducts)
  
  return {
    fileStats: {
      totalRows: productsToUpdate.length,
      validRows: productsToUpdate.length,
      duplicates: [],
      invalidRows: errors
    },
    impactAnalysis: {
      productsToCreate,
      productsToUpdate: productsToUpdate_impact,
      productsToDelete,
      warnings
    },
    fileAnalysis
  }
}

// ================================
// FUNCIONES AUXILIARES
// ================================

async function createNewProduct(product: ProductToUpdate, defaultCategoryId?: string) {
  const slug = product.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100)

  let categoryIdToUse = defaultCategoryId
  
  if (!categoryIdToUse) {
    const anyCategory = await prisma.category.findFirst({
      select: { id: true }
    })
    
    if (anyCategory) {
      categoryIdToUse = anyCategory.id
    } else {
      const defaultCategory = await prisma.category.create({
        data: {
          name: "Sin Categoría",
          slug: "sin-categoria",
          description: "Productos sin categoría asignada",
          order: 999,
          active: true
        }
      })
      categoryIdToUse = defaultCategory.id
    }
  }

  return await prisma.product.create({
    data: {
      sku: product.codigo,
      name: product.nombre,
      slug: `${slug}-${product.codigo.toLowerCase()}`,
      description: `Producto ${product.nombre} con código ${product.codigo}`,
      shortDescription: product.nombre.substring(0, 150),
      stock: product.stock,
      minStock: 5,
      maxStock: 9999,
      basePrice: 1000,
      wholesalePrice: 900,
      categoryId: categoryIdToUse,
      brand: 'Sin marca',
      unit: 'unidad',
      active: true,
      featured: false
    }
  })
}

async function deleteProductsWithRelations(
  productIds: string[], 
  progressStore: ProgressStore, 
  uploadId: string
): Promise<number> {
  let totalDeleted = 0
  const batchSize = CONFIG.DELETION_BATCH_SIZE
  
  for (let i = 0; i < productIds.length; i += batchSize) {
    // VERIFICAR CANCELACIÓN ANTES DE CADA LOTE DE ELIMINACIÓN
    if (progressStore.isCancelled(uploadId)) {
      // Operación cancelada por el usuario
      break
    }

    const batch = productIds.slice(i, i + batchSize)
    
    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({
          where: { productId: { in: batch } }
        })
        
        await tx.orderItem.deleteMany({
          where: { productId: { in: batch } }
        })
        
        const deleteResult = await tx.product.deleteMany({
          where: { id: { in: batch } }
        })
        
        return deleteResult.count
      }, {
        timeout: 30000
      })
      
      totalDeleted += result
      
      // Actualizar progreso de eliminación
      const deleteProgress = 90 + ((i + batchSize) / productIds.length) * 5
      progressStore.updateProgress(uploadId, {
        progress: Math.min(deleteProgress, 95),
        message: `Eliminando productos: ${Math.min(i + batchSize, productIds.length)}/${productIds.length}`
      })
      
    } catch (error) {
      // Error eliminando lote, intentando soft delete
      
      const softDeleteResult = await prisma.product.updateMany({
        where: { id: { in: batch } },
        data: { active: false, updatedAt: new Date() }
      })
      
      totalDeleted += softDeleteResult.count
    }
  }
  
  return totalDeleted
}

// ================================
// FUNCIÓN DE PROCESAMIENTO CON PROGRESO GRANULAR
// ================================

async function processWithMode(
  mode: 'sync_all' | 'update_only' | 'add_only',
  productsToUpdate: ProductToUpdate[],
  systemProducts: ExistingProduct[],
  analysis: PreProcessAnalysis,
  uploadId: string,
  progressStore: ProgressStore,
  userId: string,
  fileName: string,
  startTime: number
) {
  const existingProductsMap = new Map(systemProducts.map(p => [p.sku, p]))
  
  // Obtener categoría por defecto
  const defaultCategory = await prisma.category.findFirst({
    where: { name: "Papelería Institucional" }
  })

  let updatedCount = 0
  let createdCount = 0
  let deletedCount = 0
  const updateResults: Array<{
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
  }> = []
  const warnings: string[] = []

  // Progreso base: 50% (ya completamos análisis)
  const baseProgress = 50
  const processingRange = 45 // Del 50% al 95%

  // Iniciando procesamiento de stock

  // PROGRESO INICIAL
  progressStore.updateProgress(uploadId, {
    status: 'processing',
    progress: baseProgress,
    message: `Iniciando procesamiento en modo: ${mode}...`,
    totalProducts: productsToUpdate.length,
    processedProducts: 0
  })

  switch (mode) {
    case 'sync_all':
      // Procesar productos existentes y nuevos
      for (let i = 0; i < productsToUpdate.length; i++) {
        // VERIFICAR CANCELACIÓN cada 100 productos
        if (i % CONFIG.CANCELLATION_CHECK_INTERVAL === 0 && progressStore.isCancelled(uploadId)) {
          // Operación cancelada por el usuario
          return {
            cancelled: true,
            message: 'Operación cancelada por el usuario',
            stats: {
              totalProcessed: i,
              updated: updatedCount,
              created: createdCount,
              deleted: deletedCount,
              processingTimeSeconds: Math.round((Date.now() - startTime) / 1000)
            },
            preview: updateResults,
            warnings: [...warnings, 'Operación cancelada por el usuario']
          }
        }

        const product = productsToUpdate[i]
        
        // ACTUALIZAR PROGRESO cada 50 productos
        if (i % CONFIG.PROGRESS_UPDATE_INTERVAL === 0 || i === productsToUpdate.length - 1) {
          const progress = baseProgress + (i / productsToUpdate.length) * (processingRange * 0.8)
          progressStore.updateProgress(uploadId, {
            status: 'processing',
            progress: Math.round(progress),
            message: `Procesando productos: ${(i + 1).toLocaleString()}/${productsToUpdate.length.toLocaleString()}`,
            processedProducts: i + 1,
            totalProducts: productsToUpdate.length
          })
          // Progreso actualizado
        }
        
        const existing = existingProductsMap.get(product.codigo)
        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: { stock: product.stock, updatedAt: new Date() }
          })
          updatedCount++
          
          if (updateResults.length < 20) {
            updateResults.push({
              sku: product.codigo,
              action: 'updated' as const,
              message: `Producto ${product.nombre} actualizado`,
              codigo: product.codigo,
              nombre: product.nombre,
              stockAnterior: existing.stock,
              stockNuevo: product.stock,
              diferencia: product.stock - existing.stock,
              accion: 'actualizado'
            })
          }
        } else {
          await createNewProduct(product, defaultCategory?.id)
          createdCount++
          
          if (updateResults.length < 20) {
            updateResults.push({
              sku: product.codigo,
              action: 'created' as const,
              message: `Producto ${product.nombre} creado`,
              codigo: product.codigo,
              nombre: product.nombre,
              stockAnterior: 0,
              stockNuevo: product.stock,
              diferencia: product.stock,
              accion: 'creado'
            })
          }
        }
      }
      
      // Eliminar productos no presentes en el archivo
      const fileSkusSet = new Set(productsToUpdate.map(p => p.codigo))
      const productsToDelete = systemProducts.filter(p => !fileSkusSet.has(p.sku))
      
      if (productsToDelete.length > 0) {
        progressStore.updateProgress(uploadId, {
          status: 'processing',
          progress: 90,
          message: `Eliminando ${productsToDelete.length.toLocaleString()} productos...`
        })
        
        deletedCount = await deleteProductsWithRelations(
          productsToDelete.map(p => p.id), 
          progressStore, 
          uploadId
        )
      }
      break

    case 'update_only':
      // Solo actualizar productos existentes
      for (let i = 0; i < productsToUpdate.length; i++) {
        // VERIFICAR CANCELACIÓN
        if (i % CONFIG.CANCELLATION_CHECK_INTERVAL === 0 && progressStore.isCancelled(uploadId)) {
          // Operación cancelada por el usuario
          return {
            cancelled: true,
            message: 'Operación cancelada por el usuario',
            stats: {
              totalProcessed: i,
              updated: updatedCount,
              created: createdCount,
              deleted: deletedCount,
              processingTimeSeconds: Math.round((Date.now() - startTime) / 1000)
            },
            preview: updateResults,
            warnings: [...warnings, 'Operación cancelada por el usuario']
          }
        }

        const product = productsToUpdate[i]
        
        // ACTUALIZAR PROGRESO cada 50 productos
        if (i % CONFIG.PROGRESS_UPDATE_INTERVAL === 0 || i === productsToUpdate.length - 1) {
          const progress = baseProgress + (i / productsToUpdate.length) * processingRange
          progressStore.updateProgress(uploadId, {
            status: 'processing',
            progress: Math.round(progress),
            message: `Actualizando productos: ${(i + 1).toLocaleString()}/${productsToUpdate.length.toLocaleString()}`,
            processedProducts: i + 1,
            totalProducts: productsToUpdate.length
          })
          // Progreso actualizado
        }
        
        const existing = existingProductsMap.get(product.codigo)
        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: { stock: product.stock, updatedAt: new Date() }
          })
          updatedCount++
          
          if (updateResults.length < 20) {
            updateResults.push({
              sku: product.codigo,
              action: 'updated' as const,
              message: `Producto ${product.nombre} actualizado`,
              codigo: product.codigo,
              nombre: product.nombre,
              stockAnterior: existing.stock,
              stockNuevo: product.stock,
              diferencia: product.stock - existing.stock,
              accion: 'actualizado'
            })
          }
        } else {
          if (updateResults.length < 20) {
            updateResults.push({
              sku: product.codigo,
              action: 'error' as const,
              message: `Producto ${product.nombre} no encontrado`,
              codigo: product.codigo,
              nombre: product.nombre,
              stockAnterior: 0,
              stockNuevo: product.stock,
              diferencia: 0,
              accion: 'no_encontrado'
            })
          }
        }
      }
      
      const notFoundCount = productsToUpdate.length - updatedCount
      if (notFoundCount > 0) {
        warnings.push(`${notFoundCount.toLocaleString()} productos no se encontraron en el sistema y no fueron creados`)
      }
      break

    case 'add_only':
      // Actualizar existentes y crear nuevos
      for (let i = 0; i < productsToUpdate.length; i++) {
        // VERIFICAR CANCELACIÓN
        if (i % CONFIG.CANCELLATION_CHECK_INTERVAL === 0 && progressStore.isCancelled(uploadId)) {
          // Operación cancelada por el usuario
          return {
            cancelled: true,
            message: 'Operación cancelada por el usuario',
            stats: {
              totalProcessed: i,
              updated: updatedCount,
              created: createdCount,
              deleted: deletedCount,
              processingTimeSeconds: Math.round((Date.now() - startTime) / 1000)
            },
            preview: updateResults,
            warnings: [...warnings, 'Operación cancelada por el usuario']
          }
        }

        const product = productsToUpdate[i]
        
        // ACTUALIZAR PROGRESO cada 50 productos
        if (i % CONFIG.PROGRESS_UPDATE_INTERVAL === 0 || i === productsToUpdate.length - 1) {
          const progress = baseProgress + (i / productsToUpdate.length) * processingRange
          progressStore.updateProgress(uploadId, {
            status: 'processing',
            progress: Math.round(progress),
            message: `Procesando productos: ${(i + 1).toLocaleString()}/${productsToUpdate.length.toLocaleString()}`,
            processedProducts: i + 1,
            totalProducts: productsToUpdate.length
          })
          // Progreso actualizado
        }
        
        const existing = existingProductsMap.get(product.codigo)
        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: { stock: product.stock, updatedAt: new Date() }
          })
          updatedCount++
          
          if (updateResults.length < 20) {
            updateResults.push({
              sku: product.codigo,
              action: 'updated' as const,
              message: `Producto ${product.nombre} actualizado`,
              codigo: product.codigo,
              nombre: product.nombre,
              stockAnterior: existing.stock,
              stockNuevo: product.stock,
              diferencia: product.stock - existing.stock,
              accion: 'actualizado'
            })
          }
        } else {
          await createNewProduct(product, defaultCategory?.id)
          createdCount++
          
          if (updateResults.length < 20) {
            updateResults.push({
              sku: product.codigo,
              action: 'created' as const,
              message: `Producto ${product.nombre} creado`,
              codigo: product.codigo,
              nombre: product.nombre,
              stockAnterior: 0,
              stockNuevo: product.stock,
              diferencia: product.stock,
              accion: 'creado'
            })
          }
        }
      }
      break
  }

  // PROGRESO FINAL
  progressStore.updateProgress(uploadId, {
    status: 'processing',
    progress: 95,
    message: 'Finalizando procesamiento...'
  })

  // Registrar en logs
  const processingTime = Date.now() - startTime
  const metadata: StockUploadMetadata = {
    fileName,
    totalRows: productsToUpdate.length,
    updatedCount,
    createdCount,
    deletedCount,
    errorsCount: 0,
    duplicatesCount: 0,
    processingTimeMs: processingTime,
    batchSize: CONFIG.BATCH_SIZE,
    operationType: mode,
    operationMode: mode,
    cancelled: false
  }

  await prisma.activityLog.create({
    data: {
      userId,
      action: 'stock_upload',
      description: `Carga en modo ${mode}: ${updatedCount.toLocaleString()} actualizados, ${createdCount.toLocaleString()} creados, ${deletedCount.toLocaleString()} eliminados en ${(processingTime / 1000).toFixed(1)}s`,
      metadata
    }
  })

  // Procesamiento completado

  return {
    cancelled: false,
    message: `Procesamiento en modo ${mode} completado: ${updatedCount.toLocaleString()} actualizados, ${createdCount.toLocaleString()} creados`,
    stats: {
      totalProcessed: productsToUpdate.length,
      updated: updatedCount,
      created: createdCount,
      deleted: deletedCount,
      processingTimeSeconds: Math.round(processingTime / 1000)
    },
    preview: updateResults,
    warnings
  }
}

// ================================
// ENDPOINT PRINCIPAL POST
// ================================

async function uploadStockHandler(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)

      const hasAccess = session?.user?.role === 'ADMIN' || session?.user?.role === 'VENDEDOR'
      if (!session || !hasAccess) {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        )
      }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const operationMode = formData.get('operationMode') as string
    const confirmOperation = formData.get('confirmOperation') as string
    
    // REUTILIZAR uploadId existente o crear uno nuevo
    let uploadId = formData.get('uploadId') as string
    if (!uploadId) {
      uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    const progressStore = ProgressStore.getInstance()
    
    if (!file) {
      return NextResponse.json(
        { error: "No se encontró archivo", uploadId },
        { status: 400 }
      )
    }

    // Inicializar progreso solo si es nueva operación (análisis)
    if (!operationMode || operationMode === 'analyze') {
      progressStore.createUpload(uploadId, session.user.id, file.name)
      // Nuevo upload creado
    } else {
      // Continuando upload existente
    }

    // Validar tipo y tamaño de archivo
    if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
      progressStore.updateProgress(uploadId, {
        status: 'error',
        message: 'Formato de archivo no válido'
      })
      return NextResponse.json(
        { error: "Formato de archivo no válido. Use .xlsx o .xls", uploadId },
        { status: 400 }
      )
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      progressStore.updateProgress(uploadId, {
        status: 'error',
        message: 'Archivo demasiado grande'
      })
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Máximo ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB permitido`, uploadId },
        { status: 400 }
      )
    }

    // Iniciando procesamiento de archivo

    progressStore.updateProgress(uploadId, {
      status: 'reading',
      progress: 5,
      message: 'Leyendo archivo Excel...'
    })

    // ================================
    // LECTURA Y VALIDACIÓN DEL EXCEL
    // ================================

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const data = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[]

    if (!data || data.length === 0) {
      progressStore.updateProgress(uploadId, {
        status: 'error',
        message: 'Archivo vacío o formato incorrecto'
      })
      return NextResponse.json(
        { error: "El archivo está vacío o no tiene el formato correcto", uploadId },
        { status: 400 }
      )
    }

    if (data.length > CONFIG.MAX_PRODUCTS) {
      progressStore.updateProgress(uploadId, {
        status: 'error',
        message: 'Demasiadas filas en el archivo'
      })
      return NextResponse.json(
        { error: `El archivo tiene demasiadas filas. Máximo ${CONFIG.MAX_PRODUCTS.toLocaleString()} productos por carga`, uploadId },
        { status: 400 }
      )
    }

    // Archivo leído exitosamente

    progressStore.updateProgress(uploadId, {
      progress: 15,
      message: 'Validando estructura del archivo...',
      totalProducts: data.length
    })

    // Validar estructura
    const requiredColumns = ['codigo', 'nombre', 'stock']
    const firstRow = data[0] as ExcelRow
    const hasRequiredColumns = requiredColumns.every(col => 
      Object.keys(firstRow).some(key => 
        key.toLowerCase().includes(col) || col.includes(key.toLowerCase())
      )
    )

    if (!hasRequiredColumns) {
      progressStore.updateProgress(uploadId, {
        status: 'error',
        message: 'Estructura de archivo incorrecta'
      })
      return NextResponse.json(
        { error: "El archivo debe contener columnas: Código, Nombre, Stock", uploadId },
        { status: 400 }
      )
    }

    // ================================
    // PROCESAMIENTO Y VALIDACIÓN DE DATOS
    // ================================

    const productsToUpdate: ProductToUpdate[] = []
    const errors: string[] = []
    
    // Iniciando validación de productos
    
    progressStore.updateProgress(uploadId, {
      progress: 20,
      message: `Validando ${data.length.toLocaleString()} productos...`
    })
    
    for (let i = 0; i < data.length; i++) {
      // VERIFICAR CANCELACIÓN DURANTE VALIDACIÓN
      if (i % 1000 === 0 && progressStore.isCancelled(uploadId)) {
        // Validación cancelada por el usuario
        return NextResponse.json(
          { error: "Operación cancelada por el usuario", uploadId },
          { status: 400 }
        )
      }

      const row = data[i] as ExcelRow
      const rowNumber = i + 2
      
      if (i % 1000 === 0) {
        const validationProgress = 20 + (i / data.length) * 15
        progressStore.updateProgress(uploadId, {
          progress: validationProgress,
          message: `Validando productos: ${i.toLocaleString()}/${data.length.toLocaleString()}`
        })
      }
      
      const codigo = Object.entries(row).find(([key]) => 
        key.toLowerCase().includes('codigo') || key.toLowerCase().includes('code')
      )?.[1]
      
      const nombre = Object.entries(row).find(([key]) => 
        key.toLowerCase().includes('nombre') || key.toLowerCase().includes('name')
      )?.[1]
      
      const stock = Object.entries(row).find(([key]) => 
        key.toLowerCase().includes('stock') || key.toLowerCase().includes('cantidad')
      )?.[1]

      if (!codigo || !nombre || stock === undefined || stock === null) {
        errors.push(`Fila ${rowNumber}: Datos faltantes`)
        continue
      }

      const codigoTrimmed = String(codigo).trim()
      if (!codigoTrimmed) {
        errors.push(`Fila ${rowNumber}: Código no puede estar vacío`)
        continue
      }

      const stockNumber = parseInt(String(stock))
      if (isNaN(stockNumber) || stockNumber < 0) {
        errors.push(`Fila ${rowNumber}: Stock debe ser un número válido (≥ 0)`)
        continue
      }

      if (stockNumber > CONFIG.MAX_STOCK_PER_PRODUCT) {
        errors.push(`Fila ${rowNumber}: Stock demasiado alto (máximo ${CONFIG.MAX_STOCK_PER_PRODUCT.toLocaleString()})`)
        continue
      }

      productsToUpdate.push({
        codigo: codigoTrimmed.toUpperCase(),
        nombre: String(nombre).trim(),
        stock: stockNumber,
        rowNumber
      })
    }

    // Validación completada

    // Validar duplicados
    progressStore.updateProgress(uploadId, {
      progress: 35,
      message: 'Verificando duplicados...'
    })

    const codigoCount = new Map<string, number[]>()
    const duplicateErrors: string[] = []
    
    productsToUpdate.forEach((product) => {
      const codigo = product.codigo
      if (!codigoCount.has(codigo)) {
        codigoCount.set(codigo, [])
      }
      codigoCount.get(codigo)!.push(product.rowNumber)
    })
    
    codigoCount.forEach((rows, codigo) => {
      if (rows.length > 1) {
        duplicateErrors.push(`Código "${codigo}" duplicado en filas: ${rows.join(', ')}`)
      }
    })
    
    if (duplicateErrors.length > 0) {
      progressStore.updateProgress(uploadId, {
        status: 'error',
        message: 'Códigos duplicados encontrados'
      })
      return NextResponse.json(
        { 
          error: "Se encontraron códigos duplicados en el archivo",
          details: duplicateErrors.slice(0, 50),
          uploadId
        },
        { status: 400 }
      )
    }

    if (errors.length > 0 && productsToUpdate.length === 0) {
      progressStore.updateProgress(uploadId, {
        status: 'error',
        message: 'No se pudieron procesar los datos'
      })
      return NextResponse.json(
        { error: "No se pudieron procesar los datos", details: errors.slice(0, 50), uploadId },
        { status: 400 }
      )
    }

    // ================================
    // ANÁLISIS INTELIGENTE DEL ARCHIVO
    // ================================

    progressStore.updateProgress(uploadId, {
      progress: 40,
      message: 'Analizando contenido del archivo...'
    })

    const systemProducts = await prisma.product.findMany({
      select: { id: true, sku: true, name: true, stock: true, minStock: true },
      orderBy: { sku: 'asc' }
    })

    const analysis = await performPreProcessAnalysis(productsToUpdate, errors, systemProducts)

    // Si no se ha especificado modo de operación, devolver análisis
    if (!operationMode || operationMode === 'analyze') {
      progressStore.updateProgress(uploadId, {
        status: 'analysis_complete',
        progress: 45,
        message: 'Análisis completado - esperando decisión del usuario'
      })

      const responseData = {
        requiresDecision: true,
        uploadId,
        analysis,
        message: "Archivo analizado correctamente. Selecciona el modo de operación.",
        stats: {
          fileProducts: productsToUpdate.length,
          systemProducts: systemProducts.length,
          toCreate: analysis.impactAnalysis.productsToCreate.length,
          toUpdate: analysis.impactAnalysis.productsToUpdate.length,
          toDelete: analysis.impactAnalysis.productsToDelete.length
        }
      }

      // Enviando respuesta de análisis al cliente

      return NextResponse.json(responseData)
    }

    // ================================
    // PROCESAMIENTO SEGÚN MODO SELECCIONADO
    // ================================

    const validModes = ['sync_all', 'update_only', 'add_only']
    if (!validModes.includes(operationMode)) {
      return NextResponse.json(
        { error: "Modo de operación no válido", uploadId },
        { status: 400 }
      )
    }

    // Verificar confirmación para operaciones riesgosas
    if (operationMode === 'sync_all' && analysis.impactAnalysis.productsToDelete.length > CONFIG.DELETION_THRESHOLD) {
      if (confirmOperation !== 'true') {
        return NextResponse.json({
          requiresConfirmation: true,
          operationMode,
          uploadId,
          warning: `Esta operación eliminará ${analysis.impactAnalysis.productsToDelete.length.toLocaleString()} productos del sistema.`,
          analysis,
          message: "Confirma la eliminación de productos."
        })
      }
    }

    // Procesando upload en modo seleccionado

    // Procesar según el modo seleccionado
    const result = await processWithMode(
      operationMode as 'sync_all' | 'update_only' | 'add_only',
      productsToUpdate,
      systemProducts,
      analysis,
      uploadId,
      progressStore,
      session.user.id,
      file.name,
      startTime
    )

    // Si fue cancelado, devolver respuesta de cancelación
    if (result.cancelled) {
      progressStore.updateProgress(uploadId, {
        status: 'cancelled',
        progress: result.stats.totalProcessed ? 
          Math.round((result.stats.totalProcessed / productsToUpdate.length) * 100) : 0,
        message: 'Operación cancelada por el usuario'
      })

      progressStore.cleanup(uploadId)

      return NextResponse.json({
        success: false,
        cancelled: true,
        operationMode,
        message: result.message,
        stats: result.stats,
        preview: result.preview,
        warnings: result.warnings,
        uploadId
      })
    }

    // PROGRESO FINAL DE ÉXITO
    progressStore.updateProgress(uploadId, {
      status: 'completed',
      progress: 100,
      message: `Procesamiento completado: ${result.message}`
    })

    progressStore.cleanup(uploadId)

    return NextResponse.json({
      success: true,
      operationMode,
      message: result.message,
      stats: result.stats,
      preview: result.preview,
      warnings: result.warnings,
      uploadId
    })

  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    console.error("Error processing stock upload:", error)
    
    // Solo actualizar progreso si tenemos uploadId
    try {
      const formData = await request.formData()
      const uploadId = formData.get('uploadId') as string
      
      if (uploadId) {
        const progressStore = ProgressStore.getInstance()
        progressStore.updateProgress(uploadId, {
          status: 'error',
          message: 'Error interno del servidor'
        })
      }
    } catch (formError) {
      console.error('Error accessing formData in catch:', formError)
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

// ================================
// ENDPOINT GET
// ================================

export async function GET() {
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
        ]
      }
    })

    return NextResponse.json({
      totalProducts,
      lowStockProducts: lowStockProductsCount,
      lastUpload: lastUpload ? {
        date: lastUpload.createdAt,
        user: lastUpload.user.name,
        count: (lastUpload.metadata as unknown as StockUploadMetadata)?.updatedCount || 0,
        processingTime: (lastUpload.metadata as unknown as StockUploadMetadata)?.processingTimeMs 
          ? `${((lastUpload.metadata as unknown as StockUploadMetadata).processingTimeMs! / 1000).toFixed(1)}s`
          : undefined
      } : null,
      monthlyUploads,
      config: {
        maxFileSize: `${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
        maxProducts: CONFIG.MAX_PRODUCTS.toLocaleString(),
        maxStockPerProduct: CONFIG.MAX_STOCK_PER_PRODUCT.toLocaleString(),
        batchSize: CONFIG.BATCH_SIZE
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function POST(request: NextRequest, context: { params: Promise<{}> }) {
  const withCSRF = withCSRFProtection(uploadStockHandler, { requireAuth: true })
  return await withCSRF(request)
}