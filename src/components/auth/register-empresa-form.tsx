"use client"
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from "@/components/ui"
import { registerEmpresaSchema, type RegisterEmpresaData } from "@/lib"
import { useCSRF } from "@/hooks"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, User, Mail, Phone, MapPin, Lock, FileText, ArrowLeft } from "lucide-react"
import { useScrollOptimization, useFastScrollDetection } from "@/hooks/useScrollOptimization"























interface RegisterEmpresaFormProps {
  onBack: () => void
}

export function RegisterEmpresaForm({ onBack }: RegisterEmpresaFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { token: csrfToken, isLoading: csrfLoading, error: csrfError } = useCSRF()

  // Aplicar optimizaciones de scroll
  useScrollOptimization()
  useFastScrollDetection()

  // Detectar scroll activo para optimizar rendering
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true)
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterEmpresaData>({
    resolver: zodResolver(registerEmpresaSchema)
  })

  const onSubmit = async (data: RegisterEmpresaData) => {
    if (!csrfToken) {
      setError("Error de seguridad. Recarga la página e intenta de nuevo.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ ...data, type: "EMPRESA" })
      })

      if (response.ok) {
        router.push("/auth/registro-exitoso")
      } else {
        const result = await response.json()
        setError(result.error || "Error al registrar empresa")
      }
    } catch (error) {
      setError("Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto scroll-optimized">
      {/* Header con botón volver */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 mb-6 gpu-accelerated"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a selección de tipo
        </Button>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-optimized mb-4 animation-optimized">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro Empresa</h1>
          <p className="text-gray-600">Accede a precios mayoristas y beneficios exclusivos</p>
        </div>
      </div>

      <Card className={`backdrop-blur-optimized bg-white/80 border-0 shadow-optimized transition-all duration-300 ${isScrolling ? 'shadow-lg' : 'shadow-2xl'}`}>
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Información Empresarial
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Tu empresa será validada manualmente por nuestro equipo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Información de la empresa */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-gray-700 font-medium">
                    Razón Social
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="company"
                      placeholder="EMPRESA EJEMPLO LTDA"
                      className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/70 gpu-accelerated"
                      {...register("company")}
                    />
                  </div>
                  {errors.company && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.company.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rut" className="text-gray-700 font-medium">
                    RUT Empresa
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="rut"
                      placeholder="76123456-7"
                      className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/70 gpu-accelerated"
                      {...register("rut")}
                    />
                  </div>
                  {errors.rut && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.rut.message}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType" className="text-gray-700 font-medium">
                  Giro Comercial
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <Input
                    id="businessType"
                    placeholder="Comercio al por mayor de productos de aseo"
                    className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/70"
                    {...register("businessType")}
                  />
                </div>
                {errors.businessType && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.businessType.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Información de contacto */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Nombre Contacto
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="name"
                      placeholder="María González"
                      className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/70 gpu-accelerated"
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.name.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Corporativo
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contacto@empresa.cl"
                      className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/70 gpu-accelerated"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.email.message}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">
                  Teléfono
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56412345678"
                    className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/70"
                    {...register("phone")}
                    onKeyPress={(e) => {
                      // Permitir solo números y el símbolo + al inicio
                      const char = e.key;
                      const currentValue = (e.target as HTMLInputElement).value;
                      const isNumber = /[0-9]/.test(char);
                      const isPlus = char === '+' && currentValue.length === 0;
                      if (!isNumber && !isPlus) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      // Filtrar cualquier carácter que no sea número o + al inicio
                      const value = e.target.value;
                      let filtered = value.replace(/[^0-9+]/g, '');
                      // Si hay un +, solo permitirlo al inicio
                      if (filtered.includes('+')) {
                        const hasPlusAtStart = filtered.startsWith('+');
                        const numbersOnly = filtered.replace(/\+/g, '');
                        filtered = hasPlusAtStart ? '+' + numbersOnly : numbersOnly;
                      }
                      if (filtered !== value) {
                        e.target.value = filtered;
                        // Actualizar el valor en react-hook-form
                        const { onChange } = register("phone");
                        onChange({ target: { value: filtered, name: "phone" } });
                      }
                    }}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.phone.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Direcciones */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Direcciones</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress" className="text-gray-700 font-medium">
                    Dirección de Facturación
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="billingAddress"
                      placeholder="Av. Principal 123, Concepción"
                      className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/70 gpu-accelerated"
                      {...register("billingAddress")}
                    />
                  </div>
                  {errors.billingAddress && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.billingAddress.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddress" className="text-gray-700 font-medium">
                    Dirección de Despacho
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <Input
                      id="shippingAddress"
                      placeholder="Av. Secundaria 456, Talcahuano"
                      className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/70 gpu-accelerated"
                      {...register("shippingAddress")}
                    />
                  </div>
                  {errors.shippingAddress && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.shippingAddress.message}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div className="pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/70"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack}
                  className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
                >
                  Volver
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-optimized transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 animation-optimized" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                      <span>Registrando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Crear Cuenta Empresa</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </Button>
              </div>

              <div className="text-center mt-6 pt-4 border-t border-gray-100">
                <p className="text-gray-500 text-sm">
                  ¿Ya tienes cuenta? 
                  <a 
                    href="/auth/login" 
                    className="text-emerald-600 hover:text-emerald-700 font-semibold ml-1"
                  >
                    Inicia sesión
                  </a>
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}