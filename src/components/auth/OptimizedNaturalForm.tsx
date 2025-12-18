"use client"
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription } from "@/components/ui"
import { registerNaturalSchema, type RegisterNaturalData } from "@/lib"
import { useCSRF } from "@/hooks"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Mail, Phone, Lock, FileText, ArrowLeft, Clock } from "lucide-react"
import Image from "next/image"
import { useScrollOptimization, useFastScrollDetection } from "@/hooks/useScrollOptimization"











interface OptimizedNaturalFormProps {
  onBack: () => void
}

interface FormFieldProps {
  id: keyof RegisterNaturalData
  label: string
  placeholder: string
  type?: string
  icon: React.ReactNode
  register: ReturnType<typeof useForm<RegisterNaturalData>>['register']
  error?: string
  isScrolling: boolean
}

function OptimizedFormField({ id, label, placeholder, type = "text", icon, register, error, isScrolling }: FormFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { ref: registerRef, ...registerProps } = register(id)
  const isPhoneField = id === "phone"

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
    <div className="space-y-2">
      <Label htmlFor={id} className="text-gray-700 font-medium">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <Input
          ref={combinedRef}
          id={id}
          type={isPhoneField ? "tel" : type}
          placeholder={placeholder}
          className={`pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white/70 gpu-accelerated transition-all duration-200 ${isScrolling ? 'shadow-sm' : 'shadow-md'}`}
          {...(isPhoneField ? {} : registerProps)}
          {...(isPhoneField ? {
            onKeyPress: handlePhoneKeyPress,
            onChange: handlePhoneChange,
            ...registerProps
          } : {})}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

export function OptimizedNaturalForm({ onBack }: OptimizedNaturalFormProps) {
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
  } = useForm<RegisterNaturalData>({
    resolver: zodResolver(registerNaturalSchema)
  })

  const onSubmit = async (data: RegisterNaturalData) => {
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
        body: JSON.stringify({ ...data, type: "NATURAL" })
      })

      if (response.ok) {
        router.push("/auth/registro-exitoso")
      } else {
        const result = await response.json()
        setError(result.error || "Error al registrar usuario")
      }
    } catch (error) {
      setError("Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const fieldConfigs = [
    {
      id: "name",
      label: "Nombre Completo",
      placeholder: "Juan Pérez",
      icon: <User className="h-5 w-5 text-gray-400" />
    },
    {
      id: "rut",
      label: "RUT",
      placeholder: "12345678-9",
      icon: <FileText className="h-5 w-5 text-gray-400" />
    },
    {
      id: "email",
      label: "Correo Electrónico",
      placeholder: "juan@email.com",
      type: "email",
      icon: <Mail className="h-5 w-5 text-gray-400" />
    },
    {
      id: "phone",
      label: "Teléfono",
      placeholder: "+56912345678",
      icon: <Phone className="h-5 w-5 text-gray-400" />
    },
    {
      id: "shippingAddress",
      label: "Dirección de Despacho",
      placeholder: "Av. Principal 123, Concepción",
      icon: (
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: "password",
      label: "Contraseña",
      placeholder: "••••••••",
      type: "password",
      icon: <Lock className="h-5 w-5 text-gray-400" />
    }
  ]

  return (
    <>
      {/* Header fijo que cubre toda la parte superior */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100 p-4 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Botón Volver a la izquierda */}
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-gray-600 hover:text-blue-700 hover:bg-blue-50 gpu-accelerated transition-all duration-200"
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
      <div className="max-w-2xl mx-auto scroll-optimized px-6 py-8 pt-24">
        {/* Título y Subtítulo */}
        <div className="text-center mb-10">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Registro Persona Natural</h1>
            <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
              Accede a nuestro catálogo completo con precios exclusivos
            </p>
          </div>
        </div>

      <Card className={`backdrop-blur-optimized bg-white/80 border-0 shadow-optimized transition-all duration-300 ${isScrolling ? 'shadow-lg' : 'shadow-2xl'}`}>
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Información Personal
          </CardTitle>
          <CardDescription className="text-gray-600 text-base flex items-center justify-center space-x-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Tu cuenta será validada en máximo 30 minutos</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 gpu-accelerated">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Campos del formulario optimizados */}
            <div className="space-y-6">
              {fieldConfigs.map((field) => (
                <OptimizedFormField
                  key={field.id}
                    id={field.id as keyof RegisterNaturalData}
                  label={field.label}
                  placeholder={field.placeholder}
                  type={field.type}
                  icon={field.icon}
                  register={register}
                  error={errors[field.id as keyof RegisterNaturalData]?.message}
                  isScrolling={isScrolling}
                />
              ))}
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 gpu-accelerated">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Validación rápida</p>
                  <p>Como persona natural, tu cuenta será revisada y activada en un máximo de 30 minutos durante horario hábil.</p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack}
                  className="flex-1 h-12 border-gray-300 hover:bg-gray-50 gpu-accelerated"
                >
                  Volver
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-optimized transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 animation-optimized" 
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
                      <span>Crear Cuenta</span>
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
                    className="text-blue-600 hover:text-blue-700 font-semibold ml-1"
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
