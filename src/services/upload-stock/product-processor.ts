// ================================
// PROCESADOR DE PRODUCTOS PARA UPLOAD STOCK
// ================================

import { prisma } from '@/lib/db'
import { ProductToUpdate, ExistingProduct, UploadResult } from './types'
import { CONFIG } from './config'

/**
 * Obtiene todos los productos existentes del sistema
 */
export async function getExistingProducts(): Promise<ExistingProduct[]> {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      stock: true,
      active: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true
    },
    where: {
      active: true
    }
  })
  
  return products.map(p => ({
    ...p,
    stock: Number(p.stock)
  }))
}

/**
 * Crea un nuevo producto
 */
export async function createNewProduct(
  product: ProductToUpdate, 
  defaultCategoryId: string
): Promise<{ success: boolean; productId?: string; message: string }> {
  try {
    // Generar slug único basado en el nombre
    const slug = product.nombre
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
      + '-' + product.codigo.toLowerCase()
    
    const newProduct = await prisma.product.create({
      data: {
        sku: product.codigo,
        name: product.nombre,
        slug: slug,
        categoryId: defaultCategoryId,
        stock: product.stock,
        active: true,
        basePrice: 0, // Precio por defecto
        wholesalePrice: 0, // Precio por defecto
        minStock: 5, // Stock mínimo por defecto
        unit: "unidad", // Unidad por defecto
        images: [], // Array vacío de imágenes
        tags: [] // Array vacío de tags
      }
    })
    
    return {
      success: true,
      productId: newProduct.id,
      message: 'Producto creado exitosamente'
    }
  } catch (error) {
    console.error('Error creating product:', error)
    return {
      success: false,
      message: `Error al crear producto: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Actualiza un producto existente
 */
export async function updateExistingProduct(
  existingProduct: ExistingProduct,
  newStock: number
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        stock: newStock,
        updatedAt: new Date()
      }
    })
    
    return {
      success: true,
      message: 'Producto actualizado exitosamente'
    }
  } catch (error) {
    console.error('Error updating product:', error)
    return {
      success: false,
      message: `Error al actualizar producto: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Elimina productos con sus relaciones
 */
export async function deleteProductsWithRelations(
  productIds: string[]
): Promise<number> {
  const batchSize = CONFIG.BATCH_SIZE
  let totalDeleted = 0
  
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize)
    
    try {
      // Soft delete del producto
      const softDeleteResult = await prisma.product.updateMany({
        where: { id: { in: batch } },
        data: { 
          active: false, 
          updatedAt: new Date() 
        }
      })
      
      totalDeleted += softDeleteResult.count
    } catch (error) {
      console.error(`Error deleting batch ${i}-${i + batchSize}:`, error)
    }
  }
  
  return totalDeleted
}

/**
 * Procesa productos en modo sincronización completa
 */
export async function processSyncAllMode(
  productsToUpdate: ProductToUpdate[],
  existingProducts: ExistingProduct[],
  defaultCategoryId?: string
): Promise<UploadResult> {
  const existingProductsMap = new Map(existingProducts.map(p => [p.sku, p]))
  const productsToCreate = new Map<string, ProductToUpdate>()
  const productsToUpdateMap = new Map<string, { existing: ExistingProduct; new: ProductToUpdate }>()
  
  // Clasificar productos
  productsToUpdate.forEach(product => {
    const existing = existingProductsMap.get(product.codigo)
    if (existing) {
      if (existing.stock !== product.stock) {
        productsToUpdateMap.set(product.codigo, { existing, new: product })
      }
    } else {
      productsToCreate.set(product.codigo, product)
    }
  })
  
  // Identificar productos a eliminar (existen en el sistema pero no en el archivo)
  const fileSkus = new Set(productsToUpdate.map(p => p.codigo))
  const productsToDelete = existingProducts.filter(p => !fileSkus.has(p.sku))
  
  let createdCount = 0
  let updatedCount = 0
  let deletedCount = 0
  const preview: UploadResult['preview'] = []
  const warnings: string[] = []
  
  // Crear nuevos productos
  for (const product of productsToCreate.values()) {
    if (!defaultCategoryId) {
      preview.push({
        sku: product.codigo,
        action: 'error',
        message: 'No se encontró categoría por defecto',
        codigo: product.codigo,
        nombre: product.nombre,
        stockNuevo: product.stock,
        accion: 'Error'
      })
      continue
    }
    const result = await createNewProduct(product, defaultCategoryId)
    if (result.success) {
      createdCount++
      preview.push({
        sku: product.codigo,
        action: 'created',
        message: result.message,
        productId: result.productId,
        codigo: product.codigo,
        nombre: product.nombre,
        stockNuevo: product.stock,
        accion: 'Crear'
      })
    } else {
      preview.push({
        sku: product.codigo,
        action: 'error',
        message: result.message,
        codigo: product.codigo,
        nombre: product.nombre,
        stockNuevo: product.stock,
        accion: 'Error'
      })
    }
  }
  
  // Actualizar productos existentes
  for (const { existing, new: newProduct } of productsToUpdateMap.values()) {
    const result = await updateExistingProduct(existing, newProduct.stock)
    if (result.success) {
      updatedCount++
      preview.push({
        sku: newProduct.codigo,
        action: 'updated',
        message: result.message,
        productId: existing.id,
        codigo: newProduct.codigo,
        nombre: newProduct.nombre,
        stockAnterior: existing.stock,
        stockNuevo: newProduct.stock,
        diferencia: newProduct.stock - existing.stock,
        accion: 'Actualizar'
      })
    } else {
      preview.push({
        sku: newProduct.codigo,
        action: 'error',
        message: result.message,
        productId: existing.id,
        codigo: newProduct.codigo,
        nombre: newProduct.nombre,
        stockAnterior: existing.stock,
        stockNuevo: newProduct.stock,
        accion: 'Error'
      })
    }
  }
  
  // Eliminar productos que no están en el archivo
  if (productsToDelete.length > 0) {
    const productIdsToDelete = productsToDelete.map(p => p.id)
    deletedCount = await deleteProductsWithRelations(productIdsToDelete)
    
    productsToDelete.forEach(product => {
      preview.push({
        sku: product.sku,
        action: 'deleted',
        message: 'Producto eliminado (no encontrado en archivo)',
        productId: product.id,
        codigo: product.sku,
        nombre: product.name,
        stockAnterior: product.stock,
        stockNuevo: 0,
        diferencia: -product.stock,
        accion: 'Eliminar'
      })
    })
    
    warnings.push(`${productsToDelete.length} productos eliminados porque no están en el archivo`)
  }
  
  return {
    cancelled: false,
    message: `Sincronización completada: ${updatedCount} actualizados, ${createdCount} creados, ${deletedCount} eliminados`,
    stats: {
      totalProcessed: productsToUpdate.length,
      updated: updatedCount,
      created: createdCount,
      deleted: deletedCount,
      processingTimeSeconds: 0 // Se calculará en el handler principal
    },
    preview,
    warnings
  }
}

/**
 * Procesa productos en modo solo actualización
 */
export async function processUpdateOnlyMode(
  productsToUpdate: ProductToUpdate[],
  existingProducts: ExistingProduct[]
): Promise<UploadResult> {
  const existingProductsMap = new Map(existingProducts.map(p => [p.sku, p]))
  let updatedCount = 0
  const preview: UploadResult['preview'] = []
  const warnings: string[] = []
  
  for (const product of productsToUpdate) {
    const existing = existingProductsMap.get(product.codigo)
    if (existing) {
      if (existing.stock !== product.stock) {
        const result = await updateExistingProduct(existing, product.stock)
        if (result.success) {
          updatedCount++
          preview.push({
            sku: product.codigo,
            action: 'updated',
            message: result.message,
            productId: existing.id,
            codigo: product.codigo,
            nombre: product.nombre,
            stockAnterior: existing.stock,
            stockNuevo: product.stock,
            diferencia: product.stock - existing.stock,
            accion: 'Actualizar'
          })
        } else {
          preview.push({
            sku: product.codigo,
            action: 'error',
            message: result.message,
            productId: existing.id,
            codigo: product.codigo,
            nombre: product.nombre,
            stockAnterior: existing.stock,
            stockNuevo: product.stock,
            accion: 'Error'
          })
        }
      }
    } else {
      warnings.push(`Producto ${product.codigo} no encontrado en el sistema`)
    }
  }
  
  return {
    cancelled: false,
    message: `Actualización completada: ${updatedCount} productos actualizados`,
    stats: {
      totalProcessed: productsToUpdate.length,
      updated: updatedCount,
      created: 0,
      deleted: 0,
      processingTimeSeconds: 0
    },
    preview,
    warnings
  }
}

/**
 * Procesa productos en modo solo creación
 */
export async function processAddOnlyMode(
  productsToUpdate: ProductToUpdate[],
  existingProducts: ExistingProduct[],
  defaultCategoryId?: string
): Promise<UploadResult> {
  const existingProductsMap = new Map(existingProducts.map(p => [p.sku, p]))
  let createdCount = 0
  const preview: UploadResult['preview'] = []
  const warnings: string[] = []
  
  for (const product of productsToUpdate) {
    const existing = existingProductsMap.get(product.codigo)
    if (!existing) {
      if (!defaultCategoryId) {
        warnings.push(`Producto ${product.codigo} no se pudo crear: no se encontró categoría por defecto`)
        continue
      }
      const result = await createNewProduct(product, defaultCategoryId)
      if (result.success) {
        createdCount++
        preview.push({
          sku: product.codigo,
          action: 'created',
          message: result.message,
          productId: result.productId,
          codigo: product.codigo,
          nombre: product.nombre,
          stockNuevo: product.stock,
          accion: 'Crear'
        })
      } else {
        preview.push({
          sku: product.codigo,
          action: 'error',
          message: result.message,
          codigo: product.codigo,
          nombre: product.nombre,
          stockNuevo: product.stock,
          accion: 'Error'
        })
      }
    } else {
      warnings.push(`Producto ${product.codigo} ya existe en el sistema`)
    }
  }
  
  return {
    cancelled: false,
    message: `Creación completada: ${createdCount} productos creados`,
    stats: {
      totalProcessed: productsToUpdate.length,
      updated: 0,
      created: createdCount,
      deleted: 0,
      processingTimeSeconds: 0
    },
    preview,
    warnings
  }
}
