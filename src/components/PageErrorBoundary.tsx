"use client"
// ============================================
// PAGE ERROR BOUNDARY
// Error Boundary específico para páginas con fallback más simple
// ============================================


import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui"
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import ErrorBoundary from './ErrorBoundary'





interface PageErrorBoundaryProps {
  children: React.ReactNode
  pageName?: string
}

const PageErrorFallback: React.FC<{ pageName?: string }> = ({ pageName }) => {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Error en {pageName || 'la página'}
          </CardTitle>
          <CardDescription className="text-gray-600">
            Algo salió mal al cargar esta sección
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleGoBack}
              variant="default"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver atrás
            </Button>
            
            <Button 
              onClick={handleReload}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar página
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ 
  children, 
  pageName 
}) => {
  return (
    <ErrorBoundary fallback={<PageErrorFallback pageName={pageName} />}>
      {children}
    </ErrorBoundary>
  )
}

export default PageErrorBoundary
