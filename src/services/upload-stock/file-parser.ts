// ================================
// PARSER DE ARCHIVOS PARA UPLOAD STOCK
// ================================

import * as XLSX from 'xlsx'
import { ProductToUpdate, ExcelRow, PreProcessAnalysis } from './types'
import { VALIDATION_RULES, COLUMN_MAPPING, ERROR_MESSAGES } from './config'

/**
 * Parsea un archivo Excel/CSV y extrae los datos de productos
 * Compatible con servidor Node.js
 */
export async function parseFile(file: File): Promise<ExcelRow[]> {
  try {
    // Convertir File a ArrayBuffer en el servidor
    const arrayBuffer = await file.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)
    
    // Leer el archivo Excel
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    if (jsonData.length < 2) {
      throw new Error('El archivo debe tener al menos 2 filas (encabezado + datos)')
    }
    
    const headers = jsonData[0] as string[]
    const rows = jsonData.slice(1) as any[][]
    
    const mappedData: ExcelRow[] = rows.map((row, index) => {
      const rowData: ExcelRow = {}
      headers.forEach((header, colIndex) => {
        if (header && row[colIndex] !== undefined) {
          rowData[header.toLowerCase().trim()] = row[colIndex]
        }
      })
      return { ...rowData, _rowNumber: index + 2 } // +2 porque empezamos desde la fila 2
    })
    
    return mappedData
  } catch (error) {
    throw new Error(`Error al parsear el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Mapea las columnas del archivo a los campos estándar
 */
function mapColumns(row: ExcelRow): { codigo: string; nombre: string; stock: number; rowNumber: number } | null {
  const codigoField = findColumn(row, COLUMN_MAPPING.codigo)
  const nombreField = findColumn(row, COLUMN_MAPPING.nombre)
  const stockField = findColumn(row, COLUMN_MAPPING.stock)
  
  if (!codigoField || !nombreField || !stockField) {
    return null
  }
  
  const codigo = String(row[codigoField] || '').trim()
  const nombre = String(row[nombreField] || '').trim()
  const stock = parseStock(row[stockField])
  
  return {
    codigo,
    nombre,
    stock,
    rowNumber: Number(row._rowNumber) || 0
  }
}

/**
 * Encuentra la columna correcta basada en los posibles nombres
 */
function findColumn(row: ExcelRow, possibleNames: readonly string[]): string | null {
  for (const key of Object.keys(row)) {
    if (possibleNames.some(name => key.toLowerCase().includes(name.toLowerCase()))) {
      return key
    }
  }
  return null
}

/**
 * Parsea el valor de stock a número
 */
function parseStock(value: any): number {
  if (typeof value === 'number') {
    return Math.max(0, Math.floor(value))
  }
  
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed))
  }
  
  return 0
}

/**
 * Convierte los datos del archivo a productos para actualizar
 */
export function convertToProducts(excelData: ExcelRow[]): ProductToUpdate[] {
  const products: ProductToUpdate[] = []
  const seenSkus = new Set<string>()
  
  excelData.forEach(row => {
    const mapped = mapColumns(row)
    if (!mapped) return
    
    const { codigo, nombre, stock, rowNumber } = mapped
    
    // Validaciones básicas
    if (!codigo || codigo.length === 0) return
    if (!nombre || nombre.length === 0) return
    if (stock < VALIDATION_RULES.MIN_STOCK) return
    
    // Verificar duplicados
    if (seenSkus.has(codigo)) return
    seenSkus.add(codigo)
    
    products.push({
      codigo,
      nombre,
      stock,
      rowNumber
    })
  })
  
  return products
}

/**
 * Realiza un análisis previo de los datos
 */
export function analyzeFileIntent(products: ProductToUpdate[]): PreProcessAnalysis {
  const analysis: PreProcessAnalysis = {
    totalRows: products.length,
    validRows: 0,
    invalidRows: 0,
    duplicates: 0,
    newProducts: 0,
    existingProducts: 0,
    lowStockProducts: 0,
    errors: [],
    warnings: []
  }
  
  const seenSkus = new Set<string>()
  
  products.forEach(product => {
    // Verificar duplicados en el archivo
    if (seenSkus.has(product.codigo)) {
      analysis.duplicates++
      analysis.errors.push({
        row: product.rowNumber,
        message: `${ERROR_MESSAGES.DUPLICATE_SKU} ${product.codigo}`,
        data: product
      })
      return
    }
    seenSkus.add(product.codigo)
    
    // Validaciones
    if (product.codigo.length < VALIDATION_RULES.MIN_SKU_LENGTH) {
      analysis.invalidRows++
      analysis.errors.push({
        row: product.rowNumber,
        message: ERROR_MESSAGES.EMPTY_SKU,
        data: product
      })
      return
    }
    
    if (product.nombre.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
      analysis.invalidRows++
      analysis.errors.push({
        row: product.rowNumber,
        message: ERROR_MESSAGES.EMPTY_NAME,
        data: product
      })
      return
    }
    
    if (product.stock < VALIDATION_RULES.MIN_STOCK || product.stock > VALIDATION_RULES.MAX_STOCK) {
      analysis.invalidRows++
      analysis.errors.push({
        row: product.rowNumber,
        message: ERROR_MESSAGES.INVALID_STOCK,
        data: product
      })
      return
    }
    
    analysis.validRows++
    
    // Detectar stock bajo
    if (product.stock <= 5) {
      analysis.lowStockProducts++
      analysis.warnings.push({
        row: product.rowNumber,
        message: `Stock bajo detectado: ${product.stock}`,
        data: product
      })
    }
  })
  
  return analysis
}
