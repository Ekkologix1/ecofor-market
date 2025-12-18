"use client";
import { Button } from "@/components/ui"
import { 
  Building, 
  Package, 
  User, 
  Menu, 
  X,
  Phone,
  Mail,
  ChevronDown,
  Search,
  ShoppingCart,
  Bell
} from "lucide-react"
import { useState } from "react"
import React from "react";
import Link from "next/link";
import Image from "next/image";
;
;
;

const Header3 = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const mainNavigation = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
    { name: "Empresa", href: "/auth/registro" },
    { name: "Contacto", href: "#" },
  ];

  const catalogCategories = [
    { name: "Papelería Institucional", href: "/catalogo?categoria=papeleria", icon: "📄" },
    { name: "Productos Químicos", href: "/catalogo?categoria=quimicos", icon: "🧪" },
    { name: "Artículos de Limpieza", href: "/catalogo?categoria=limpieza", icon: "🧽" },
    { name: "EPP Certificado", href: "/catalogo?categoria=epp", icon: "🦺" },
  ];

  const userActions = [
    { name: "Mi Cuenta", href: "/dashboard", icon: User },
    { name: "Mis Pedidos", href: "/mis-pedidos", icon: Package },
    { name: "Notificaciones", href: "#", icon: Bell },
  ];

  return (
    <header className="w-full bg-white dark:bg-gray-900 shadow-lg border-b border-emerald-100 dark:border-gray-700 sticky top-0 z-50">
      {/* Header principal */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y navegación principal */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg shadow-lg transform rotate-1"></div>
                <div className="relative bg-white rounded-lg p-2 shadow-xl">
                  <Image
                    src="/images/logo-ecofor.png"
                    alt="ECOFOR Market"
                    width={100}
                    height={40}
                    priority
                    className="hover:opacity-90 transition-opacity"
                    style={{ width: "auto", height: "auto" }}
                    sizes="100px"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  ECOFOR
                </h1>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Market
                </p>
              </div>
            </Link>

            {/* Navegación principal desktop */}
            <nav className="hidden lg:flex items-center space-x-6">
              {mainNavigation.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors relative group"
                >
                  {item.name}
                  {item.name === "Catálogo" && (
                    <ChevronDown className="w-3 h-3 ml-1 inline" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Barra de búsqueda */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-3">
            {/* Carrito */}
            <Link href="/catalogo">
              <Button 
                variant="ghost" 
                size="sm"
                className="relative text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </Link>

            {/* Notificaciones */}
            <Button 
              variant="ghost" 
              size="sm"
              className="relative text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                2
              </span>
            </Button>

            {/* Botón de acceso */}
            <Link href="/auth/login">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-lg"
              >
                <Building className="w-4 h-4 mr-2" />
                Acceder
              </Button>
            </Link>

            {/* Botón de menú móvil */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Barra inferior con información de contacto */}
        <div className="border-t border-gray-200 dark:border-gray-700 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-600 dark:text-gray-400 space-y-1 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Phone className="w-3 h-3" />
                <span>+56 41 234 5678</span>
              </span>
              <span className="flex items-center space-x-1">
                <Mail className="w-3 h-3" />
                <span>ventas@ecofor.cl</span>
              </span>
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 font-medium">
              Líderes en abastecimiento empresarial • Bío-Bío
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <div className="space-y-4">
              {/* Búsqueda móvil */}
              <div className="md:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Navegación móvil */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Navegación
                  </h4>
                  <ul className="space-y-1">
                    {mainNavigation.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className="text-sm text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Categorías
                  </h4>
                  <ul className="space-y-1">
                    {catalogCategories.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className="text-sm text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center space-x-1"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Acciones móvil */}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/catalogo">
                  <Button 
                    variant="outline" 
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Ver Catálogo
                  </Button>
                </Link>
                
                <Link href="/auth/registro">
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Registro Empresarial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay para cerrar menú */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header3;
