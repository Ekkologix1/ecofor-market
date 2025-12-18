"use client"
import { Card, Badge } from "@/components/ui"
import {
  User,
  Building,
  CheckCircle,
  Clock,
  Leaf,
  ShieldCheck
} from "lucide-react"


// ============================================
// COMPONENTE: WelcomeSection
// Sección de bienvenida con información del usuario
// ============================================






interface WelcomeSectionProps {
  userName: string
  isEmpresa: boolean
  isValidated: boolean
}

export function WelcomeSection({ userName, isEmpresa, isValidated }: WelcomeSectionProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 opacity-0 animate-fade-in-up animation-delay-100">
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-600 rounded-full"></div>
        <div className="absolute top-1/2 -left-8 w-16 h-16 bg-emerald-600 rounded-full"></div>
        <div className="absolute bottom-0 right-1/3 w-20 h-20 bg-green-500 rounded-full"></div>
      </div>

      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar/Icono */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${isEmpresa
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-green-100 text-green-700'
              }`}>
              {isEmpresa ? (
                <Building className="w-8 h-8 transition-transform duration-300 hover:scale-110" />
              ) : (
                <User className="w-8 h-8 transition-transform duration-300 hover:scale-110" />
              )}
            </div>

            {/* Información principal */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Bienvenido, {userName}
                </h2>
                <div className="flex items-center group">
                  <Leaf className="w-5 h-5 text-green-600 mr-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-green-700 group-hover:text-green-800 transition-colors">ECOFOR</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge
                  variant={isEmpresa ? "default" : "secondary"}
                  className={`${isEmpresa
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    } font-medium transition-all duration-300 hover:scale-105`}
                >
                  {isEmpresa ? (
                    <>
                      <Building className="w-3 h-3 mr-1" />
                      Cuenta Empresarial
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1" />
                      Persona Natural
                    </>
                  )}
                </Badge>

                <Badge
                  variant={isValidated ? "default" : "destructive"}
                  className={`${isValidated
                      ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                      : 'bg-orange-100 text-orange-800 border-orange-300'
                    } font-medium transition-all duration-300 hover:scale-105`}
                >
                  {isValidated ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Cuenta Verificada
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1" />
                      Pendiente Verificación
                    </>
                  )}
                </Badge>
              </div>

              {/* Mensaje contextual */}
              <p className="text-gray-600 mt-3 text-sm">
                {isValidated ? (
                  isEmpresa ? (
                    "Accede a precios mayoristas exclusivos y soluciones personalizadas para tu empresa"
                  ) : (
                    "Explora nuestro catálogo de productos eco-amigables con precios especiales"
                  )
                ) : (
                  "Tu cuenta está siendo revisada por nuestro equipo. Te notificaremos cuando esté lista."
                )}
              </p>
            </div>
          </div>

          {/* Estado/Indicador visual */}
          <div className="hidden md:flex flex-col items-center">
            {isValidated ? (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            )}
            <span className="text-xs text-gray-500 text-center">
              {isValidated ? 'Verificado' : 'En revisión'}
            </span>
          </div>
        </div>

        {/* Mensaje de estado para cuentas no validadas */}
        {!isValidated && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Verificación en proceso
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Nuestro equipo está revisando tu cuenta. Recibirás una notificación por email cuando esté lista.
                  {isEmpresa && " Las cuentas empresariales pueden tomar hasta 24 horas."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acceso rápido para usuarios validados */}
        {isValidated && (
          <div className="mt-4 flex items-center justify-between p-3 bg-white bg-opacity-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <Leaf className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {isEmpresa ? "Portal Empresarial Activo" : "Catálogo Completo Disponible"}
              </span>
            </div>
            <Badge variant="outline" className="text-green-700 border-green-300">
              Acceso Total
            </Badge>
          </div>
        )}
      </div>
    </Card>
  )
}