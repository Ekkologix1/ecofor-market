"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Progress, Alert, AlertDescription } from "@/components/ui"
import { HydrationBoundary } from "@/components"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCSRF } from "@/hooks"
import { useEffect, useState, useCallback, useRef } from "react"
import { ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, Eye, X, AlertTriangle, Plus, Edit, TrendingUp, Info } from "lucide-react"

// ================================
// INTERFACES MEJORADAS
// ================================

interface StockStats {
  totalProducts: number
  lowStockProducts: number
  lastUpload: {
    date: string
    user: string
    count: number
  } | null
  monthlyUploads: number
}

interface UploadResult {
  codigo: string
  nombre: string
  stockAnterior: number
  stockNuevo: number
  diferencia: number
  accion: string
  lowStock?: boolean
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

interface AnalysisResponse {
  requiresDecision: boolean
  uploadId: string
  analysis: PreProcessAnalysis
  message: string
  stats: {
    fileProducts: number
    systemProducts: number
    toCreate: number
    toUpdate: number
    toDelete: number
  }
}

interface ConfirmationResponse {
  requiresConfirmation: boolean
  operationMode: string
  uploadId: string
  warning: string
  analysis: PreProcessAnalysis
  message: string
}

interface SuccessResponse {
  success: boolean
  operationMode: string
  message: string
  stats: {
    totalProcessed: number
    updated: number
    created: number
    deleted: number
    processingTimeSeconds: number
  }
  preview: UploadResult[]
  warnings?: string[]
  uploadId: string
  cancelled?: boolean
}

interface ErrorResponse {
  error: string
  uploadId?: string
  details?: string[]
  suggestion?: string
}

interface ProgressData {
  status: 'starting' | 'reading' | 'validating' | 'processing' | 'completed' | 'error' | 'warning' | 'analysis_complete' | 'cancelled'
  progress: number
  message: string
  currentBatch?: number
  totalBatches?: number
  processedProducts?: number
  totalProducts?: number
  errors?: string[]
  startTime?: number
}

interface ActiveUpload {
  uploadId: string
  status: string
  progress: number
  message: string
  startTime: number
  fileName: string
}

type OperationMode = 'sync_all' | 'update_only' | 'add_only'

// ================================
// COMPONENTE PRINCIPAL
// ================================

export default function AdminStockPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { token: csrfToken } = useCSRF()

  // Estados principales
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'ready' | 'analyzing' | 'uploading' | 'success' | 'error' | 'awaiting_decision' | 'awaiting_confirmation'>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [stats, setStats] = useState<StockStats | null>(null)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  // Estados para progreso en tiempo real
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const [uploadId, setUploadId] = useState<string | null>(null)

  // Estados para modales y análisis
  const [errorDetails, setErrorDetails] = useState<ErrorResponse | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [analysis, setAnalysis] = useState<PreProcessAnalysis | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [selectedMode, setSelectedMode] = useState<OperationMode | null>(null)
  const [confirmationData, setConfirmationData] = useState<ConfirmationResponse | null>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  // NUEVOS ESTADOS para detección de operaciones huérfanas
  const [activeUploadsFound, setActiveUploadsFound] = useState<ActiveUpload[]>([])
  const [showReconnectModal, setShowReconnectModal] = useState(false)
  const [checkingActiveUploads, setCheckingActiveUploads] = useState(false)

  // Ref para evitar reconexiones en estados finales
  const isCompletedRef = useRef(false)

