


import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui"
import { CheckCircle, Clock, Mail, ArrowRight, Home } from "lucide-react"
import Image from "next/image"
import Link from "next/link"


import { HydrationBoundary } from "@/components/HydrationBoundary"

export default function RegistroExitosoPage() {
  return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
      {/* Background decorative elements - Matching other pages */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-200 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-teal-200 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-green-100 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-emerald-100 rounded-full blur-xl"></div>
      </div>

      {/* Grid pattern overlay - Matching other pages */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23059669' fill-opacity='0.4'%3e%3ccircle cx='30' cy='30' r='1.5'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
        }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl mx-auto">
          
          {/* Logo section - Matching other pages */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl transform rotate-1"></div>
              <div className="relative bg-white rounded-2xl p-6 shadow-xl">
                <Image
                  src="/images/logo-ecofor.png"
                  alt="ECOFOR Market"
                  width={220}
                  height={80}
                  className="mx-auto"
                  priority
                />
              </div>
            </div>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              {/* Success Icon with Animation */}
              <div className="mx-auto mb-6 relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
                  <CheckCircle className="w-12 h-12 text-white animate-pulse" />
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-400 rounded-full animate-ping opacity-20"></div>
              </div>
              
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                ¡Registro Exitoso!
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Tu cuenta ha sido creada correctamente en ECOFOR Market
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Success message */}
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">Cuenta creada exitosamente</h3>
                  </div>
                  <p className="text-green-700 leading-relaxed">
                    Tu información ha sido registrada correctamente. Ahora nuestro equipo procederá a validar tu cuenta.
                  </p>
                </div>
              </div>

              {/* Next steps */}
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-900 text-center mb-6">Próximos Pasos</h4>
                
                {/* Step 1: Validation */}
                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-blue-900 mb-1">Validación de Cuenta</h5>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Nuestro equipo validará tu cuenta manualmente. Este proceso toma máximo 30 minutos para personas naturales y hasta 24 horas para empresas.
                    </p>
                  </div>
                </div>

                {/* Step 2: Notification */}
                <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-purple-900 mb-1">Notificación por Email</h5>
                    <p className="text-purple-800 text-sm leading-relaxed">
                      Te enviaremos un correo electrónico cuando tu cuenta esté lista para usar con acceso completo a precios y catálogo.
                    </p>
                  </div>
                </div>

                {/* Step 3: Access */}
                <div className="flex items-start space-x-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-emerald-900 mb-1">Acceso Completo</h5>
                    <p className="text-emerald-800 text-sm leading-relaxed">
                      Una vez validada, podrás ver precios, realizar pedidos y acceder a todos los beneficios de ECOFOR Market.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-6 border-t border-gray-200">
                <div className="space-y-4">
                  <Button 
                    asChild
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02]"
                  >
                    <Link href="/auth/login" className="flex items-center justify-center space-x-2">
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>

                  <Button 
                    asChild
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50"
                  >
                    <Link href="/" className="flex items-center justify-center space-x-2">
                      <Home className="w-5 h-5" />
                      <span>Volver al Inicio</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Contact info */}
              <div className="pt-6 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">
                    ¿Tienes preguntas sobre tu registro?
                  </p>
                  <p className="text-gray-500 text-xs">
                    Contáctanos: 
                    <span className="text-emerald-600 font-semibold ml-1">contacto@ecofor.cl</span> | 
                    <span className="text-emerald-600 font-semibold ml-1">+56 41 234 5678</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </HydrationBoundary>
  )
}