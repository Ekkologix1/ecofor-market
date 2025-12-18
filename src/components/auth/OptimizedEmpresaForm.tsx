"use client"
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from "@/components/ui"
import { registerEmpresaSchema, type RegisterEmpresaData } from "@/lib"
import { useCSRF } from "@/hooks"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, User, Mail, Phone, MapPin, Lock, FileText, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useScrollOptimization, useFastScrollDetection } from "@/hooks/useScrollOptimization"











interface OptimizedEmpresaFormProps {
  onBack: () => void
}

interface FormFieldProps {
  id: keyof RegisterEmpresaData
  label: string
  placeholder: string
  type?: string
  icon: React.ReactNode
  register: ReturnType<typeof useForm<RegisterEmpresaData>>['register']
  error?: string
  isScrolling: boolean
  className?: string
}

function OptimizedFormField({ id, label, placeholder, type = "text", icon, register, error, isScrolling, className = "" }: FormFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { ref: registerRef, ...registerProps } = register(id)

  // Optimizar rendering durante scroll
  useEffect(() => {
    if (inputRef.current) {
      if (isScrolling) {
        inputRef.current.style.willChange = 'auto'
      } else {
        inputRef.current.style.willChange = 'transform, opacity'
      }
    }
  }, [isScrolling])

  // Combinar refs
  const combinedRef = useCallback((node: HTMLInputElement) => {
    inputRef.current = node
    if (registerRef) {
      if (typeof registerRef === 'function') {
        registerRef(node)
      } else if (registerRef && 'current' in registerRef) {
        (registerRef as React.MutableRefObject<HTMLInputElement | null>).current = node
      }
    }
  }, [registerRef])

  const isPhoneField = id === "phone"

  // Handler para campos de teléfono - solo números
  const handlePhoneKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const char = e.key;
    const currentValue = (e.target as HTMLInputElement).value;
    const isNumber = /[0-9]/.test(char);
    const isPlus = char === '+' && currentValue.length === 0;
    if (!isNumber && !isPlus && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(char)) {
      e.preventDefault();
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permitir solo números y un + al inicio
    let filtered = value.replace(/[^0-9+]/g, '');
    // Si hay un +, solo permitirlo al inicio
    if (filtered.includes('+')) {
      const hasPlusAtStart = filtered.startsWith('+');
      const numbersOnly = filtered.replace(/\+/g, '');
      filtered = hasPlusAtStart ? '+' + numbersOnly : numbersOnly;
    }
    if (filtered !== value) {
      e.target.value = filtered;
      const { onChange } = registerProps;
      if (onChange) {
        onChange({ target: { value: filtered, name: id } } as any);
      }
    } else {
      const { onChange } = registerProps;
      if (onChange) {
        onChange(e);
      }
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Label htmlFor={id} className="text-gray-700 font-semibold text-sm block">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {icon}
        </div>
        <Input
          ref={combinedRef}
          id={id}
          type={isPhoneField ? "tel" : type}
          placeholder={placeholder}
          className={`pl-12 h-14 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/80 gpu-accelerated transition-all duration-200 rounded-xl text-base ${isScrolling ? 'shadow-sm' : 'shadow-md'} hover:shadow-lg focus:shadow-lg`}
          {...(isPhoneField ? {
            onKeyPress: handlePhoneKeyPress,
            onChange: handlePhoneChange,
            ...registerProps
          } : registerProps)}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
        </p>
      )}
    </div>
  )
}

