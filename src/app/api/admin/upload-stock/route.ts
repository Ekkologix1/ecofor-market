// ================================
// ENDPOINT REFACTORIZADO PARA UPLOAD STOCK
// ================================

import { NextRequest, NextResponse } from 'next/server'
import { withCSRFProtection } from '@/lib'
import { handleStockUpload, getUploadStats } from '@/services/upload-stock'

/**
 * Endpoint GET - Obtener estadísticas de uploads
 */
export async function GET() {
  return getUploadStats()
}

/**
 * Endpoint POST - Procesar carga de stock con protección CSRF
 */
export async function POST(request: NextRequest) {
  const withCSRF = withCSRFProtection(handleStockUpload, { requireAuth: true })
  return withCSRF(request)
}
