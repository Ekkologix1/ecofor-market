"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
import { UserTypeSelector, RegisterNaturalForm, RegisterEmpresaForm, OptimizedRegistrationCard, OptimizedNaturalForm, OptimizedEmpresaForm } from "@/components/auth"
import { useState, useEffect, useRef } from "react"
import { User, Building2, ShoppingCart, TrendingUp, Shield, CheckCircle, ArrowLeft, Users, Award, Home } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useScrollOptimization, useFastScrollDetection } from "@/hooks/useScrollOptimization"
import { HydrationBoundary } from "@/components/HydrationBoundary"

export default function RegisterPage() {
  const [selectedType, setSelectedType] = useState<"NATURAL" | "EMPRESA" | null>(null)

  // Deshabilitado para evitar parpadeo durante el scroll
  // Los hooks de optimización cambian backdrop-blur y causan parpadeo visual
  // useScrollOptimization()
  // useFastScrollDetection()

  const handleBack = () => {
    setSelectedType(null)
  }

  if (!selectedType) {
    return (
      <HydrationBoundary>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative">
          {/* Header fijo que cubre toda la parte superior */}
          <div className="fixed top-0 left-0 right-0 bg-white shadow-lg border-b border-gray-100 p-4 z-50">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              {/* Botón Volver a Página Principal a la izquierda */}
              <Link href="/" className="text-gray-600 hover:text-emerald-700 transition-colors">
                <Button variant="ghost" size="sm" className="flex items-center hover:bg-emerald-50">
                  <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Volver a Página Principal
                </Button>
              </Link>

              {/* Logo de Ecofor a la derecha */}
              <div className="flex items-center">
                <img
                  src="/images/logo-ecofor.png"
                  alt="ECOFOR Market"
                  className="h-8 w-auto"
                />
              </div>
            </div>
          </div>

          <div className="relative pt-20 pb-20">
            {/* Background decorative elements - Optimizados para mejor rendimiento */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-200 rounded-full shadow-optimized gpu-accelerated"></div>
              <div className="absolute top-40 right-32 w-24 h-24 bg-teal-200 rounded-full shadow-optimized gpu-accelerated"></div>
              <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-green-100 rounded-full shadow-optimized gpu-accelerated"></div>
              <div className="absolute bottom-20 right-20 w-28 h-28 bg-emerald-100 rounded-full shadow-optimized gpu-accelerated"></div>
            </div>

            {/* Grid pattern overlay - Optimizado */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 gpu-accelerated" style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23059669' fill-opacity='0.4'%3e%3ccircle cx='30' cy='30' r='1.5'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
              }}></div>
            </div>

            <div className="relative z-10 pb-12">
              {/* Hero Section */}
              <div className="px-4 pt-8 pb-12">
                <div className="max-w-4xl mx-auto text-center">
                  <div className="backdrop-blur-optimized bg-white/80 rounded-3xl shadow-optimized border-0 p-8 mb-12 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      Únete a
                      <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent"> ECOFOR</span>
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                      Accede a los mejores productos de aseo, papelería y EPP con precios exclusivos para tu negocio
                    </p>

                    {/* Estadísticas o beneficios */}
                    <div className="flex flex-wrap justify-center gap-6 text-sm">
                      <div className="flex items-center space-x-2 text-emerald-700 group">
                        <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Más de 1000+ productos</span>
                      </div>
                      <div className="flex items-center space-x-2 text-emerald-700 group">
                        <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Despacho gratuito</span>
                      </div>
                      <div className="flex items-center space-x-2 text-emerald-700 group">
                        <CheckCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Precios mayoristas</span>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Selecciona el tipo de cuenta que necesitas
                  </h2>
                  <p className="text-base text-gray-600 mb-12 max-w-lg mx-auto leading-relaxed">
                    Elige la opción que mejor se adapte a tus necesidades de compra
                  </p>
                </div>
              </div>

              {/* Selector de tipo mejorado */}
              <div className="px-4 pb-16">
                <div className="max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Persona Natural */}
                    <OptimizedRegistrationCard
                      icon={User}
                      title="Persona Natural"
                      description="Compras ocasionales para el hogar"
                      features={[
                        "Registro rápido y sencillo",
                        "Validación en 30 minutos",
                        "Acceso a catálogo completo",
                        "Descuentos por volumen"
                      ]}
                      badge={{
                        icon: Users,
                        text: "Ideal para hogares y pequeñas oficinas",
                        variant: "blue"
                      }}
                      buttonText="Continuar como Persona Natural"
                      onClick={() => setSelectedType("NATURAL")}
                    />

                    {/* Empresa */}
                    <OptimizedRegistrationCard
                      icon={Building2}
                      title="Empresa / Institución"
                      description="Compras frecuentes con precios mayoristas"
                      features={[
                        "Precios mayoristas exclusivos",
                        "Facturación empresarial",
                        "Atención personalizada",
                        "Cotizaciones y crédito"
                      ]}
                      badge={{
                        icon: TrendingUp,
                        text: "Hasta 20% de descuento",
                        variant: "emerald"
                      }}
                      buttonText="Continuar como Empresa"
                      onClick={() => setSelectedType("EMPRESA")}
                    />
                  </div>

                  {/* Información adicional */}
                  <div className="mt-16 text-center">
                    <div className="backdrop-blur-optimized bg-white/80 rounded-2xl shadow-optimized border-0 p-8 max-w-2xl mx-auto shadow-xl">
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <Shield className="h-6 w-6 text-emerald-600" />
                        <span className="font-semibold text-gray-900 text-lg">Proceso de Verificación</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-6">
                        Todas las cuentas son verificadas manualmente por nuestro equipo para garantizar la seguridad
                        y ofrecer la mejor experiencia de compra. Las personas naturales son validadas en 30 minutos,
                        mientras que las empresas pueden tomar hasta 24 horas.
                      </p>

                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-gray-500">
                          ¿Ya tienes una cuenta?
                          <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-semibold ml-1">
                            Inicia sesión aquí
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HydrationBoundary>
    )
  }

  return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative pb-20">
        {/* Background decorative elements - Optimizados */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-200 rounded-full shadow-optimized gpu-accelerated"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-teal-200 rounded-full shadow-optimized gpu-accelerated"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-green-100 rounded-full shadow-optimized gpu-accelerated"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-emerald-100 rounded-full shadow-optimized gpu-accelerated"></div>
        </div>

        {/* Grid pattern overlay - Optimizado */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 gpu-accelerated" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23059669' fill-opacity='0.4'%3e%3ccircle cx='30' cy='30' r='1.5'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
          }}></div>
        </div>

        <div className="relative z-10 px-4 py-8">
          {selectedType === "NATURAL" && <OptimizedNaturalForm onBack={handleBack} />}
          {selectedType === "EMPRESA" && <OptimizedEmpresaForm onBack={handleBack} />}
        </div>
      </div>
    </HydrationBoundary>
  )
}