export function OptimizedEmpresaForm({ onBack }: OptimizedEmpresaFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { token: csrfToken } = useCSRF()

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

  const empresaFields = [
    {
      id: "company",
      label: "Razón Social",
      placeholder: "EMPRESA EJEMPLO LTDA",
      icon: <Building2 className="h-5 w-5 text-gray-400" />
    },
    {
      id: "rut",
      label: "RUT Empresa",
      placeholder: "76123456-7",
      icon: <FileText className="h-5 w-5 text-gray-400" />
    }
  ]

  const businessTypeField = {
    id: "businessType",
    label: "Giro Comercial",
    placeholder: "Comercio al por mayor de productos de aseo",
    icon: (
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }

  const contactFields = [
    {
      id: "name",
      label: "Nombre Contacto",
      placeholder: "María González",
      icon: <User className="h-5 w-5 text-gray-400" />
    },
    {
      id: "email",
      label: "Email Corporativo",
      placeholder: "contacto@empresa.cl",
      type: "email",
      icon: <Mail className="h-5 w-5 text-gray-400" />
    }
  ]

  const phoneField = {
    id: "phone",
    label: "Teléfono",
    placeholder: "+56412345678",
    icon: <Phone className="h-5 w-5 text-gray-400" />
  }

  const addressFields = [
    {
      id: "billingAddress",
      label: "Dirección de Facturación",
      placeholder: "Av. Principal 123, Concepción",
      icon: <MapPin className="h-5 w-5 text-gray-400" />
    },
    {
      id: "shippingAddress",
      label: "Dirección de Despacho",
      placeholder: "Av. Secundaria 456, Talcahuano",
      icon: (
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    }
  ]

  const passwordField = {
    id: "password",
    label: "Contraseña",
    placeholder: "••••••••",
    type: "password",
    icon: <Lock className="h-5 w-5 text-gray-400" />
  }

  return (
    <>
      {/* Header fijo que cubre toda la parte superior */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100 p-4 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Botón Volver a la izquierda */}
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 gpu-accelerated transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a selección de tipo
          </Button>
          
          {/* Logo de Ecofor a la derecha */}
          <div className="flex items-center">
            <Image 
              src="/images/logo-ecofor.png" 
              alt="ECOFOR Market" 
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>
        </div>
      </div>

      {/* Contenido principal con padding superior para el header fijo */}
      <div className="max-w-3xl mx-auto scroll-optimized px-6 py-8 pt-24">
        {/* Título y Subtítulo */}
        <div className="text-center mb-10">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Registro Empresa</h1>
            <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
              Accede a precios mayoristas y beneficios exclusivos para empresas
            </p>
          </div>
        </div>

      <Card className={`backdrop-blur-optimized bg-white/90 border-0 shadow-optimized transition-all duration-300 ${isScrolling ? 'shadow-lg' : 'shadow-2xl'} rounded-3xl`}>
        <CardHeader className="text-center pb-8 pt-8">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
            Información Empresarial
          </CardTitle>
          <CardDescription className="text-gray-600 text-base leading-relaxed">
            Tu empresa será validada manualmente por nuestro equipo de profesionales
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 gpu-accelerated rounded-xl p-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {/* Información de la empresa */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {empresaFields.map((field) => (
                  <OptimizedFormField
                    key={field.id}
                    id={field.id as keyof RegisterEmpresaData}
                    label={field.label}
                    placeholder={field.placeholder}
                    icon={field.icon}
                    register={register}
                    error={errors[field.id as keyof RegisterEmpresaData]?.message}
                    isScrolling={isScrolling}
                  />
                ))}
              </div>

              <OptimizedFormField
                id={businessTypeField.id as keyof RegisterEmpresaData}
                label={businessTypeField.label}
                placeholder={businessTypeField.placeholder}
                icon={businessTypeField.icon}
                register={register}
                error={errors[businessTypeField.id as keyof RegisterEmpresaData]?.message}
                isScrolling={isScrolling}
              />
            </div>

            {/* Información de contacto */}
            <div className="pt-8 border-t border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Información de Contacto</h3>
                <p className="text-gray-600 text-sm">Datos de la persona responsable del registro</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {contactFields.map((field) => (
                  <OptimizedFormField
                    key={field.id}
                    id={field.id as keyof RegisterEmpresaData}
                    label={field.label}
                    placeholder={field.placeholder}
                    type={field.type}
                    icon={field.icon}
                    register={register}
                    error={errors[field.id as keyof RegisterEmpresaData]?.message}
                    isScrolling={isScrolling}
                  />
                ))}
              </div>

              <div className="mt-8">
                <OptimizedFormField
                  id={phoneField.id as keyof RegisterEmpresaData}
                  label={phoneField.label}
                  placeholder={phoneField.placeholder}
                  icon={phoneField.icon}
                  register={register}
                  error={errors[phoneField.id as keyof RegisterEmpresaData]?.message}
                  isScrolling={isScrolling}
                />
              </div>
            </div>

            {/* Direcciones */}
            <div className="pt-8 border-t border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Direcciones</h3>
                <p className="text-gray-600 text-sm">Ubicaciones para facturación y despacho</p>
              </div>
              
              <div className="space-y-8">
                {addressFields.map((field) => (
                  <OptimizedFormField
                    key={field.id}
                    id={field.id as keyof RegisterEmpresaData}
                    label={field.label}
                    placeholder={field.placeholder}
                    icon={field.icon}
                    register={register}
                    error={errors[field.id as keyof RegisterEmpresaData]?.message}
                    isScrolling={isScrolling}
                  />
                ))}
              </div>
            </div>

            {/* Contraseña */}
            <div className="pt-8 border-t border-gray-200">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Seguridad</h3>
                <p className="text-gray-600 text-sm">Crea una contraseña segura para tu cuenta</p>
              </div>
              
              <OptimizedFormField
                id={passwordField.id as keyof RegisterEmpresaData}
                label={passwordField.label}
                placeholder={passwordField.placeholder}
                type={passwordField.type}
                icon={passwordField.icon}
                register={register}
                error={errors[passwordField.id as keyof RegisterEmpresaData]?.message}
                isScrolling={isScrolling}
              />
            </div>

            {/* Botones */}
            <div className="pt-10 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack}
                  className="flex-1 h-14 border-gray-300 hover:bg-gray-50 gpu-accelerated text-base font-medium transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-optimized transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 animation-optimized text-base" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                      <span>Registrando empresa...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <Building2 className="h-5 w-5" />
                      <span>Crear Cuenta Empresa</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </Button>
              </div>

              {/* Información adicional */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-emerald-800">
                      <p className="font-medium mb-1">Validación empresarial</p>
                      <p>Tu empresa será revisada por nuestro equipo. El proceso de validación puede tomar hasta 24 horas durante días hábiles.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <p className="text-gray-500 text-sm">
                  ¿Ya tienes cuenta? 
                  <a 
                    href="/auth/login" 
                    className="text-emerald-600 hover:text-emerald-700 font-semibold ml-1 transition-colors duration-200"
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
    </>
  )
}
