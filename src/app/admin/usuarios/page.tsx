"use client"

import { Card, CardContent, Button, Badge } from "@/components/ui"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { User, Building, X, Eye, Calendar, Mail, Phone, MapPin, Briefcase, Shield, Clock, Users, CheckCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"

interface PendingUser {
  id: string
  name: string
  email: string
  rut: string
  phone: string
  type: "NATURAL" | "EMPRESA"
  company?: string
  businessType?: string
  billingAddress?: string
  shippingAddress?: string
  createdAt: string
}

interface UserDetailModalProps {
  user: PendingUser
  isOpen: boolean
  onClose: () => void
  onApprove: (userId: string) => void
  onReject: (userId: string) => void
  isProcessing: boolean
}

function UserDetailModal({ user, isOpen, onClose, onApprove, onReject, isProcessing }: UserDetailModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Bloquear scroll cuando el modal esté abierto
  useEffect(() => {
    if (!isOpen) return
    
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200">
        
        {/* Header del modal premium */}
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
                <h2 className="text-3xl font-bold mb-3">{user.name}</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-base font-medium">Pendiente de validación</span>
                  </div>
                  <div className="h-5 w-px bg-white bg-opacity-40"></div>
                  <span className="text-base font-medium">
                    {user.type === "EMPRESA" ? "Empresa" : "Persona Natural"}
                  </span>
                  <div className="h-5 w-px bg-white bg-opacity-40"></div>
                  <span className="text-base font-medium">Nuevo registro</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-3 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Información personal elegante */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900">Información Personal</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                    <p className="text-base font-semibold text-gray-900">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                    <p className="text-base font-semibold text-gray-900">{user.phone}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">RUT</p>
                    <p className="text-base font-semibold text-gray-900">{user.rut}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Fecha de registro</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información empresarial */}
          {user.type === "EMPRESA" && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-8 border border-emerald-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-900">Información Empresarial</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Building className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Razón Social</p>
                      <p className="text-base font-semibold text-gray-900">{user.company}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Giro Comercial</p>
                      <p className="text-base font-semibold text-gray-900">{user.businessType}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Dirección de Facturación</p>
                      <p className="text-base font-semibold text-gray-900">{user.billingAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-100">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Dirección de Despacho</p>
                      <p className="text-base font-semibold text-gray-900">{user.shippingAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción premium */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Decisión de Validación</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => onApprove(user.id)}
                disabled={isProcessing}
                className="h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <CheckCircle className="h-6 w-6 mr-3" />
                Aprobar Usuario
              </Button>
              <Button
                onClick={() => onReject(user.id)}
                disabled={isProcessing}
                className="h-16 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <X className="h-6 w-6 mr-3" />
                Rechazar Solicitud
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    
    fetchPendingUsers()
  }, [session, status, router])

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch("/api/admin/pending-users")
      const data = await response.json()
      setPendingUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser = (user: PendingUser) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleValidateUser = async (userId: string, approved: boolean) => {
    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/validate-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approved })
      })

      if (response.ok) {
        setPendingUsers(prev => prev.filter(user => user.id !== userId))
        handleCloseModal()
      }
    } catch (error) {
      console.error("Error validating user:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando usuarios pendientes...</p>
        </div>
      </div>
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
              Validación de Usuarios
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Revisa y aprueba las solicitudes de registro pendientes para mantener la calidad y seguridad de la plataforma ECOFOR Market
            </p>
          </div>

          {/* Estadísticas globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium mb-1">Usuarios Pendientes</p>
                    <p className="text-3xl font-bold text-blue-800">{pendingUsers.length}</p>
                  </div>
                  <Clock className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-medium mb-1">Empresas</p>
                    <p className="text-3xl font-bold text-emerald-800">
                      {pendingUsers.filter(u => u.type === "EMPRESA").length}
                    </p>
                  </div>
                  <Building className="h-10 w-10 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium mb-1">Personas Naturales</p>
                    <p className="text-3xl font-bold text-purple-800">
                      {pendingUsers.filter(u => u.type === "NATURAL").length}
                    </p>
                  </div>
                  <User className="h-10 w-10 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {pendingUsers.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6 text-center py-16">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">¡Excelente trabajo!</h3>
              <p className="text-gray-500 text-lg mb-2">No hay usuarios pendientes de validación</p>
              <p className="text-gray-400">Todas las solicitudes de registro han sido procesadas</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                {pendingUsers.map((user) => (
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
                              : "bg-gradient-to-br from-blue-100 to-blue-200"
                          }`}>
                            {user.type === "EMPRESA" ? (
                              <Building className="h-7 w-7 text-green-600" />
                            ) : (
                              <User className="h-7 w-7 text-blue-600" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                                <span className="text-sm font-medium text-orange-700">Pendiente</span>
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
                                {user.type === "EMPRESA" ? "Empresa" : "Persona Natural"}
                              </Badge>
                              
                              {user.company && (
                                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                  {user.company}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="flex items-center space-x-8 text-center">
                          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <User className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-700">RUT</span>
                            </div>
                            <p className="text-sm text-purple-800 font-semibold">{user.rut}</p>
                          </div>

                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <Calendar className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-700">Registro</span>
                            </div>
                            <p className="text-sm text-orange-800 font-semibold">
                              {new Date(user.createdAt).toLocaleDateString('es-CL', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </p>
                          </div>

                          {/* Botón de acción */}
                          <Button
                            onClick={() => handleViewUser(user)}
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
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modal de detalles */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApprove={(userId) => handleValidateUser(userId, true)}
          onReject={(userId) => handleValidateUser(userId, false)}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}