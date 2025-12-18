"use client"













import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Input, Label, Alert, AlertDescription } from "@/components/ui"
import { createRoleUserSchema, CreateRoleUserData } from "@/lib"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Shield, UserCheck, ArrowLeft, Plus, Trash2, AlertTriangle, Users, UserPlus, Settings } from "lucide-react"
import Image from "next/image"



import { HydrationBoundary } from "@/components/HydrationBoundary"

interface RoleUser {
  id: string
  name: string
  email: string
  rut: string
  role: "ADMIN" | "VENDEDOR"
  validated: boolean
  createdAt: string
}

interface RolePermissions {
  [key: string]: string[]
}

const rolePermissions: RolePermissions = {
  ADMIN: [
    "Validar usuarios",
    "Gestionar todos los usuarios",
    "Crear y eliminar vendedores",
    "Crear otros administradores (máx. 3)",
    "Gestionar productos y stock",
    "Ver todos los pedidos y cotizaciones",
    "Generar reportes completos",
    "Configurar precios y descuentos",
    "Gestionar configuración del sistema"
  ],
  VENDEDOR: [
    "Ver pedidos asignados",
    "Marcar pedidos como despachados",
    "Ver información de clientes",
    "Generar cotizaciones",
    "Ver stock disponible",
    "Contactar clientes asignados"
  ]
}

