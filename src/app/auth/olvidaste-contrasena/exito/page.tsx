"use client"

import { useEffect, useState } from "react"
import { Button, Card, CardContent } from "@/components/ui"
import { CheckCircle, ArrowRight, Shield, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HydrationBoundary } from "@/components/HydrationBoundary"

export default function ContraseñaActualizadaExitoPage() {
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()

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

  // Efecto separado para manejar la redirección
  useEffect(() => {
    if (countdown === 0) {
      router.push('/auth/login')
    }
  }, [countdown, router])

  return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Contraseña Actualizada!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>

              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Tu cuenta está segura
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>Contraseña actualizada correctamente</span>
                </div>
                
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2" />
                  <span>Sesión segura activada</span>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/auth/login">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Ir al Login
                  </Button>
                </Link>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Serás redirigido automáticamente en {countdown} segundos
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  ¿Necesitas ayuda?{" "}
                  <Link href="/contacto" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Contactar Soporte
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