"use client"

import { memo } from "react"
import { Button } from "@/components/ui"
import { ArrowRight, Building, Shield, Zap, Truck, Eye, Lock } from "lucide-react"
import { HydrationBoundary } from "@/components/HydrationBoundary"
import Image from "next/image"


import Link from "next/link"


const HeroSection = memo(function HeroSection() {
  return (
    <HydrationBoundary>
      <main className="relative">
      <div 
        className="relative text-white overflow-hidden min-h-[60vh] flex items-center hero-section hero-background shadow-2xl"
        style={{
          backgroundImage: 'url(/images/ecofor.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Overlay más oscuro para mejor legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/80"></div>
        {/* Overlay adicional para el área de texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Contenido Principal */}
            <div className="lg:col-span-7 space-y-6 relative z-10">
              
              {/* Headline principal */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-lg">
                  <span className="block text-white mb-1 drop-shadow-lg">Distribuidora líder en</span>
                  <span className="block bg-gradient-to-r from-emerald-200 via-emerald-100 to-emerald-200 bg-clip-text text-transparent drop-shadow-lg">
                    abastecimiento empresarial
                  </span>
                  <span className="block text-white/95 text-2xl md:text-3xl font-bold mt-2 drop-shadow-lg">
                    para la región del Bío-Bío
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-emerald-50 font-medium max-w-2xl leading-relaxed drop-shadow-md">
                  Papelería institucional • Productos químicos • Artículos de limpieza • EPP certificado • Ofertas especiales
                </p>
              </div>
              
              {/* Features destacados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/30 shadow-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-emerald-500/30 rounded flex items-center justify-center">
                      <Shield className="h-3 w-3 text-emerald-300" />
                    </div>
                    <h3 className="font-bold text-white text-sm drop-shadow-lg">Solo Empresas</h3>
                  </div>
                  <p className="text-white/90 text-xs drop-shadow-md">Facturación empresarial exclusiva</p>
                </div>
                
                <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/30 shadow-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-yellow-500/30 rounded flex items-center justify-center">
                      <Zap className="h-3 w-3 text-yellow-300" />
                    </div>
                    <h3 className="font-bold text-white text-sm drop-shadow-lg">Validación Rápida</h3>
                  </div>
                  <p className="text-white/90 text-xs drop-shadow-md">Proceso en menos de 30 minutos</p>
                </div>
                
                <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/30 shadow-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-blue-500/30 rounded flex items-center justify-center">
                      <Truck className="h-3 w-3 text-blue-300" />
                    </div>
                    <h3 className="font-bold text-white text-sm drop-shadow-lg">Entrega Regional</h3>
                  </div>
                  <p className="text-white/90 text-xs drop-shadow-md">Cobertura completa Bío-Bío</p>
                </div>
              </div>
              
              {/* CTAs principales */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/catalogo">
                  <Button 
                    size="lg" 
                    className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-4 text-lg shadow-2xl border-2 border-white group"
                  >
                    <Eye className="mr-3 h-5 w-5" />
                    Explorar Catálogo
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/registro">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 font-bold px-8 py-4 text-lg shadow-2xl border-2 border-emerald-400 group"
                  >
                    <Building className="mr-3 h-5 w-5" />
                    Acceso Empresarial
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Panel lateral de acceso */}
            <div className="lg:col-span-5 relative z-10">
              <div className="bg-black/40 backdrop-blur-md border border-white/30 rounded-xl p-6 shadow-xl">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mx-auto shadow-lg">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 drop-shadow-lg">
                      Acceso Exclusivo a Precios
                    </h3>
                    <p className="text-white/95 text-sm leading-relaxed drop-shadow-md">
                      Para ver precios mayoristas necesitas registrarte y ser validado por nuestro equipo especializado.
                    </p>
                  </div>
                  <div className="bg-emerald-500/30 rounded-lg p-3 border border-emerald-400/30">
                    <p className="text-emerald-100 font-semibold text-sm drop-shadow-md">
                      Proceso 100% gratuito y rápido
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
    </HydrationBoundary>
  )
})

export default HeroSection
