"use client"

import { Button, Card, CardContent } from "@/components/ui"
import { 
  ArrowRight, 
  Building, 
  Package, 
  CheckCircle, 
  Truck, 
  Shield, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  Zap,
  Eye,
  Lock,
  Sparkles
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useState, useEffect, useRef } from "react"
import { useScrollOptimization, useFastScrollDetection } from "@/hooks/useScrollOptimization"
import { HydrationBoundary, HydrationSafe } from "@/components"

// Lazy loading de componentes pesados
const HeroSection = dynamic(() => import("@/components/home/HeroSection"), {
  loading: () => <div className="h-screen bg-gray-900 animate-pulse" />,
  ssr: true
})

const CategoriesSection = dynamic(() => import("@/components/home/CategoriesSection"), {
  loading: () => <div className="h-96 bg-gray-50 animate-pulse" />,
  ssr: true
})

const FeaturedProductsSection = dynamic(() => import("@/components/home/FeaturedProductsSection"), {
  loading: () => <div className="h-96 bg-gray-900 animate-pulse" />,
  ssr: true
})

export default function HomePage() {
  const [isScrolling, setIsScrolling] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollY = useRef(0)

  // Aplicar optimizaciones de scroll
  useScrollOptimization()
  useFastScrollDetection()

  // Animación de entrada
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Detectar scroll activo para optimizar rendering y controlar visibilidad del header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Detectar dirección del scroll
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolleando hacia abajo y ya pasamos los 100px
        setHeaderVisible(false)
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolleando hacia arriba
        setHeaderVisible(true)
      }
      
      // Si estamos en la parte superior, siempre mostrar el header
      if (currentScrollY < 10) {
        setHeaderVisible(true)
      }
      
      lastScrollY.current = currentScrollY
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

  return (
    <HydrationBoundary>
      <HydrationSafe className="min-h-screen bg-gray-50 scroll-optimized">
      {/* Header Moderno con Microanimaciones */}
      <header className={`bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50 scroll-optimized transform-gpu transition-transform duration-300 ease-in-out ${
        headerVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo con animación */}
            <div className="flex items-center">
              <Link href="/" className="relative group">
                <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition-all duration-500"></div>
                <Image
                  src="/images/logo-ecofor.png"
                  alt="ECOFOR Market"
                  width={160}
                  height={75}
                  priority
                  className="relative transform group-hover:scale-110 transition-all duration-500 ease-out drop-shadow-lg"
                  placeholder="empty"
                  style={{ width: "auto", height: "auto" }}
                  sizes="(max-width: 768px) 120px, 160px"
                />
              </Link>
            </div>

            {/* Botones de Acción con animaciones mejoradas */}
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button 
                  variant="ghost" 
                  className="relative text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-300 font-medium overflow-hidden group"
                >
                  <span className="relative z-10">Iniciar Sesión</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-emerald-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Button>
              </Link>
              <Link href="/auth/registro">
                <Button className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-700 text-white shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 font-semibold px-6 overflow-hidden group bg-[length:200%_100%] animate-gradient">
                  <span className="relative z-10 flex items-center gap-2">
                    Registrarse
                    <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Componente optimizado */}
      <HeroSection />

      {/* Categories Section - Componente optimizado */}
      <CategoriesSection />

        {/* Sección de Ofertas Especiales - Componente dinámico */}
        <FeaturedProductsSection isScrolling={isScrolling} />

        {/* Sección de Propuesta de Valor Premium con Microanimaciones */}
        <section className="py-20 bg-white relative overflow-hidden">
          {/* Efectos de fondo animados - Reducidos para mejor legibilidad */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-50 to-blue-100 rounded-full filter blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-purple-50 to-pink-50 rounded-full filter blur-3xl opacity-20"></div>
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
                ¿Por qué elegir{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]">
                    ECOFOR
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-emerald-400 transform scale-x-0 animate-scale-x"></div>
                </span>
                ?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Más de 15 años siendo la referencia en abastecimiento empresarial en la región del Bío-Bío
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {[
                {
                  title: "Solo Facturación Empresarial",
                  description: "Trabajamos exclusivamente con facturas para empresas e instituciones. Sin boletas, sin complicaciones tributarias.",
                  color: "emerald",
                  delay: "200ms",
                  colorClasses: {
                    hoverText: "group-hover:text-emerald-600",
                    borderGradient: "from-emerald-400 to-emerald-600",
                    underline: "bg-emerald-500",
                    iconBg: "from-emerald-100 to-emerald-200",
                    iconText: "text-emerald-600"
                  }
                },
                {
                  title: "Precios Mayoristas Exclusivos",
                  description: "Accede a precios especiales para empresas con descuentos progresivos por volumen y listas diferenciadas.",
                  color: "blue",
                  delay: "300ms",
                  colorClasses: {
                    hoverText: "group-hover:text-blue-600",
                    borderGradient: "from-blue-400 to-blue-600",
                    underline: "bg-blue-500",
                    iconBg: "from-blue-100 to-blue-200",
                    iconText: "text-blue-600"
                  }
                },
                {
                  title: "Validación Ultra Rápida",
                  description: "Tu cuenta será validada en máximo 30 minutos para personas naturales y 24 horas para empresas.",
                  color: "purple",
                  delay: "400ms",
                  colorClasses: {
                    hoverText: "group-hover:text-purple-600",
                    borderGradient: "from-purple-400 to-purple-600",
                    underline: "bg-purple-500",
                    iconBg: "from-purple-100 to-purple-200",
                    iconText: "text-purple-600"
                  }
                },
                {
                  title: "Entrega Premium Garantizada",
                  description: "Despacho gratuito en Gran Concepción sobre $35.000 netos. Rutas establecidas a otras ciudades.",
                  color: "orange",
                  delay: "500ms",
                  colorClasses: {
                    hoverText: "group-hover:text-orange-600",
                    borderGradient: "from-orange-400 to-orange-600",
                    underline: "bg-orange-500",
                    iconBg: "from-orange-100 to-orange-200",
                    iconText: "text-orange-600"
                  }
                },
                {
                  title: "Atención VIP Personalizada",
                  description: "Para empresas grandes ofrecemos atención directa con vendedores especializados y asesoría técnica.",
                  color: "red",
                  delay: "600ms",
                  colorClasses: {
                    hoverText: "group-hover:text-red-600",
                    borderGradient: "from-red-400 to-red-600",
                    underline: "bg-red-500",
                    iconBg: "from-red-100 to-red-200",
                    iconText: "text-red-600"
                  }
                },
                {
                  title: "+15 Años de Excelencia",
                  description: "Abastecemos hoteles, puertos, jardines infantiles y empresas de todo tipo con productos certificados.",
                  color: "yellow",
                  delay: "700ms",
                  colorClasses: {
                    hoverText: "group-hover:text-yellow-600",
                    borderGradient: "from-yellow-400 to-yellow-600",
                    underline: "bg-yellow-500",
                    iconBg: "from-yellow-100 to-yellow-200",
                    iconText: "text-yellow-600"
                  }
                }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 opacity-0 animate-fade-in-up border-2 border-gray-200 overflow-hidden z-10"
                  style={{ animationDelay: item.delay, animationFillMode: 'forwards' }}
                >
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                  
                  {/* Borde animado */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.colorClasses.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm`}></div>
                  
                  {/* Fondo sólido para asegurar contraste */}
                  <div className="absolute inset-0 bg-white rounded-2xl -z-20"></div>
                  
                  {/* Contenido con z-index alto para estar sobre los efectos */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-black text-black mb-4">
                      {item.title}
                    </h3>
                    <p className="text-gray-900 text-base leading-relaxed font-semibold">
                      {item.description}
                    </p>
                  </div>
                  
                  {/* Icono decorativo */}
                  <div className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-br ${item.colorClasses.iconBg} rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-500 z-20`}>
                    <CheckCircle className={`h-6 w-6 ${item.colorClasses.iconText}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final Premium con Microanimaciones */}
        <section className="py-24 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white relative overflow-hidden">
          {/* Efectos de fondo animados */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-700/20 via-transparent to-emerald-700/20 animate-pulse"></div>
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Imagen con efecto hover */}
              <div className="relative group opacity-0 animate-fade-in-left" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500"></div>
                <Image
                  src="/images/elite.jpg"
                  alt="ECOFOR Elite - Distribuidora oficial"
                  width={600}
                  height={400}
                  className="relative w-full h-auto max-w-lg mx-auto rounded-2xl shadow-2xl transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-500"
                  quality={90}
                  loading="lazy"
                  placeholder="empty"
                  style={{ width: "auto", height: "auto" }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                />
              </div>
              
              <div className="text-center lg:text-left space-y-8 opacity-0 animate-fade-in-right" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                <div>
                  <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                    <span className="block text-white transform hover:scale-105 transition-transform duration-300 inline-block">
                      ¿Listo para acceder a
                    </span>
                    <span className="block bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-300 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%] transform hover:scale-105 transition-transform duration-300 inline-block">
                      precios mayoristas?
                    </span>
                  </h2>
                  <p className="text-xl text-emerald-100 leading-relaxed max-w-xl">
                    Únete a más de 500 empresas líderes que confían en ECOFOR para sus insumos profesionales. 
                    El registro es completamente gratuito y la validación toma menos de 30 minutos.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/auth/registro">
                    <Button 
                      size="lg" 
                      className="relative bg-white text-emerald-700 hover:bg-emerald-50 hover:scale-110 hover:-translate-y-1 transition-all duration-300 font-bold px-8 py-6 text-lg shadow-2xl border-2 border-white hover:shadow-emerald-500/50 group overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        <Building className="h-6 w-6 group-hover:animate-bounce" />
                        Registrar mi Empresa
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-emerald-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </Button>
                  </Link>
                  <Link href="/catalogo">
                    <Button 
                      size="lg" 
                      className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 text-white hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-700 hover:scale-110 hover:-translate-y-1 transition-all duration-300 font-bold px-8 py-6 text-lg shadow-2xl border-2 border-emerald-500 hover:shadow-emerald-400/50 group overflow-hidden bg-[length:200%_100%] animate-gradient"
                      onClick={() => {
                        sessionStorage.setItem('cameFromHome', 'true')
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        Explorar Catálogo
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </Button>
                  </Link>
                </div>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-emerald-100">
                  {[
                    { icon: CheckCircle, text: "Sin costo de registro", color: "emerald-300" },
                    { icon: Zap, text: "Validación en 30 min", color: "yellow-300" },
                    { icon: Eye, text: "Acceso inmediato", color: "blue-300" }
                  ].map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-3 group cursor-pointer transform hover:scale-110 transition-all duration-300"
                    >
                      <div className="relative w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all duration-300 overflow-hidden">
                        <item.icon className={`h-6 w-6 text-${item.color} relative z-10 group-hover:scale-110 transition-transform duration-300`} />
                        <div className="absolute inset-0 bg-white/20 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                      </div>
                      <span className="font-semibold text-lg group-hover:text-white transition-colors duration-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Footer Premium con Microanimaciones */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white relative overflow-hidden border-t border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/10 via-transparent to-blue-900/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sección principal del footer */}
          <div className="py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Sección de la empresa */}
              <div className="md:col-span-2 lg:col-span-2 space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <div className="flex items-center group">
                  <div className="relative">
                    <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition-all duration-500"></div>
                    <Image
                      src="/images/logo-ecofor.png"
                      alt="ECOFOR Market"
                      width={140}
                      height={60}
                      className="relative brightness-0 invert group-hover:scale-110 transition-all duration-500"
                      loading="lazy"
                      placeholder="empty"
                      style={{ width: "auto", height: "auto" }}
                      sizes="140px"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-300 text-base leading-relaxed max-w-lg">
                    Más de 15 años siendo líderes en abastecimiento empresarial en la región del Bío-Bío 
                    con productos de aseo, papelería y EPP de la más alta calidad certificada.
                  </p>
                  
                  <div className="flex items-center space-x-3 text-gray-300 group hover:text-emerald-400 transition-all duration-300 cursor-pointer">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                      <MapPin className="h-5 w-5 text-emerald-400 group-hover:animate-bounce" />
                    </div>
                    <span className="font-medium">Región del Bío-Bío, Chile</span>
                  </div>
                </div>
              </div>

              {/* Sección de enlaces principales */}
              <div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h3 className="text-xl font-bold text-white mb-4">Enlaces Principales</h3>
                </div>
                <nav className="space-y-2">
                  {[
                    { href: "/catalogo", text: "Catálogo de Productos" },
                    { href: "/auth/registro", text: "Registro Empresarial" },
                    { href: "/auth/login", text: "Iniciar Sesión" },
                    { href: "#", text: "Términos y Condiciones" }
                  ].map((link, index) => (
                    <Link 
                      key={index}
                      href={link.href} 
                      className="text-gray-300 hover:text-emerald-400 transition-all duration-300 flex items-center space-x-2 group py-2 px-3 rounded-lg hover:bg-white/5 transform hover:translate-x-2"
                    >
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                      <span className="font-medium">{link.text}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Sección de contactos */}
              <div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-xl font-bold text-white mb-4">Contactos</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 group p-3 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer transform hover:scale-105">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/30 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                      <Phone className="h-5 w-5 text-emerald-400 group-hover:animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">+56 41 234 5678</div>
                      <div className="text-gray-400 text-sm mt-1">Lunes a Viernes 8:00 - 18:00</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 group p-3 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer transform hover:scale-105">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                      <Mail className="h-5 w-5 text-blue-400 group-hover:animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">ventas@ecofor.cl</div>
                      <div className="text-gray-400 text-sm mt-1">Respuesta garantizada en 24 horas</div>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          </div>
          
          {/* Sección inferior del footer */}
          <div className="border-t border-gray-700/50 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-3 lg:space-y-0">
              <div className="text-gray-400 text-sm">
                © 2025 ECOFOR Market. Todos los derechos reservados.
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center space-x-2 hover:text-emerald-400 transition-colors duration-300">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span>RUT: 76.XXX.XXX-X</span>
                </span>
                <span className="hidden sm:inline">|</span>
                <span className="hover:text-emerald-400 transition-colors duration-300">Giro: Comercio al por mayor especializado</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </HydrationSafe>
    </HydrationBoundary>
  )
}