export default function AdminRolesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [roleUsers, setRoleUsers] = useState<RoleUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CreateRoleUserData>({
    resolver: zodResolver(createRoleUserSchema)
  })

  const selectedRole = watch("role")

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    
    fetchRoleUsers()
  }, [session, status, router])

  const fetchRoleUsers = async () => {
    try {
      const response = await fetch("/api/admin/role-users")
      const data = await response.json()
      setRoleUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching role users:", error)
      setError("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CreateRoleUserData) => {
    setIsCreating(true)
    setError("")
    setSuccess("")

    // Verificar límite de administradores
    const currentAdmins = roleUsers.filter(user => user.role === "ADMIN")
    if (data.role === "ADMIN" && currentAdmins.length >= 3) {
      setError("No se pueden crear más de 3 administradores")
      setIsCreating(false)
      return
    }

    try {
      const response = await fetch("/api/admin/create-role-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(`${data.role === "ADMIN" ? "Administrador" : "Vendedor"} creado exitosamente`)
        reset()
        setShowCreateForm(false)
        fetchRoleUsers()
      } else {
        setError(result.error || "Error al crear usuario")
      }
    } catch (error) {
      setError("Error al conectar con el servidor")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string, userRole: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${userName}?`)) return

    try {
      const response = await fetch("/api/admin/delete-role-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setSuccess(`${userRole === "ADMIN" ? "Administrador" : "Vendedor"} eliminado correctamente`)
        fetchRoleUsers()
      } else {
        const result = await response.json()
        setError(result.error || "Error al eliminar usuario")
      }
    } catch (error) {
      setError("Error al conectar con el servidor")
    }
  }

  if (status === "loading" || loading) {
    return (
    <HydrationBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando gestión de roles...</p>
        </div>
      </div>
    </HydrationBoundary>
    )
  }

  const adminCount = roleUsers.filter(user => user.role === "ADMIN").length
  const vendedorCount = roleUsers.filter(user => user.role === "VENDEDOR").length
  const canCreateAdmin = adminCount < 3

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
              Gestión de Roles
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Administra vendedores y otros administradores del sistema ECOFOR Market con controles avanzados de permisos y seguridad
            </p>
          </div>

          {/* Estadísticas Globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium mb-1">Administradores</p>
                    <p className="text-3xl font-bold text-red-800">{adminCount}/3</p>
                    <p className="text-xs text-red-600 mt-1">Límite máximo: 3</p>
                  </div>
                  <Shield className="h-10 w-10 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium mb-1">Vendedores</p>
                    <p className="text-3xl font-bold text-blue-800">{vendedorCount}</p>
                    <p className="text-xs text-blue-600 mt-1">Sin límite</p>
                  </div>
                  <User className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-medium mb-1">Total Roles</p>
                    <p className="text-3xl font-bold text-emerald-800">{roleUsers.length}</p>
                    <p className="text-xs text-emerald-600 mt-1">Usuarios activos</p>
                  </div>
                  <Settings className="h-10 w-10 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-0 shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500">
            <UserCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
          </Alert>
        )}

        {/* Botón Crear Usuario */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Usuario</h3>
                    <p className="text-gray-600">Agregar administrador o vendedor al sistema</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showCreateForm ? "Cancelar" : "Crear Usuario"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de creación */}
        {showCreateForm && (
          <Card className="mb-8 border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center relative">
                    {/* Cabeza del avatar */}
                    <div className="w-4 h-4 bg-white rounded-full absolute top-2"></div>
                    {/* Cuerpo del avatar */}
                    <div className="w-7 h-5 bg-white rounded-t-full absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Crear Nuevo Usuario</CardTitle>
                  <CardDescription className="text-emerald-100 text-base mt-1">
                    Completa la información para crear un administrador o vendedor del sistema
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 bg-gradient-to-b from-emerald-50 via-white to-white">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-medium">Nombre Completo</Label>
                    <Input
                      id="name"
                      placeholder="Juan Pérez"
                      {...register("name")}
                      className="h-12 text-base border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-emerald-200 bg-white shadow-sm"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.name.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rut" className="text-base font-medium">RUT</Label>
                    <Input
                      id="rut"
                      placeholder="12345678-9"
                      {...register("rut")}
                      className="h-12 text-base border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-emerald-200 bg-white shadow-sm"
                    />
                    {errors.rut && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{errors.rut.message}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@ecofor.cl"
                    {...register("email")}
                    className="h-12 text-base border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-emerald-200 bg-white shadow-sm"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{errors.email.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-base font-medium">Rol</Label>
                  <select
                    id="role"
                    {...register("role")}
                    className="w-full h-12 px-4 text-base border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-emerald-200 bg-white shadow-sm transition-all duration-200"
                  >
                    <option value="">Seleccionar rol...</option>
                    <option value="VENDEDOR">Vendedor</option>
                    {canCreateAdmin && <option value="ADMIN">Administrador</option>}
                  </select>
                  {errors.role && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{errors.role.message}</span>
                    </p>
                  )}
                  {!canCreateAdmin && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-sm">
                      <p className="text-sm text-orange-800 flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Límite de administradores alcanzado (3/3)</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Permisos del rol seleccionado */}
                {selectedRole && (
                  <Card className={`border-0 shadow-lg ${
                    selectedRole === "ADMIN" 
                      ? "bg-gradient-to-br from-red-50 to-rose-100 border-l-4 border-l-red-500" 
                      : "bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-l-blue-500"
                  }`}>
                    <CardHeader>
                      <CardTitle className={`text-lg flex items-center space-x-3 ${
                        selectedRole === "ADMIN" ? "text-red-900" : "text-blue-900"
                      }`}>
                        {selectedRole === "ADMIN" ? (
                          <Shield className="h-6 w-6 text-red-600" />
                        ) : (
                          <User className="h-6 w-6 text-blue-600" />
                        )}
                        <span>Permisos de {selectedRole === "ADMIN" ? "Administrador" : "Vendedor"}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {rolePermissions[selectedRole].map((permission, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm">
                            <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{permission}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex space-x-4 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false)
                      reset()
                      setError("")
                    }}
                    className="flex-1 h-12 text-base border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200" 
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Creando...</span>
                      </div>
                    ) : (
                      "Crear Usuario"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de usuarios */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl border-b border-gray-200">
            <CardTitle className="text-2xl text-gray-900">Usuarios con Roles Administrativos</CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Lista completa de administradores y vendedores del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {roleUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">No hay usuarios con roles administrativos</h3>
                <p className="text-gray-500">Crea el primer administrador o vendedor del sistema.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {roleUsers.map((user) => (
                  <Card 
                    key={user.id} 
                    className="border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        
                        {/* Usuario Info */}
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${
                            user.role === "ADMIN" 
                              ? "bg-gradient-to-br from-red-100 to-red-200" 
                              : "bg-gradient-to-br from-blue-100 to-blue-200"
                          }`}>
                            {user.role === "ADMIN" ? (
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
                                  {user.validated ? 'Activo' : 'Pendiente'}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-2">{user.email}</p>
                            <p className="text-sm text-gray-500">RUT: {user.rut}</p>
                            
                            <div className="flex items-center space-x-3 mt-3">
                              <Badge 
                                variant={user.role === "ADMIN" ? "destructive" : "default"}
                                className={`px-3 py-1 ${
                                  user.role === "ADMIN" 
                                    ? "bg-red-100 text-red-800 border-red-300 hover:bg-red-200" 
                                    : "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
                                }`}
                              >
                                {user.role === "ADMIN" ? "Administrador" : "Vendedor"}
                              </Badge>
                              
                              {user.id === session?.user.id && (
                                <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                  Tu cuenta
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="flex items-center space-x-6 text-center">
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <UserCheck className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">Registro</span>
                            </div>
                            <p className="text-sm text-gray-800 font-semibold">
                              {new Date(user.createdAt).toLocaleDateString('es-CL', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>

                          {/* Botón de acción */}
                          {user.id !== session?.user.id && (
                            <Button
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.name, user.role)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}