"use client"

import { useState } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui"
import { ArrowLeft, Mail, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HydrationBoundary } from "@/components/HydrationBoundary"

export default function OlvidasteContraseñaPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitted(true)
    setIsSubmitting(false)
    
    // Redirigir después de 3 segundos
    setTimeout(() => {
      router.push(`/auth/olvidaste-contrasena/confirmacion?email=${encodeURIComponent(email)}`)
    }, 3000)
  }

  if (isSubmitted) {
    return (
      <HydrationBoundary>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Solicitud Enviada
                </h2>
                <p className="text-gray-600 mb-6">
                  Te hemos enviado un enlace de restablecimiento a <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Redirigiendo automáticamente...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </HydrationBoundary>
    )
  }

  return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header fijo que cubre toda la parte superior */}
          <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100 p-4 z-50">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              {/* Botón Volver al Login a la izquierda */}
              <Link href="/auth/login" className="text-gray-600 hover:text-emerald-700 transition-colors">
                <Button variant="ghost" size="sm" className="flex items-center hover:bg-emerald-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Login
                </Button>
              </Link>
              
              {/* Logo de Ecofor a la derecha */}
              <div className="flex items-center">
                <img src="/images/logo-ecofor.png" alt="ECOFOR" className="h-8 w-auto" />
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-2xl mt-20">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                ¿Olvidaste tu contraseña?
              </CardTitle>
              <p className="text-gray-600 mt-2">
                No te preocupes, te ayudamos a restablecerla
              </p>
            </CardHeader>
            
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@empresa.com"
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Ingresa el correo electrónico asociado a tu cuenta
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Enlace de Restablecimiento
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">
                        ¿Qué sucede después?
                      </h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Te enviaremos un enlace seguro por correo</li>
                        <li>• El enlace expirará en 24 horas</li>
                        <li>• Podrás crear una nueva contraseña</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  ¿Recordaste tu contraseña?{" "}
                  <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Volver al Login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </HydrationBoundary>
  )
}