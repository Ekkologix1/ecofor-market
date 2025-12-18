"use client"

import { LoginForm } from "@/components/auth"
import { Button } from "@/components/ui"
import { ArrowLeft, Home } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { suppressHydrationWarnings } from "@/lib/suppress-hydration-warnings"
import { HydrationBoundary } from "@/components/HydrationBoundary"
import { useState, useEffect, useRef } from "react"

export default function LoginPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Efecto parallax con el mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height
        setMousePosition({ x, y })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Activar supresión de warnings de hidratación
  suppressHydrationWarnings()
  return (
    <>
      {/* Header fijo que cubre toda la parte superior */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100 p-4 z-50 opacity-0 animate-fade-in-down" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto flex items-center justify-between" suppressHydrationWarning>
          {/* Botón Ir a Página Principal a la izquierda */}
          <Link href="/" className="text-gray-600 hover:text-emerald-700 transition-colors group">
            <Button variant="ghost" size="sm" className="flex items-center hover:bg-emerald-50 transition-all duration-300 hover:scale-105">
              <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Ir a Página Principal
            </Button>
          </Link>

          {/* Logo de Ecofor a la derecha */}
          <div className="flex items-center group" suppressHydrationWarning>
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              <Image
                src="/images/logo-ecofor.png"
                alt="ECOFOR Market"
                width={120}
                height={32}
                className="h-8 w-auto relative group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden pt-20"
        suppressHydrationWarning
      >
        {/* Background decorative elements con parallax */}
        <div className="absolute inset-0 opacity-30" suppressHydrationWarning>
          <div
            className="absolute top-20 left-20 w-32 h-32 bg-emerald-200 rounded-full blur-xl animate-float"
            style={{
              transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px)`
            }}
            suppressHydrationWarning
          ></div>
          <div
            className="absolute top-40 right-32 w-24 h-24 bg-teal-200 rounded-full blur-lg animate-float animation-delay-2000"
            style={{
              transform: `translate(${-mousePosition.x * 20}px, ${mousePosition.y * 10}px)`
            }}
            suppressHydrationWarning
          ></div>
          <div
            className="absolute bottom-32 left-1/4 w-40 h-40 bg-green-100 rounded-full blur-2xl animate-float animation-delay-4000"
            style={{
              transform: `translate(${mousePosition.x * 10}px, ${-mousePosition.y * 15}px)`
            }}
            suppressHydrationWarning
          ></div>
          <div
            className="absolute bottom-20 right-20 w-28 h-28 bg-emerald-100 rounded-full blur-xl animate-float"
            style={{
              transform: `translate(${-mousePosition.x * 12}px, ${-mousePosition.y * 18}px)`
            }}
            suppressHydrationWarning
          ></div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" suppressHydrationWarning>
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23059669' fill-opacity='0.4'%3e%3ccircle cx='30' cy='30' r='1.5'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
          }} suppressHydrationWarning></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

            {/* Left side - Branding */}
            <div className="hidden lg:block space-y-8 pl-8 opacity-0 animate-fade-in-left animation-delay-200">
              <div className="space-y-6">
                <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                  Accede a tu
                  <span className="text-emerald-600 block bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">Portal ECOFOR</span>
                </h1>

                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Gestiona tus pedidos, consulta precios exclusivos y accede a nuestro catálogo completo de insumos de aseo profesional.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 group opacity-0 animate-fade-in-left animation-delay-300">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-200 transition-all duration-300">
                    <svg className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-emerald-600 transition-colors">Precios exclusivos por volumen</span>
                </div>

                <div className="flex items-center space-x-3 group opacity-0 animate-fade-in-left animation-delay-400">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-200 transition-all duration-300">
                    <svg className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-emerald-600 transition-colors">Seguimiento en tiempo real</span>
                </div>

                <div className="flex items-center space-x-3 group opacity-0 animate-fade-in-left animation-delay-500">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-200 transition-all duration-300">
                    <svg className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-emerald-600 transition-colors">Proceso de compra optimizado</span>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="pt-8 border-t border-gray-200 opacity-0 animate-fade-in-left animation-delay-600">
                <p className="text-sm text-gray-500 mb-4">Confianza empresarial desde 2018</p>
                <div className="flex items-center space-x-6">
                  <div className="text-center group cursor-default">
                    <div className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors animate-counter animation-delay-700">500+</div>
                    <div className="text-xs text-gray-500">Empresas activas</div>
                  </div>
                  <div className="text-center group cursor-default">
                    <div className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors animate-counter animation-delay-800">24h</div>
                    <div className="text-xs text-gray-500">Tiempo respuesta</div>
                  </div>
                  <div className="text-center group cursor-default">
                    <div className="text-2xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors animate-counter animation-delay-800">99%</div>
                    <div className="text-xs text-gray-500">Disponibilidad</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex items-center justify-center opacity-0 animate-fade-in-right animation-delay-300">
              <div className="w-full max-w-md">
                {/* Título y subtítulo */}
                <div className="text-center mb-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Portal ECOFOR</h2>
                    <p className="text-gray-600">Insumos profesionales para empresas y personas</p>
                  </div>
                </div>

                {/* Login Form */}
                <LoginForm />

                {/* Additional info for mobile */}
                <div className="lg:hidden mt-8 pt-6 border-t border-gray-200">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Accede a precios exclusivos y gestiona tus pedidos profesionales
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}