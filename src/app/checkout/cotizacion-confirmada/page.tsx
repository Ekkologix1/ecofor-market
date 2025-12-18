"use client"

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Download, ArrowLeft, FileText, Calendar, User, Building, Package } from 'lucide-react'
import Image from 'next/image'

interface QuotationData {
  id: string
  orderNumber: string
  status: string
  type: string
  createdAt: string
  total: number
  quotationDescription?: string
  desiredDeliveryDate?: string
  estimatedDate?: string
  clientType: string
  items: Array<{
    product: {
      id: string
      name: string
      image: string
      price: number
    }
    quantity: number
    price: number
  }>
  user: {
    name: string
    email: string
    type: string
  }
}

function QuotationContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [quotation, setQuotation] = useState<QuotationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quotationId = searchParams.get('id')

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (quotationId) {
      fetchQuotationDetails()
    } else {
      console.error('No quotation ID provided')
      setError('No se proporcionó un ID de cotización válido')
      setLoading(false)
    }
  }, [session, quotationId, router])

  const fetchQuotationDetails = async () => {
    try {
      // Obteniendo detalles de cotización
      const response = await fetch(`/api/orders/${quotationId}`)
      
      if (response.ok) {
        const data = await response.json()
        // Datos de cotización recibidos
        
        const orderData = data.order || data
        
        // Mapear los datos del order a la estructura esperada por la interfaz
        const quotationData: QuotationData = {
          id: orderData.id,
          orderNumber: orderData.orderNumber,
          status: orderData.status,
          type: orderData.type,
          createdAt: orderData.createdAt,
          total: parseFloat(orderData.total),
          quotationDescription: orderData.customerNotes, // Mapear customerNotes a quotationDescription
          desiredDeliveryDate: orderData.desiredDeliveryDate,
          estimatedDate: orderData.estimatedDate,
          clientType: orderData.user.type,
          items: orderData.items.map((item: {
            id: string
            quantity: number
            unitPrice: number
            discount: number
            product: {
              id: string
              name: string
              sku: string
              mainImage?: string
            }
          }) => ({
            product: {
              id: item.product.id,
              name: item.product.name,
              image: item.product.mainImage || '/images/products/placeholder-product.svg',
              price: Number(item.unitPrice)
            },
            quantity: item.quantity,
            price: Number(item.unitPrice) * item.quantity
          })),
          user: {
            name: orderData.user.name,
            email: orderData.user.email,
            type: orderData.user.type
          }
        }
        
        setQuotation(quotationData)
      } else {
        console.error('Failed to fetch quotation, status:', response.status)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', errorData)
        setError(`Error al cargar la cotización: ${response.status} - ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error fetching quotation:', error)
      setError(`Error de conexión al cargar la cotización: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = async () => {
    if (!quotation) return

    setDownloadingPDF(true)
    try {
      const response = await fetch(`/api/orders/${quotation.id}/download-pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `cotizacion-${quotation.orderNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Error downloading PDF')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setDownloadingPDF(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada'
    
    // Verificar si la fecha es válida
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida recibida:', dateString)
      return 'Fecha inválida'
    }
    
    // Usar UTC para evitar problemas de zona horaria
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    
    // Crear una fecha local con los componentes UTC
    const localDate = new Date(year, month, day)
    
    return localDate.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  // No mostrar loading, continuar con el contenido

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar la cotización</h2>
            <p className="text-gray-600 mb-6">
              {error || 'No se pudo cargar la información de la cotización. Por favor, intenta nuevamente.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Dashboard</span>
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reintentar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header Simple con Iconos */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Título */}
            <div className="flex items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Confirmación de Cotización</h1>
                <p className="text-sm text-gray-500">ECOFOR Market</p>
              </div>
            </div>

            {/* Logo ECOFOR */}
            <div className="flex items-center">
              <Image
                src="/images/logo-ecofor.png"
                alt="ECOFOR Market"
                width={120}
                height={56}
                priority
                className="transform hover:scale-105 transition-transform duration-300"
                placeholder="empty"
                style={{ width: "auto", height: "auto" }}
                sizes="(max-width: 768px) 100px, 120px"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Título de confirmación */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Cotización Solicitada!
          </h2>
          <p className="text-lg text-gray-600">
            Tu solicitud ha sido procesada correctamente
          </p>
        </div>

        {/* Layout responsive: horizontal en desktop, vertical en móvil */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Resumen de la Solicitud */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900">Resumen de tu Solicitud</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Número de Cotización</p>
                      <p className="text-emerald-600 font-mono">{quotation.orderNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Fecha de Solicitud</p>
                      <p className="text-gray-600">{formatDate(quotation.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {quotation.user.type === 'EMPRESA' ? (
                      <Building className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <User className="h-5 w-5 text-emerald-600" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">Tipo de Cliente</p>
                      <p className="text-gray-600">
                        {quotation.user.type === 'EMPRESA' ? 'Empresa' : 'Persona Natural'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Descripción de la Cotización</p>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                      {quotation.quotationDescription || 'Sin descripción adicional'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Fecha Deseada de Entrega</p>
                    <p className="text-gray-600">{formatDate(quotation.desiredDeliveryDate || quotation.estimatedDate || '')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Productos Solicitados */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900">Productos Solicitados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {quotation.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={item.product.image || '/images/products/placeholder-product.svg'}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{item.product.name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x {formatPrice(item.product.price)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-emerald-600">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Valor Estimado</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {formatPrice(quotation.total)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Los precios finales se confirmarán en la cotización formal
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Próximos Pasos - Full width */}
          <div className="col-span-1 lg:col-span-2 mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-gray-900 flex items-center space-x-2">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Próximos Pasos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Revisión de tu Solicitud</p>
                      <p className="text-gray-600 text-sm">Nuestro equipo revisará tu solicitud y productos requeridos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Contacto</p>
                      <p className="text-gray-600 text-sm">Te contactaremos en un plazo de 24-48 horas hábiles</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Cotización Formal</p>
                      <p className="text-gray-600 text-sm">Recibirás la cotización formal con precios finales y condiciones</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acciones - Full width */}
          <div className="col-span-1 lg:col-span-2 mt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/catalogo')}
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-3"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Solicitar Otra Cotización
              </Button>
              
              <Button
                onClick={handleDownloadReceipt}
                disabled={downloadingPDF}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
              >
                {downloadingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Comprobante
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="border-gray-600 text-gray-600 hover:bg-gray-50 px-8 py-3"
              >
                Ir al Dashboard
              </Button>
            </div>
          </div>

          {/* Información Adicional - Full width */}
          <div className="col-span-1 lg:col-span-2 mt-6">
            <Card className="shadow-lg bg-gray-50">
              <CardContent className="pt-6">
                <div className="text-center text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>Validez:</strong> La cotización será válida por 30 días desde su emisión
                  </p>
                  <p>
                    <strong>Contacto:</strong> Si tienes dudas, puedes contactarnos al +56 9 1234 5678 o 
                    <a href="mailto:ventas@ecofor.cl" className="text-emerald-600 hover:underline ml-1">
                      ventas@ecofor.cl
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QuotationConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <QuotationContent />
    </Suspense>
  )
}