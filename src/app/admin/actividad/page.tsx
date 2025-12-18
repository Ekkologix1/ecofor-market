"use client"









import { Card, CardContent, Button, Badge, Input } from "@/components/ui"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { HydrationBoundary } from "@/components/HydrationBoundary"

import { 
  ArrowLeft, 
  Activity, 
  Clock, 
  Eye, 
  User, 
  Building, 
  Shield, 
  X, 
  Calendar, 
  Mail, 
  Phone,
  Search,
  Users,
  TrendingUp,
  MonitorSpeaker
} from "lucide-react"
import Image from "next/image"

interface UserActivity {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN" | "VENDEDOR"
  type: "NATURAL" | "EMPRESA"
  validated: boolean
  lastActivity: string
  totalSessions: number
  averageSessionTime: number
  isOnline: boolean
}

interface UserDetails {
  user: {
    id: string
    name: string
    email: string
    role: string
    type: string
    validated: boolean
    createdAt: string
    phone?: string
    rut?: string
    company?: string
  }
  recentActivity: Array<{
    action: string
    description: string
    createdAt: string
  }>
  sessionStats: {
    totalSessions: number
    averageSessionTime: number
    totalTimeToday: number
    lastLoginTime: string
  }
}

export default function AdminActividadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  useEffect(() => {
    if (status === "loading") return
    const hasAccess = session?.user?.role === 'ADMIN' || session?.user?.role === 'VENDEDOR'
    if (!session || !hasAccess) {
      router.push("/dashboard")
      return
    }
    
    fetchUserActivity()
  }, [session, status, router])

  const fetchUserActivity = async () => {
    try {
      const response = await fetch("/api/admin/user-activity")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching user activity:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (user: UserActivity) => {
    setSelectedUser(user)
    setShowModal(true)
    setLoadingDetails(true)
    
    try {
      const response = await fetch(`/api/admin/user-details/${user.id}`)
      const data = await response.json()
      setUserDetails(data)
    } catch (error) {
      console.error("Error fetching user details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setUserDetails(null)
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalUsers = users.length
  const onlineUsers = users.filter(u => u.isOnline).length
  const validatedUsers = users.filter(u => u.validated).length
  const avgSessionTime = users.reduce((acc, u) => acc + u.averageSessionTime, 0) / users.length || 0

  if (status === "loading" || loading) {
    return (
      <HydrationBoundary>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando actividad de usuarios...</p>
          </div>
        </div>
      </HydrationBoundary>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
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

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        <div className="mb-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Monitor de Actividad de Usuarios
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Supervisa la actividad, sesiones y comportamiento de todos los usuarios registrados en la plataforma ECOFOR Market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm mb-1">Total Usuarios</p>
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
                    <p className="text-green-600 text-sm mb-1">Usuarios en Línea</p>
                    <p className="text-3xl font-bold text-green-800">{onlineUsers}</p>
                  </div>
                  <MonitorSpeaker className="h-10 w-10 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm mb-1">Usuarios Validados</p>
                    <p className="text-3xl font-bold text-emerald-800">{validatedUsers}</p>
                  </div>
                  <Shield className="h-10 w-10 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm mb-1">Sesión Promedio</p>
                    <p className="text-3xl font-bold text-purple-800">{Math.round(avgSessionTime)}m</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                placeholder="Buscar usuarios por nombre, email o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 h-12 text-base border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-emerald-200 bg-gray-50 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
        </div>

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
                                user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                              }`}></div>
                              <span className={`text-sm ${
                                user.isOnline ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {user.isOnline ? 'En línea' : 'Desconectado'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{user.email}</p>
                          
                          <div className="flex items-center space-x-3">
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
                            
                            {user.validated && (
                              <div className="flex items-center space-x-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                                <Shield className="h-3 w-3 text-emerald-600" />
                                <span className="text-xs text-emerald-700">Validado</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-8 text-center">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-700">Última Actividad</span>
                          </div>
                          <p className="text-sm text-blue-800">
                            {new Date(user.lastActivity).toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-blue-600">
                            {new Date(user.lastActivity).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                          <div className="flex items-center space-x-2 mb-1">
                            <Activity className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm text-emerald-700">Estadísticas</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-emerald-800">
                              <span className="font-semibold">{user.totalSessions}</span> sesiones
                            </p>
                            <p className="text-xs text-emerald-600">
                              {user.averageSessionTime} min promedio
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleViewDetails(user)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Ver Detalles</span>
                        </Button>
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

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200">
            
            <div className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-8 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center shadow-lg relative overflow-hidden">
                    <div className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center relative">
                      <div className="w-7 h-7 bg-white rounded-full absolute top-3"></div>
                      <div className="w-12 h-8 bg-white rounded-t-full absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
                    </div>
                  </div>
                  
                  <div className="text-white">
                    <h2 className="text-3xl font-bold mb-3">{selectedUser.name}</h2>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedUser.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
                        }`}></div>
                        <span className="text-base">
                          {selectedUser.isOnline ? 'En línea' : 'Desconectado'}
                        </span>
                      </div>
                      <div className="h-5 w-px bg-white bg-opacity-40"></div>
                      <span className="text-base">
                        {selectedUser.type === "EMPRESA" ? "Empresa" : "Persona Natural"}
                      </span>
                      <div className="h-5 w-px bg-white bg-opacity-40"></div>
                      <span className="text-base">{selectedUser.role}</span>
                      {selectedUser.validated && (
                        <>
                          <div className="h-5 w-px bg-white bg-opacity-40"></div>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-4 w-4" />
                            <span className="text-base">Validado</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-3 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            <div className="p-8">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-6"></div>
                    <p className="text-gray-600 text-lg">Cargando información del usuario...</p>
                  </div>
                </div>
              ) : userDetails ? (
                <div className="space-y-8">
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-blue-900">Información Personal</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Mail className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                            <p className="text-base text-gray-900">{userDetails.user.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      {userDetails.user.phone && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                              <Phone className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                              <p className="text-base text-gray-900">{userDetails.user.phone}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {userDetails.user.rut && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                              <User className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">RUT</p>
                              <p className="text-base text-gray-900">{userDetails.user.rut}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Fecha de registro</p>
                            <p className="text-base text-gray-900">
                              {new Date(userDetails.user.createdAt).toLocaleDateString('es-CL', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {userDetails.user.company && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                              <Building className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Empresa</p>
                              <p className="text-base text-gray-900">{userDetails.user.company}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-8 border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-emerald-900">Estadísticas de Sesión</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-4xl font-black text-blue-700 mb-2">{userDetails.sessionStats.totalSessions}</p>
                          <p className="text-sm text-blue-600 uppercase tracking-wide">Sesiones Totales</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-100">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-4xl font-black text-green-700 mb-2">{userDetails.sessionStats.averageSessionTime}</p>
                          <p className="text-sm text-green-600 uppercase tracking-wide">Min Promedio</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-4xl font-black text-purple-700 mb-2">{userDetails.sessionStats.totalTimeToday}</p>
                          <p className="text-sm text-purple-600 uppercase tracking-wide">Min Hoy</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-8 w-8 text-white" />
                          </div>
                          <div className="mb-2">
                            <p className="text-xl font-black text-orange-700">
                              {userDetails.sessionStats.lastLoginTime ? 
                                new Date(userDetails.sessionStats.lastLoginTime).toLocaleDateString('es-CL', {
                                  day: '2-digit',
                                  month: 'short'
                                })
                                : 'Nunca'
                              }
                            </p>
                            <p className="text-sm text-orange-600">
                              {userDetails.sessionStats.lastLoginTime ? 
                                new Date(userDetails.sessionStats.lastLoginTime).toLocaleTimeString('es-CL', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : ''
                              }
                            </p>
                          </div>
                          <p className="text-sm text-orange-600 uppercase tracking-wide">Último Login</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-8 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-purple-900">Actividad Reciente</h3>
                    </div>
                    
                    {userDetails.recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {userDetails.recentActivity.map((activity, index) => (
                          <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start space-x-4">
                              <div className="w-4 h-4 bg-emerald-500 rounded-full mt-2 animate-pulse flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg text-gray-900">{activity.action}</h4>
                                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                                    <span className="text-xs font-medium text-gray-600">
                                      {new Date(activity.createdAt).toLocaleString('es-CL', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-600">{activity.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                          <Activity className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl text-gray-900 mb-3">Sin actividad reciente</h3>
                        <p className="text-gray-500">Este usuario no ha registrado actividad recientemente.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-24">
                  <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <X className="h-10 w-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl text-gray-900 mb-4">Error al cargar información</h3>
                  <p className="text-gray-500 text-lg">No se pudieron obtener los detalles del usuario. Inténtalo nuevamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}