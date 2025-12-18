"use client"

import { useState, useEffect, Suspense } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui"
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

function RestablecerContent() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()

  const [token, setToken] = useState("")

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      // Si no hay token, redirigir
      router.push('/auth/olvidaste-contrasena')
    }
  }, [searchParams, router])

  const validatePassword = (password: string) => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push("La contraseña debe tener al menos 8 caracteres")
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Debe contener al menos una letra mayúscula")
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Debe contener al menos una letra minúscula")
    }
    
    if (!/\d/.test(password)) {
      errors.push("Debe contener al menos un número")
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    
    // Validar contraseñas
    const passwordErrors = validatePassword(newPassword)
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors)
      return
    }
    
    if (newPassword !== confirmPassword) {
      setErrors(["Las contraseñas no coinciden"])
      return
    }
    
    setIsSubmitting(true)
    
    // Simular delay de actualización
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    
    // Redirigir a página de éxito
    router.push('/auth/olvidaste-contrasena/exito')
  }

  const getPasswordStrength = (password: string) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    
    return {
      score,
      label: score < 2 ? "Débil" : score < 4 ? "Media" : "Fuerte",
      color: score < 2 ? "bg-red-500" : score < 4 ? "bg-yellow-500" : "bg-green-500"
    }
  }

  const passwordStrength = getPasswordStrength(newPassword)

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
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Nueva Contraseña
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Crea una contraseña segura para tu cuenta
            </p>
          </CardHeader>
          
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa tu nueva contraseña"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Indicador de fortaleza de contraseña */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Fortaleza:</span>
                      <span className={`font-medium ${
                        passwordStrength.score < 2 ? 'text-red-600' : 
                        passwordStrength.score < 4 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-600 text-xs mt-1">Las contraseñas no coinciden</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-green-600 text-xs mt-1">
                    Las contraseñas coinciden
                  </p>
                )}
              </div>

              {/* Mostrar errores */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 mb-2">
                        La contraseña debe cumplir:
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Actualizar Contraseña
                  </>
                )}
              </Button>
            </form>

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

export default function RestablecerContraseñaPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RestablecerContent />
    </Suspense>
  )
}
