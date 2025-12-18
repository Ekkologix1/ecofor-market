"use client"
// ============================================
// ERROR BOUNDARY COMPONENT
// Captura errores de JavaScript en cualquier parte del árbol de componentes
// ============================================


import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from "@/components/ui"
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { clientLogger } from '@/lib/logger-client'
import React, { Component, ErrorInfo, ReactNode } from 'react'






interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualiza el state para mostrar la UI de error
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error
    this.logError(error, errorInfo)
    
    // Actualizar state con información del error
    this.setState({
      error,
      errorInfo
    })

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }

    // Log estructurado del error
    clientLogger.error('React Error Boundary caught error', errorData)

    // Enviar a servicio de monitoreo (si está disponible)
    this.reportError(errorData)
  }

  private reportError = async (errorData: { message: string; stack?: string; componentStack?: string | null; errorId?: string | null; timestamp?: string; userAgent?: string; url?: string }) => {
    try {
      // Aquí podrías enviar el error a un servicio como Sentry, LogRocket, etc.
      // Por ahora, solo loggeamos localmente
      if (process.env.NODE_ENV === 'development') {
        console.group('Error Boundary Report')
        console.error('Error:', errorData.message)
        console.error('Stack:', errorData.stack)
        console.error('Component Stack:', errorData.componentStack)
        console.error('Error ID:', errorData.errorId)
        console.groupEnd()
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Renderizar UI de error personalizada
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                ¡Ups! Algo salió mal
              </CardTitle>
              <CardDescription className="text-gray-600">
                Ha ocurrido un error inesperado en la aplicación
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Details */}
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">ID del Error: {this.state.errorId}</p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Mensaje:</p>
                        <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                          {this.state.error.message}
                        </p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Intentar de nuevo
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recargar página
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Ir al inicio
                </Button>
              </div>

              {/* Development Info */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Información técnica (desarrollo)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook personalizado para usar Error Boundary programáticamente
export const useErrorHandler = () => {
  const throwError = (error: Error) => {
    throw error
  }

  const handleAsyncError = (error: Error) => {
    // Para errores asíncronos, los loggeamos pero no los lanzamos
    // ya que los Error Boundaries no los capturan
    clientLogger.error('Async error caught by useErrorHandler', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }

  return {
    throwError,
    handleAsyncError
  }
}

export default ErrorBoundary
