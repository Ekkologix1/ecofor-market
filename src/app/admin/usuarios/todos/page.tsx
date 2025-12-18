"use client"









import { Card, CardContent, Button, Badge, Input } from "@/components/ui"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { User, Building, ArrowLeft, Search, Edit, Shield, CheckCircle, Clock, Users, Filter } from "lucide-react"
import Image from "next/image"


import { HydrationBoundary } from "@/components/HydrationBoundary"

interface AllUser {
  id: string
  name: string
  email: string
  rut: string
  phone: string
  type: "NATURAL" | "EMPRESA"
  role: "USER" | "ADMIN" | "VENDEDOR"
  validated: boolean
  company?: string
  createdAt: string
}

export default function AdminTodosUsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<AllUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AllUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "NATURAL" | "EMPRESA">("ALL")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "VALIDATED" | "PENDING">("ALL")

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    
    fetchAllUsers()
  }, [session, status, router])

  useEffect(() => {
    let filtered = users

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.rut.includes(searchTerm)
      )
    }

    // Filtrar por tipo
    if (filterType !== "ALL") {
      filtered = filtered.filter(user => user.type === filterType)
    }

    // Filtrar por estado
    if (filterStatus === "VALIDATED") {
      filtered = filtered.filter(user => user.validated)
    } else if (filterStatus === "PENDING") {
      filtered = filtered.filter(user => !user.validated)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, filterType, filterStatus])

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/admin/all-users")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleValidation = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/toggle-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, validated: !currentStatus })
      })

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, validated: !currentStatus } : user
        ))
      }
    } catch (error) {
      console.error("Error toggling validation:", error)
    }
  }

  // Estadísticas
  const totalUsers = users.length
  const validatedUsers = users.filter(u => u.validated).length
  const pendingUsers = users.filter(u => !u.validated).length
  const companies = users.filter(u => u.type === "EMPRESA").length

  if (status === "loading" || loading) {
    return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando gestión de usuarios...</p>
        </div>
      </div>
    </HydrationBoundary>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header Profesional */}
      <header className="bg-white shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-20">
            <div className="flex justify-start">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Volver al Dashboard</span>
              </Button>
            </div>
            
            <div className="flex justify-center">
              <Image
                src="/images/logo-ecofor.png"
                alt="ECOFOR Market"
                width={160}
                height={65}
                priority
                className="h-12 w-auto"
              />
            </div>
            
            <div className="flex justify-end">
              <div className="flex items-center space-x-3 bg-emerald-50 px-4 py-2 rounded-full">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span className="text-emerald-800 font-medium">{session?.user.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Gestión de Usuarios
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Administra y supervisa todos los usuarios registrados en la plataforma ECOFOR Market con herramientas avanzadas de gestión
            </p>
          </div>

          {/* Estadísticas Globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium mb-1">Total Usuarios</p>
                    <p className="text-3xl font-bold text-blue-800">{totalUsers}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium mb-1">Usuarios Validados</p>
                    <p className="text-3xl font-bold text-green-800">{validatedUsers}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium mb-1">Pendientes</p>
                    <p className="text-3xl font-bold text-orange-800">{pendingUsers}</p>
                  </div>
                  <Clock className="h-10 w-10 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-medium mb-1">Empresas</p>
                    <p className="text-3xl font-bold text-emerald-800">{companies}</p>
                  </div>
                  <Building className="h-10 w-10 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros Avanzados */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Filtros de Búsqueda</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  placeholder="Buscar por nombre, email o RUT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 h-12 text-base border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-emerald-200 bg-gray-50 focus:bg-white transition-all duration-200"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "ALL" | "NATURAL" | "EMPRESA")}
                className="h-12 px-4 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-emerald-200 bg-gray-50 focus:bg-white transition-all duration-200 text-base"
              >
                <option value="ALL">Todos los tipos</option>
                <option value="NATURAL">Persona Natural</option>
                <option value="EMPRESA">Empresa</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "ALL" | "VALIDATED" | "PENDING")}
                className="h-12 px-4 border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-emerald-200 bg-gray-50 focus:bg-white transition-all duration-200 text-base"
              >
                <option value="ALL">Todos los estados</option>
                <option value="VALIDATED">Validados</option>
                <option value="PENDING">Pendientes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className="border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 bg-white"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      
                      {/* Usuario Info */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${
                          user.type === "EMPRESA" 
                            ? "bg-gradient-to-br from-green-100 to-green-200" 
                            : user.role === "ADMIN" 
                              ? "bg-gradient-to-br from-red-100 to-red-200" 
                              : "bg-gradient-to-br from-blue-100 to-blue-200"
                        }`}>
                          {user.type === "EMPRESA" ? (
                            <Building className="h-7 w-7 text-green-600" />
                          ) : user.role === "ADMIN" ? (
                            <Shield className="h-7 w-7 text-red-600" />
                          ) : (
                            <User className="h-7 w-7 text-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${
                                user.validated ? 'bg-green-500' : 'bg-orange-500 animate-pulse'
                              }`}></div>
                              <span className={`text-sm font-medium ${
                                user.validated ? 'text-green-700' : 'text-orange-700'
                              }`}>
                                {user.validated ? 'Validado' : 'Pendiente'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-2">{user.email}</p>
                          <p className="text-sm text-gray-500">RUT: {user.rut}</p>
                          
                          {user.company && (
                            <p className="text-sm text-gray-500 mt-1">Empresa: {user.company}</p>
                          )}
                          
                          <div className="flex items-center space-x-3 mt-3">
                            <Badge 
                              variant={user.type === "EMPRESA" ? "default" : "secondary"}
                              className={`${
                                user.type === "EMPRESA" 
                                  ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200" 
                                  : "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
                              } px-3 py-1`}
                            >
                              {user.type === "EMPRESA" ? "Empresa" : "Natural"}
                            </Badge>
                            
                            <Badge 
                              variant={
                                user.role === "ADMIN" ? "destructive" : 
                                user.role === "VENDEDOR" ? "default" : "outline"
                              }
                              className={`px-3 py-1 ${
                                user.role === "ADMIN" 
                                  ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200" 
                                  : user.role === "VENDEDOR"
                                    ? "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
                                    : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                              }`}
                            >
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="flex items-center space-x-6 text-center">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="h-4 w-4 text-indigo-600" />
                            <span className="text-sm font-medium text-indigo-700">Registro</span>
                          </div>
                          <p className="text-sm text-indigo-800 font-semibold">
                            {new Date(user.createdAt).toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col space-y-3">
                          <Button
                            size="sm"
                            onClick={() => handleToggleValidation(user.id, user.validated)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                              user.validated 
                                ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg"
                            }`}
                          >
                            {user.validated ? "Desactivar" : "Validar"}
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled
                            className="px-4 py-2 rounded-xl border-gray-300 text-gray-500"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">No se encontraron usuarios</h3>
                <p className="text-gray-500">Intenta ajustar los filtros de búsqueda para encontrar usuarios.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}