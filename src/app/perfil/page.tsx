"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Input, Label, Alert, AlertDescription } from "@/components/ui"
import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { ArrowLeft, User, Building, Shield, Calendar, Mail, Phone, MapPin, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, Edit, Building2, UserCheck, Clock, Briefcase, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useScrollOptimization, useFastScrollDetection } from "@/hooks/useScrollOptimization"



import { HydrationBoundary } from "@/components/HydrationBoundary"

interface UserProfile {
  id: string
  name: string
  email: string
  rut: string
  phone: string
  type: "NATURAL" | "EMPRESA"
  role: string
  validated: boolean
  createdAt: string
  
  // Datos empresa (solo si type = EMPRESA)
  company?: string
  businessType?: string
  billingAddress?: string
  shippingAddress?: string
}

export default function PerfilPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Scroll optimization
  useScrollOptimization()
  useFastScrollDetection()

  // Memoized computed values
  const isNaturalUser = useMemo(() => userProfile?.type === "NATURAL", [userProfile?.type])
  const isEmpresaUser = useMemo(() => userProfile?.type === "EMPRESA", [userProfile?.type])
  const formattedDate = useMemo(() => {
    if (!userProfile?.createdAt) return ''
    return new Date(userProfile.createdAt).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [userProfile?.createdAt])

  // Estados para formulario
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    deliveryAddress: '', // Para personas naturales
    company: '',
    businessType: '',
    billingAddress: '',
    shippingAddress: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
          deliveryAddress: data.user.shippingAddress || '', // Para personas naturales usamos shippingAddress como dirección de entrega
          company: data.user.company || '',
          businessType: data.user.businessType || '',
          billingAddress: data.user.billingAddress || '',
          shippingAddress: data.user.shippingAddress || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Preparar datos para enviar - mapear deliveryAddress a shippingAddress para personas naturales
      const dataToSend = { ...formData }
      if (userProfile?.type === "NATURAL") {
        dataToSend.shippingAddress = formData.deliveryAddress
      }
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' })
        setEditMode(false)
        await fetchUserProfile()
        // Actualizar session si cambió el nombre
        if (formData.name !== userProfile?.name) {
          await update()
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al actualizar perfil' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setSaving(false)
    }

    setTimeout(() => setMessage(null), 5000)
  }, [formData, userProfile, fetchUserProfile, update])

  // No mostrar loading, continuar con el contenido

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-200 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-teal-200 rounded-full blur-lg"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-green-100 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-emerald-100 rounded-full blur-xl"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <Card className="max-w-md mx-auto backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-gray-600">No se pudo cargar la información del perfil</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
      {/* Background decorative elements - Matching other pages */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-200 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-teal-200 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-green-100 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-emerald-100 rounded-full blur-xl"></div>
      </div>

      {/* Grid pattern overlay - Matching other pages */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23059669' fill-opacity='0.4'%3e%3ccircle cx='30' cy='30' r='1.5'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
        }}></div>
      </div>

      <div className="relative z-10">
        {/* Header Premium */}
        <header className="backdrop-blur-optimized bg-white/80 shadow-optimized border-b border-emerald-100 gpu-accelerated">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="flex items-center text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                  </Button>
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>
                </div>
              </div>

              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <div className="relative">
                  <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform rotate-1"></div>
                  <div className="relative bg-white rounded-xl p-3 shadow-xl">
                    <Image
                      src="/images/logo-ecofor.png"
                      alt="ECOFOR Market"
                      width={120}
                      height={55}
                      priority
                      className="object-contain"
                      sizes="120px"
                    />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Mensaje de estado */}
        {message && (
          <div className="max-w-6xl mx-auto px-4 pt-6">
            <Alert className={`backdrop-blur-sm bg-white/80 border-0 shadow-xl ${
              message.type === 'success' 
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800' 
                : 'border-red-200 bg-red-50/80 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <AlertDescription className="font-medium">
                {message.text}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Panel Izquierdo - Información del Usuario */}
            <div className="lg:col-span-1">
              <Card className="backdrop-blur-optimized bg-white/80 border-0 shadow-optimized overflow-hidden gpu-accelerated">
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-6 text-white">
                  <div className="text-center">
                    <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                      {isEmpresaUser ? (
                        <Building className="h-10 w-10 text-white" />
                      ) : (
                        <User className="h-10 w-10 text-white" />
                      )}
                    </div>
                    <h2 className="text-xl font-bold mb-1">{userProfile.name}</h2>
                    <p className="text-emerald-100 text-sm">
                      {isEmpresaUser ? userProfile.company : "Cliente Personal"}
                    </p>
                  </div>
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Estado de validación */}
                  <div className="text-center">
                    <Badge 
                      variant={userProfile.validated ? "default" : "destructive"}
                      className={`px-3 py-1.5 font-medium text-xs ${
                        userProfile.validated 
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300' 
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300'
                      }`}
                    >
                      {userProfile.validated ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1.5" />
                          Cuenta Verificada
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1.5" />
                          Pendiente Verificación
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Información no editable con diseño compacto */}
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg p-3 border border-blue-200/50">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{userProfile.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg p-3 border border-purple-200/50">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</p>
                          <p className="text-sm font-mono font-semibold text-gray-900">{userProfile.rut}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg p-3 border border-emerald-200/50">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {isEmpresaUser ? (
                            <Building2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Cuenta</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {isEmpresaUser ? "Cuenta Empresarial" : "Persona Natural"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-lg p-3 border border-orange-200/50">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Miembro desde</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formattedDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel Derecho - Información Editable */}
            <div className="lg:col-span-3">
              <Card className="backdrop-blur-optimized bg-white/80 border-0 shadow-optimized overflow-hidden gpu-accelerated">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200/50 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                        <Edit className="h-5 w-5 mr-2 text-emerald-600" />
                        Información Personal
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 text-gray-600">
                        Mantén actualizados tus datos de contacto e información empresarial
                      </CardDescription>
                    </div>
                    <Button
                      variant={editMode ? "outline" : "default"}
                      onClick={() => setEditMode(!editMode)}
                      disabled={saving}
                      size="sm"
                      className={`${
                        editMode 
                          ? 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white/70' 
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:scale-105'
                      } px-4 py-2 font-medium transition-all duration-200 animation-optimized`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {editMode ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Información básica */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2.5 pb-3 border-b border-emerald-200">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Phone className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">Datos de Contacto</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            {isEmpresaUser ? "Nombre del Contacto" : "Nombre Completo"}
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            disabled={!editMode}
                            className={`h-10 ${
                              editMode 
                                ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white" 
                                : "bg-gray-50/80 border-gray-200"
                            }`}
                            placeholder="Ingresa tu nombre completo"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                            Teléfono de Contacto
                          </Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            disabled={!editMode}
                            className={`h-10 ${
                              editMode 
                                ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white" 
                                : "bg-gray-50/80 border-gray-200"
                            }`}
                            placeholder="+56 9 1234 5678"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dirección de entrega para personas naturales */}
                    {isNaturalUser && (
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3 pb-4 border-b border-emerald-200">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Dirección de Entrega</h3>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="deliveryAddress" className="text-sm font-medium text-gray-700 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            Dirección donde recibes los productos
                          </Label>
                          <Input
                            id="deliveryAddress"
                            value={formData.deliveryAddress}
                            onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                            disabled={!editMode}
                            className={`h-12 ${
                              editMode 
                                ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white" 
                                : "bg-gray-50/80 border-gray-200"
                            }`}
                            placeholder="Calle 123, Comuna, Ciudad, Región"
                          />
                          <p className="text-xs text-gray-500">
                            Esta dirección se usará para el despacho de tus pedidos
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Información empresarial (solo si es empresa) */}
                    {isEmpresaUser && (
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3 pb-4 border-b border-emerald-200">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Datos Empresariales</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                              Razón Social
                            </Label>
                            <Input
                              id="company"
                              value={formData.company}
                              onChange={(e) => setFormData({...formData, company: e.target.value})}
                              disabled={!editMode}
                              className={`h-12 ${
                                editMode 
                                  ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white" 
                                  : "bg-gray-50/80 border-gray-200"
                              }`}
                              placeholder="Nombre legal de tu empresa"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="businessType" className="text-sm font-medium text-gray-700">
                              Giro Comercial
                            </Label>
                            <Input
                              id="businessType"
                              value={formData.businessType}
                              onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                              disabled={!editMode}
                              className={`h-12 ${
                                editMode 
                                  ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white" 
                                  : "bg-gray-50/80 border-gray-200"
                              }`}
                              placeholder="Actividad comercial principal"
                            />
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="billingAddress" className="text-sm font-medium text-gray-700 flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                              Dirección de Facturación
                            </Label>
                            <Input
                              id="billingAddress"
                              value={formData.billingAddress}
                              onChange={(e) => setFormData({...formData, billingAddress: e.target.value})}
                              disabled={!editMode}
                              className={`h-12 ${
                                editMode 
                                  ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white" 
                                  : "bg-gray-50/80 border-gray-200"
                              }`}
                              placeholder="Dirección donde recibes las facturas"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="shippingAddress" className="text-sm font-medium text-gray-700 flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                              Dirección de Despacho
                            </Label>
                            <Input
                              id="shippingAddress"
                              value={formData.shippingAddress}
                              onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                              disabled={!editMode}
                              className={`h-12 ${
                                editMode 
                                  ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white" 
                                  : "bg-gray-50/80 border-gray-200"
                              }`}
                              placeholder="Dirección donde recibes los productos"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cambio de contraseña (solo en modo edición) */}
                    {editMode && (
                      <div className="space-y-6 pt-6 border-t border-emerald-200">
                        <div className="flex items-center space-x-3 pb-4">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <Lock className="h-4 w-4 text-red-600" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Cambiar Contraseña</h3>
                          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">Opcional</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                              Contraseña Actual
                            </Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showPassword ? "text" : "password"}
                                value={formData.currentPassword}
                                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                                className="h-12 pr-12 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white"
                                placeholder="Contraseña actual"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                              Nueva Contraseña
                            </Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={formData.newPassword}
                              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                              className="h-12 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white"
                              placeholder="Mínimo 6 caracteres"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                              Confirmar Contraseña
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                              className="h-12 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white"
                              placeholder="Repetir contraseña"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    {editMode && (
                      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t border-emerald-200">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditMode(false)}
                          disabled={saving}
                          size="lg"
                          className="px-8 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white/70"
                        >
                          Cancelar Cambios
                        </Button>
                        <Button
                          type="submit"
                          disabled={saving}
                          size="lg"
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 shadow-lg hover:scale-105 transition-all duration-200 animation-optimized"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                              Guardando cambios...
                            </>
                          ) : (
                            <>
                              <Save className="h-5 w-5 mr-3" />
                              Guardar Cambios
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>

                  {/* Información sobre datos protegidos */}
                  {!editMode && (
                    <div className="mt-8 pt-8 border-t border-emerald-200">
                      <Alert className="border-blue-200 bg-blue-50/80 backdrop-blur-sm">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <strong>Datos Protegidos:</strong> Tu email, RUT y tipo de cuenta están protegidos por seguridad 
                          y no pueden modificarse. Si necesitas actualizar esta información, 
                          <button className="font-semibold underline ml-1 hover:text-blue-900 transition-colors">
                            contacta a nuestro equipo de soporte
                          </button>.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sección de Preferencias */}
              <Card className="backdrop-blur-optimized bg-white/80 border-0 shadow-optimized overflow-hidden gpu-accelerated">
                <CardHeader className="py-4">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-emerald-600" />
                    Preferencias de Navegación
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 text-gray-600">
                    Personaliza tu experiencia de compra
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Flujo Post-Confirmación
                        </h4>
                        <p className="text-sm text-gray-600">
                          ¿Dónde quieres ir después de confirmar un pedido?
                        </p>
                      </div>
                      <div className="ml-4">
                        <select 
                          defaultValue={typeof window !== 'undefined' ? localStorage.getItem('ecofor-preferred-flow') || 'confirmation' : 'confirmation'}
                          onChange={(e) => {
                            localStorage.setItem('ecofor-preferred-flow', e.target.value)
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="confirmation">Página de Confirmación</option>
                          <option value="catalog">Volver al Catálogo</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-emerald-900 mb-1">
                            Flujo Recomendado
                          </h5>
                          <p className="text-sm text-emerald-700">
                            La página de confirmación te permite ver todos los detalles de tu pedido y 
                            descargar el comprobante. Puedes cambiar esta preferencia en cualquier momento.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}