  // Función para limpiar todos los estados
  const clearAllStates = useCallback(() => {
    console.log('[FRONTEND] Limpiando todos los estados...')
    setSelectedFile(null)
    setUploadStatus('idle')
    setErrorDetails(null)
    setShowErrorModal(false)
    setUploadResults([])
    setShowPreview(false)
    setProgressData(null)
    setUploadId(null)
    setAnalysis(null)
    setShowAnalysisModal(false)
    setSelectedMode(null)
    setConfirmationData(null)
    setShowConfirmationModal(false)
    setActiveUploadsFound([])
    setShowReconnectModal(false)
    isCompletedRef.current = false
    
    // Cerrar EventSource si existe
    if (eventSource) {
      console.log('[FRONTEND] Cerrando EventSource en cleanup...')
      eventSource.close()
      setEventSource(null)
    }
    
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }, [eventSource])

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true)
      const response = await fetch('/api/admin/upload-stock')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // NUEVA FUNCIÓN: Verificar uploads activos al cargar
  const checkForActiveUploads = useCallback(async () => {
    try {
      setCheckingActiveUploads(true)
      const response = await fetch('/api/admin/upload-stock/active')
      if (response.ok) {
        const data = await response.json()
        if (data.activeUploads && data.activeUploads.length > 0) {
          console.log('[FRONTEND] Uploads activos encontrados:', data.activeUploads)
          setActiveUploadsFound(data.activeUploads)
          setShowReconnectModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking active uploads:', error)
    } finally {
      setCheckingActiveUploads(false)
    }
  }, [])

  // FUNCIÓN SSE CORREGIDA - Evita bucles de reconexión
  const connectToProgress = useCallback((uploadId: string) => {
    // Si ya está completado, no conectar
    if (isCompletedRef.current) {
      console.log('[FRONTEND] Proceso ya completado, no conectando SSE')
      return
    }

    // Cerrar conexión existente si la hay
    if (eventSource) {
      console.log('[FRONTEND] Cerrando conexión SSE anterior')
      eventSource.close()
      setEventSource(null)
    }

    console.log(`[FRONTEND] Iniciando conexión SSE para uploadId: ${uploadId}`)
    
    const newEventSource = new EventSource(`/api/admin/upload-stock/progress?uploadId=${uploadId}`)
    
    newEventSource.onopen = () => {
      console.log('[FRONTEND] Conexión SSE establecida exitosamente')
    }
    
    newEventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data)
        console.log(`[FRONTEND] Progreso SSE recibido: ${data.progress}% - ${data.message}`)
        setProgressData(data)
        
        // IMPORTANTE: Cerrar conexión cuando se complete, cancele o haya error
        if (data.status === 'completed') {
          console.log('[FRONTEND] Procesamiento completado, cerrando conexión SSE')
          isCompletedRef.current = true
          setUploadStatus('success')
          newEventSource.close()
          setEventSource(null)
          setTimeout(() => {
            loadStats() // Recargar estadísticas
          }, 1000)
        } else if (data.status === 'cancelled') {
          console.log('[FRONTEND] Procesamiento cancelado, cerrando conexión SSE')
          isCompletedRef.current = true
          setUploadStatus('error')
          newEventSource.close()
          setEventSource(null)
          setErrorDetails({
            error: 'Operación cancelada',
            details: ['La operación fue cancelada por el usuario'],
            suggestion: 'Puedes iniciar una nueva carga cuando lo desees.'
          })
          setShowErrorModal(true)
        } else if (data.status === 'error') {
          console.log('[FRONTEND] Error en procesamiento, cerrando conexión SSE')
          isCompletedRef.current = true
          setUploadStatus('error')
          newEventSource.close()
          setEventSource(null)
        }
      } catch (error) {
        console.error('[FRONTEND] Error parsing SSE data:', error)
      }
    }

    newEventSource.onerror = (error) => {
      console.error('[FRONTEND] SSE Error:', error)
      
      // Solo reconectar si no está completado y la conexión se cerró inesperadamente
      if (newEventSource.readyState === EventSource.CLOSED && !isCompletedRef.current) {
        // Verificar que el uploadStatus no esté en estado final
        if (uploadStatus !== 'success' && uploadStatus !== 'error') {
          console.log('[FRONTEND] Reconectando SSE en 2s...')
          setTimeout(() => {
            if (!isCompletedRef.current) {
              connectToProgress(uploadId)
            }
          }, 2000)
        } else {
          console.log('[FRONTEND] No reconectando - proceso en estado final')
          setEventSource(null)
        }
      }
    }

    setEventSource(newEventSource)
  }, [eventSource, uploadStatus, loadStats])

  // NUEVA FUNCIÓN: Reconectar a un upload activo
  const reconnectToUpload = useCallback((upload: ActiveUpload) => {
    console.log('[FRONTEND] Reconectando a upload:', upload.uploadId)
    setUploadId(upload.uploadId)
    setUploadStatus('uploading')
    setShowReconnectModal(false)
    setActiveUploadsFound([])
    isCompletedRef.current = false
    connectToProgress(upload.uploadId)
  }, [connectToProgress])

  // Función para cancelar un upload activo
  const cancelActiveUpload = useCallback(async (uploadId: string) => {
    try {
      const response = await fetch(`/api/admin/upload-stock/active?uploadId=${uploadId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('[FRONTEND] Upload cancelado exitosamente')
        setActiveUploadsFound(prev => prev.filter(upload => upload.uploadId !== uploadId))
        
        // Si no quedan uploads activos, cerrar modal
        if (activeUploadsFound.length <= 1) {
          setShowReconnectModal(false)
          setActiveUploadsFound([])
        }

        // NUEVA LÍNEA: Verificar nuevamente después de 2 segundos
        setTimeout(() => {
          checkForActiveUploads()
        }, 2000)
        
      } else {
        console.error('[FRONTEND] Error cancelando upload')
      }
    } catch (error) {
      console.error('[FRONTEND] Error en cancelación:', error)
    }
  }, [activeUploadsFound.length, checkForActiveUploads])

// Effect para verificar autenticación y uploads activos
useEffect(() => {
  if (status === "loading") return
  
  // Permitir acceso a ADMIN y VENDEDOR
  const hasAccess = session?.user?.role === "ADMIN" || session?.user?.role === "VENDEDOR"
  
  if (!session || !hasAccess) {
    router.push("/dashboard")
  } else {
    loadStats()
    checkForActiveUploads()
  }
}, [session, status, router, loadStats, checkForActiveUploads])

  // Bloquear scroll del body cuando hay modales abiertos
  useEffect(() => {
    const hasOpenModal = showAnalysisModal || showConfirmationModal || showErrorModal || showReconnectModal
    
    if (hasOpenModal) {
      // Guardar el scroll actual y bloquearlo
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      // Restaurar el scroll
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
    
    // Cleanup al desmontar componente
    return () => {
      if (eventSource) {
        console.log('[FRONTEND] Cleanup: cerrando EventSource')
        eventSource.close()
      }
      // Asegurar que el scroll se restaure al desmontar
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [eventSource, showAnalysisModal, showConfirmationModal, showErrorModal, showReconnectModal])

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('[FRONTEND] Archivo seleccionado:', file.name)
      setSelectedFile(file)
      setUploadStatus('ready')
      setErrorDetails(null)
      setShowErrorModal(false)
      setAnalysis(null)
      setShowAnalysisModal(false)
      setProgressData(null)
      isCompletedRef.current = false // Reset del estado completado
    }
  }

  // Analizar archivo
  const analyzeFile = async () => {
    if (!selectedFile) return
    
    // Verificar que tenemos el token CSRF
    if (!csrfToken) {
      console.error('[FRONTEND] Token CSRF no disponible')
      setUploadStatus('error')
      setErrorDetails({
        error: 'Token de seguridad no disponible',
        details: ['No se pudo obtener el token de seguridad necesario para la operación'],
        suggestion: 'Recarga la página e intenta nuevamente.'
      })
      setShowErrorModal(true)
      return
    }
    
    console.log('[FRONTEND] === INICIANDO ANÁLISIS ===')
    console.log('[FRONTEND] Token CSRF:', csrfToken ? 'Disponible' : 'No disponible')
    
    isCompletedRef.current = false // Reset del estado completado
    setUploadStatus('analyzing')
    setShowPreview(false)
    setUploadResults([])
    setErrorDetails(null)
    setProgressData(null)
    setAnalysis(null)
    setShowAnalysisModal(false)
    
    try {
      console.log('[FRONTEND] Enviando archivo para análisis:', selectedFile.name)
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('operationMode', 'analyze_only')
      
      console.log('[FRONTEND] Haciendo petición POST...')
      
      const response = await fetch('/api/admin/upload-stock', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        body: formData
      })
      
      console.log('[FRONTEND] Response status:', response.status)
      console.log('[FRONTEND] Response ok:', response.ok)
      
      const result = await response.json()
      console.log('[FRONTEND] === RESPUESTA COMPLETA DEL SERVIDOR ===')
      console.log(result)
      console.log('[FRONTEND] === FIN RESPUESTA ===')
      
      if (response.ok) {
        console.log('[FRONTEND] Respuesta exitosa, verificando requiresDecision...')
        console.log('[FRONTEND] result.requiresDecision:', result.requiresDecision)
        
        if (result.requiresDecision) {
          console.log('[FRONTEND] requiresDecision es true, procesando análisis...')
          
          const analysisResponse = result as AnalysisResponse
          console.log('[FRONTEND] analysisResponse.analysis:', analysisResponse.analysis)
          console.log('[FRONTEND] analysisResponse.uploadId:', analysisResponse.uploadId)
          
          // IMPORTANTE: Establecer datos PERO NO conectar al SSE todavía
          // El SSE solo se conectará cuando el usuario seleccione un modo en processWithMode()
          setAnalysis(analysisResponse.analysis)
          setUploadId(analysisResponse.uploadId)
          setUploadStatus('awaiting_decision')
          
          console.log('[FRONTEND] Estados actualizados, esperando 300ms antes de mostrar modal...')
          console.log('[FRONTEND] IMPORTANTE: NO conectando SSE durante análisis')
          
          // Delay para asegurar que los estados se actualicen
          setTimeout(() => {
            console.log('[FRONTEND] MOSTRANDO MODAL DE ANÁLISIS')
            setShowAnalysisModal(true)
          }, 300)
        } else {
          console.error('[FRONTEND] requiresDecision es false o undefined')
          console.error('[FRONTEND] Estructura de respuesta inesperada:', result)
          setUploadStatus('error')
          setErrorDetails({
            error: 'Respuesta inesperada del servidor',
            details: ['El servidor no retornó el análisis esperado', `requiresDecision: ${result.requiresDecision}`],
            suggestion: 'Intenta nuevamente o contacta soporte.'
          })
          setShowErrorModal(true)
        }
      } else {
        console.error('[FRONTEND] Error en la respuesta HTTP:', response.status)
        console.error('[FRONTEND] Error response:', result)
        setUploadStatus('error')
        const errorResponse = result as ErrorResponse
        setErrorDetails(errorResponse)
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('[FRONTEND] Error en la llamada fetch:', error)
      setUploadStatus('error')
      setErrorDetails({
        error: 'Error de conexión',
        details: ['No se pudo conectar con el servidor', error instanceof Error ? error.message : 'Error desconocido'],
        suggestion: 'Verifica tu conexión a internet e intenta nuevamente.'
      })
      setShowErrorModal(true)
    }
  }

  // Procesar con modo seleccionado usando el mismo uploadId
  const processWithMode = async (mode: OperationMode, confirm = false) => {
    if (!selectedFile || !uploadId) {
      console.error('[FRONTEND] No hay archivo o uploadId para procesar')
      return
    }
    
    // Verificar que tenemos el token CSRF
    if (!csrfToken) {
      console.error('[FRONTEND] Token CSRF no disponible para procesamiento')
      setUploadStatus('error')
      setErrorDetails({
        error: 'Token de seguridad no disponible',
        details: ['No se pudo obtener el token de seguridad necesario para la operación'],
        suggestion: 'Recarga la página e intenta nuevamente.'
      })
      setShowErrorModal(true)
      return
    }
    
    console.log(`[FRONTEND] Procesando con modo: ${mode}, confirm: ${confirm}, uploadId: ${uploadId}`)
    console.log('[FRONTEND] Token CSRF:', csrfToken ? 'Disponible' : 'No disponible')
    
    isCompletedRef.current = false // Reset del estado completado
    setUploadStatus('uploading')
    setShowAnalysisModal(false)
    setShowConfirmationModal(false)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('operationMode', mode)
      formData.append('uploadId', uploadId) // ENVIAR EL MISMO UPLOADID
      if (confirm) {
        formData.append('confirmOperation', 'true')
      }
      
      // AQUÍ ES DONDE DEBE CONECTAR AL SSE - después de seleccionar modo
      console.log('[FRONTEND] Conectando al SSE antes del procesamiento...')
      connectToProgress(uploadId)
      
      const response = await fetch('/api/admin/upload-stock', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        body: formData
      })
      
      const result = await response.json()
      
      if (response.ok) {
        if (result.requiresConfirmation) {
          console.log('[FRONTEND] Requiere confirmación adicional')
          // Cerrar SSE si requiere confirmación
          if (eventSource) {
            eventSource.close()
            setEventSource(null)
          }
          setConfirmationData(result as ConfirmationResponse)
          setShowConfirmationModal(true)
          setUploadStatus('awaiting_confirmation')
        } else {
          console.log('[FRONTEND] Procesamiento exitoso')
          const successResponse = result as SuccessResponse
          
          // MANEJAR CANCELACIÓN
          if (successResponse.cancelled) {
            setUploadStatus('error')
            setErrorDetails({
              error: 'Operación cancelada',
              details: ['La operación fue cancelada por el usuario'],
              suggestion: 'Puedes iniciar una nueva carga cuando lo desees.'
            })
            setShowErrorModal(true)
          } else {
            setUploadStatus('success')
            setUploadResults(successResponse.preview || [])
            setShowPreview(true)
            await loadStats()
            
            if (successResponse.warnings && successResponse.warnings.length > 0) {
              setTimeout(() => {
                setErrorDetails({
                  error: 'Proceso completado con advertencias',
                  details: successResponse.warnings,
                  suggestion: 'Revisa los detalles del procesamiento.'
                })
                setShowErrorModal(true)
              }, 1000)
            }
          }
        }
      } else {
        console.error('[FRONTEND] Error en procesamiento:', result)
        setUploadStatus('error')
        const errorResponse = result as ErrorResponse
        setErrorDetails(errorResponse)
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('[FRONTEND] Error en processWithMode:', error)
      setUploadStatus('error')
      setErrorDetails({
        error: 'Error de conexión',
        details: ['No se pudo conectar con el servidor'],
        suggestion: 'Verifica tu conexión a internet e intenta nuevamente.'
      })
      setShowErrorModal(true)
    }
  }

  // Descargar plantilla
  const downloadTemplate = async (type: 'empty' | 'current' = 'empty') => {
    try {
      setDownloadingTemplate(true)
      
      const response = await fetch(`/api/admin/download-template?type=${type}`)
      
      if (!response.ok) {
        throw new Error('Error descargando plantilla')
      }
      
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      let fileName = `plantilla-stock-ecofor-${new Date().toISOString().slice(0, 10)}.xlsx`
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1]
        }
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Error downloading template:', error)
    } finally {
      setDownloadingTemplate(false)
    }
  }

  // Loading inicial
  if (status === "loading") {
    return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  // Verificar acceso para ADMIN y VENDEDOR
  const hasAccess = session?.user?.role === "ADMIN" || session?.user?.role === "VENDEDOR"
  if (!session || !hasAccess) return null

  return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      
      {/* NUEVO MODAL: Detección de Operaciones Activas */}
      {showReconnectModal && activeUploadsFound.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Operación en Progreso Detectada
                  </h3>
                  <p className="text-sm text-gray-600">
                    Se encontró una carga que aún está procesando
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReconnectModal(false)
                  setActiveUploadsFound([])
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {activeUploadsFound.map((upload) => (
                <div key={upload.uploadId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {upload.fileName}
                      </p>
                      <p className="text-xs text-gray-600">
                        Iniciado hace {Math.round((Date.now() - upload.startTime) / 1000)}s
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${
                        upload.status === 'processing' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      {upload.progress}% - {upload.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">
                    {upload.message}
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => reconnectToUpload(upload)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reconectar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelActiveUpload(upload.uploadId)}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Puedes reconectarte para ver el progreso o cancelar la operación para liberar recursos del servidor.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Modal de Análisis del Archivo */}
      {showAnalysisModal && analysis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Análisis del Archivo Completado
                  </h3>
                  <p className="text-blue-600 font-medium mt-1">
                    Selecciona cómo procesar los productos
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('[FRONTEND] Cerrando modal de análisis')
                  setShowAnalysisModal(false)
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Estadísticas del archivo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {analysis.fileAnalysis.stats.existingInFile}
                </p>
                <p className="text-xs text-gray-600">Productos Existentes</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {analysis.fileAnalysis.stats.newInFile}
                </p>
                <p className="text-xs text-gray-600">Productos Nuevos</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {analysis.fileAnalysis.stats.missingFromFile}
                </p>
                <p className="text-xs text-gray-600">No en Archivo</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(analysis.fileAnalysis.stats.overlapPercentage * 100)}%
                </p>
                <p className="text-xs text-gray-600">Coincidencia</p>
              </div>
            </div>

            {/* Recomendación del sistema */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recomendación del Sistema:</h4>
                  <p className="text-sm text-gray-700 mb-3">{analysis.fileAnalysis.recommendations.reasoning}</p>
                  
                  {analysis.fileAnalysis.recommendations.risks.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Consideraciones:</p>
                      <ul className="space-y-1">
                        {analysis.fileAnalysis.recommendations.risks.map((risk, index) => (
                          <li key={index} className="text-sm text-orange-700 flex items-start">
                            <span className="w-1 h-1 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Opciones de procesamiento */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900">Selecciona el modo de procesamiento:</h4>
              
              <div className="grid gap-4">
                {/* Opción: Sincronizar Todo */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMode === 'sync_all'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-red-200'
                  }`}
                  onClick={() => {
                    console.log('[FRONTEND] Modo seleccionado: sync_all')
                    setSelectedMode('sync_all')
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">Sincronizar Todo</h5>
                        {analysis.fileAnalysis.recommendations.suggestedMode === 'sync_all' && (
                          <Badge className="bg-blue-100 text-blue-800">Recomendado</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Actualiza existentes, crea nuevos, elimina los que no están en el archivo
                      </p>
                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Actualizar: {analysis.impactAnalysis.productsToUpdate.length}</span>
                          <span>Crear: {analysis.impactAnalysis.productsToCreate.length}</span>
                          <span className="text-red-600">Eliminar: {analysis.impactAnalysis.productsToDelete.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opción: Solo Actualizar */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMode === 'update_only'
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                  onClick={() => {
                    console.log('[FRONTEND] Modo seleccionado: update_only')
                    setSelectedMode('update_only')
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">Solo Actualizar Existentes</h5>
                        {analysis.fileAnalysis.recommendations.suggestedMode === 'update_only' && (
                          <Badge className="bg-blue-100 text-blue-800">Recomendado</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Solo actualiza productos que ya existen, no crea ni elimina nada
                      </p>
                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Actualizar: {analysis.impactAnalysis.productsToUpdate.length}</span>
                          <span className="text-gray-500">No crear: {analysis.impactAnalysis.productsToCreate.length}</span>
                          <span className="text-gray-500">No eliminar: {analysis.impactAnalysis.productsToDelete.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opción: Solo Agregar */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMode === 'add_only'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-green-200'
                  }`}
                  onClick={() => {
                    console.log('[FRONTEND] Modo seleccionado: add_only')
                    setSelectedMode('add_only')
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">Agregar y Actualizar</h5>
                        {analysis.fileAnalysis.recommendations.suggestedMode === 'add_only' && (
                          <Badge className="bg-blue-100 text-blue-800">Recomendado</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Actualiza existentes y crea nuevos, pero no elimina productos
                      </p>
                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Actualizar: {analysis.impactAnalysis.productsToUpdate.length}</span>
                          <span>Crear: {analysis.impactAnalysis.productsToCreate.length}</span>
                          <span className="text-gray-500">No eliminar: {analysis.impactAnalysis.productsToDelete.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advertencias */}
            {analysis.impactAnalysis.warnings.length > 0 && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {analysis.impactAnalysis.warnings.map((warning, index) => (
                      <div key={index}>• {warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('[FRONTEND] Cancelando análisis, volviendo a ready')
                  setShowAnalysisModal(false)
                  setUploadStatus('ready')
                  setSelectedMode(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedMode) {
                    console.log('[FRONTEND] Procesando con modo seleccionado:', selectedMode)
                    processWithMode(selectedMode)
                  }
                }}
                disabled={!selectedMode}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Procesar con {selectedMode === 'sync_all' ? 'Sincronización' : selectedMode === 'update_only' ? 'Solo Actualizar' : 'Agregar/Actualizar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmationModal && confirmationData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirmar Operación
                  </h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmationModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">{confirmationData.warning}</p>
              <p className="text-sm text-gray-600">{confirmationData.message}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmationModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => processWithMode(confirmationData.operationMode as OperationMode, true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Análisis en Progreso */}
      {uploadStatus === 'analyzing' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analizando archivo Excel
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Procesando {selectedFile?.name}...
              </p>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
                <p className="text-xs text-gray-500">
                  Analizando contenido y detectando patrones...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Carga con Progreso Real */}
      {uploadStatus === 'uploading' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Procesando archivo Excel
              </h3>
              
              {/* Progreso real del servidor */}
              {progressData && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    {progressData.message}
                  </p>
                  
                  <div className="space-y-2">
                    <Progress value={progressData.progress} className="w-full" />
                    <p className="text-xs text-gray-500">
                      {Math.round(progressData.progress)}% completado
                    </p>
                  </div>

                  {/* Información detallada */}
                  {progressData.totalProducts && (
                    <div className="mt-4 text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Total productos:</span>
                        <span className="font-medium">{progressData.totalProducts.toLocaleString()}</span>
                      </div>
                      {progressData.processedProducts !== undefined && (
                        <div className="flex justify-between">
                          <span>Procesados:</span>
                          <span className="font-medium">{progressData.processedProducts.toLocaleString()}</span>
                        </div>
                      )}
                      {progressData.currentBatch && progressData.totalBatches && (
                        <div className="flex justify-between">
                          <span>Lote:</span>
                          <span className="font-medium">{progressData.currentBatch}/{progressData.totalBatches}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tiempo transcurrido */}
                  {progressData.startTime && (
                    <div className="mt-2 text-xs text-gray-500">
                      Tiempo transcurrido: {Math.round((Date.now() - progressData.startTime) / 1000)}s
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {showErrorModal && errorDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  {errorDetails.error.includes('duplicados') ? (
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  ) : errorDetails.error.includes('advertencias') ? (
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  ) : errorDetails.error.includes('cancelada') ? (
                    <X className="w-6 h-6 text-gray-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {errorDetails.error}
                  </h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowErrorModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {errorDetails.details && errorDetails.details.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Detalles:</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <ul className="space-y-1">
                    {errorDetails.details.map((detail: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {errorDetails.suggestion && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errorDetails.suggestion}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowErrorModal(false)
                  // Solo limpiar estados si no es cancelación
                  if (!errorDetails.error.includes('cancelada')) {
                    setTimeout(clearAllStates, 300)
                  }
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="backdrop-blur-sm bg-white/80 shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Dashboard</span>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Gestión de Stock</h1>
            </div>
            
            {/* Indicador de verificación de uploads activos */}
            {checkingActiveUploads && (
              <div className="flex items-center space-x-2 text-yellow-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Verificando operaciones...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Cards de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <FileSpreadsheet className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : (stats?.totalProducts?.toString() || '0')}
                </p>
                <p className="text-sm text-gray-600">Total Productos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : (stats?.lastUpload?.count?.toString() || '0')}
                </p>
                <p className="text-sm text-gray-600">Última Carga</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : (stats?.lowStockProducts?.toString() || '0')}
                </p>
                <p className="text-sm text-gray-600">Stock Bajo</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : (
                    stats?.lastUpload 
                      ? new Date(stats.lastUpload.date).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Sin cargas'
                  )}
                </p>
                <p className="text-sm text-gray-600">Última Actualización</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Carga */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>Cargar Archivo de Stock</span>
            </CardTitle>
            <CardDescription>
              Sube tu archivo Excel desde ERP Laudus con formato: Codigo | Nombre | Stock.
              <br />
              <strong>Nuevo:</strong> Análisis inteligente te ayudará a elegir la mejor opción de procesamiento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Área de selección de archivo */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona tu archivo Excel
              </h3>
              <p className="text-gray-600 mb-4">
                Formato: Codigo | Nombre | Stock
              </p>
              
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar Archivo
              </label>
              
              {selectedFile && (
                <div className="mt-4">
                  <p className="text-sm text-gray-900 font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            {/* Estado de éxito */}
            {uploadStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-800">Stock procesado correctamente</p>
                  </div>
                  {uploadResults.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {showPreview ? 'Ocultar' : 'Ver'} Detalles
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={analyzeFile}
                disabled={!selectedFile || uploadStatus === 'analyzing' || uploadStatus === 'uploading'}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {uploadStatus === 'analyzing' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                Analizar y Procesar
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:col-span-2">
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('empty')}
                  disabled={downloadingTemplate}
                >
                  {downloadingTemplate ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Plantilla Vacía
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate('current')}
                  disabled={downloadingTemplate || loadingStats}
                >
                  {downloadingTemplate ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  )}
                  Stock Actual
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                onClick={clearAllStates}
                className="md:col-start-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vista Previa de Cambios */}
        {showPreview && uploadResults.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>Productos Procesados</span>
              </CardTitle>
              <CardDescription>
                Detalle de los cambios realizados en el stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {uploadResults.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm text-gray-900">{item.codigo}</p>
                        {item.lowStock && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            Stock Bajo
                          </Badge>
                        )}
                        <Badge 
                          variant="outline"
                          className={`${
                            item.accion === 'actualizado' 
                              ? "bg-blue-50 text-blue-700 border-blue-200" 
                              : item.accion === 'creado'
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {item.accion === 'actualizado' ? 'Actualizado' : 
                           item.accion === 'creado' ? 'Creado' : 'No encontrado'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{item.nombre}</p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">{item.stockAnterior}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{item.stockNuevo}</span>
                      <Badge 
                        variant={item.diferencia > 0 ? "default" : item.diferencia < 0 ? "destructive" : "outline"}
                        className={`${
                          item.diferencia > 0 
                            ? "bg-green-100 text-green-800" 
                            : item.diferencia < 0
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.diferencia > 0 ? '+' : ''}{item.diferencia}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              {uploadResults.length === 20 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Mostrando los primeros 20 resultados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Historial de Cargas */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mt-8">
          <CardHeader>
            <CardTitle>Últimas Cargas</CardTitle>
            <CardDescription>
              Cargas realizadas este mes: {loadingStats ? '...' : (stats?.monthlyUploads?.toString() || '0')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.lastUpload ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Última carga de stock</p>
                    <p className="text-xs text-gray-600">
                      {new Date(stats.lastUpload.date).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} • {stats.lastUpload.user}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {stats.lastUpload.count} productos
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No hay cargas registradas</p>
                  <p className="text-xs text-gray-500">Sube tu primer archivo Excel para comenzar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </HydrationBoundary>
  )
}