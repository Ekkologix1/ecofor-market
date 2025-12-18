"use client"



import { memo } from "react"
import { Button, Card, CardContent } from "@/components/ui"
import { ArrowRight, Package } from "lucide-react"
import { HydrationBoundary } from "@/components/HydrationBoundary"
import Link from "next/link"


const CategoriesSection = memo(function CategoriesSection() {
  return (
    <HydrationBoundary>
      <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Efectos de fondo simplificados */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
            Nuestras <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">Categorías</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Cuatro familias de productos diseñadas para satisfacer cada necesidad empresarial con los más altos estándares de calidad
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-transform duration-200 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm scroll-optimized">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Papelería Institucional
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                Productos de oficina premium y papelería especializada para empresas e instituciones
              </p>
              <Link href="/catalogo?categoria=papeleria">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  Ver Productos
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-transform duration-200 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm scroll-optimized">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                Productos Químicos
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                Químicos especializados de grado industrial para limpieza y desinfección profesional
              </p>
              <Link href="/catalogo?categoria=quimicos">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  Ver Productos
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-transform duration-200 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm scroll-optimized">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                Artículos de Limpieza
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                Herramientas y accesorios profesionales para limpieza empresarial de alto rendimiento
              </p>
              <Link href="/catalogo?categoria=limpieza">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  Ver Productos
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-transform duration-200 border-0 shadow-md hover:-translate-y-1 bg-white/80 backdrop-blur-sm scroll-optimized">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                EPP Horeca
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                Elementos de protección personal certificados para hoteles, restaurantes y cafeterías
              </p>
              <Link href="/catalogo?categoria=epp-horeca">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 shadow-lg hover:shadow-xl transition-all duration-300">
                  Ver Productos
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      </section>
    </HydrationBoundary>
  )
})

export default CategoriesSection
