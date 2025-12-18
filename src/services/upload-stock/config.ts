// ================================
// CONFIGURACIÓN PARA UPLOAD STOCK
// ================================

import { UploadConfig } from './types'

export const CONFIG: UploadConfig = {
  BATCH_SIZE: 100,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['xlsx', 'xls', 'csv'],
  PROGRESS_UPDATE_INTERVAL: 500, // 500ms
  TIMEOUT_MS: 30 * 60 * 1000, // 30 minutos
}

export const VALIDATION_RULES = {
  MIN_STOCK: 0,
  MAX_STOCK: 999999,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 255,
  MIN_SKU_LENGTH: 1,
  MAX_SKU_LENGTH: 50,
} as const

export const COLUMN_MAPPING = {
  codigo: ['codigo', 'sku', 'code', 'producto', 'id'],
  nombre: ['nombre', 'name', 'descripcion', 'description', 'producto'],
  stock: ['stock', 'inventario', 'inventory', 'cantidad', 'quantity'],
} as const

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'El archivo es demasiado grande. Máximo 10MB.',
  INVALID_FILE_TYPE: 'Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls) o CSV.',
  MISSING_COLUMNS: 'El archivo debe contener las columnas: código, nombre y stock.',
  INVALID_STOCK: 'El stock debe ser un número válido mayor o igual a 0.',
  EMPTY_NAME: 'El nombre del producto no puede estar vacío.',
  EMPTY_SKU: 'El código del producto no puede estar vacío.',
  DUPLICATE_SKU: 'Código duplicado encontrado en la fila',
  INVALID_ROW: 'Fila inválida',
} as const
