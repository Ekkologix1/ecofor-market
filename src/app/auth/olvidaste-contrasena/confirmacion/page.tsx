"use client"

import { useEffect, useState, Suspense } from "react"
import { Button, Card, CardContent } from "@/components/ui"
import { ArrowLeft, Clock, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

function ConfirmacionContent() {
  const [email, setEmail] = useState("")
  const [countdown, setCountdown] = useState(60)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Si no hay email en los parámetros, redirigir
      router.push('/auth/olvidaste-contrasena')
    }
  }, [searchParams, router])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleResendEmail = () => {
    setCountdown(60)
    // Simular reenvío
  }

  const handleSimulateEmailClick = () => {
    // Simular click en el enlace del correo
    router.push('/auth/olvidaste-contrasena/restablecer?token=simulated_token')
  }

  return (
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
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Correo Enviado!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Hemos enviado un enlace de restablecimiento de contraseña a:
            </p>
            
            <div className="bg-emerald-50 rounded-lg p-4 mb-6">
              <p className="font-semibold text-emerald-800">{email}</p>
            </div>

            {/* Simulación para desarrollo */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                🚧 Modo Desarrollo
              </h4>
              <p className="text-xs text-yellow-700 mb-3">
                En producción, el usuario recibiría un correo real. Para probar la funcionalidad:
              </p>
              <Button
                onClick={handleSimulateEmailClick}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Simular Click en Enlace
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>El enlace expira en 24 horas</span>
              </div>
              
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Shield className="h-4 w-4 mr-2" />
                <span>Enlace seguro y único</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                ¿No recibiste el correo?
              </p>
              
              <Button
                onClick={handleResendEmail}
                disabled={countdown > 0}
                variant="outline"
                className="w-full"
              >
                {countdown > 0 ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Reenviar en {countdown}s
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Reenviar Correo
                  </>
                )}
              </Button>
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
  )
}

export default function ConfirmacionEnvioPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ConfirmacionContent />
    </Suspense>
  )
}
