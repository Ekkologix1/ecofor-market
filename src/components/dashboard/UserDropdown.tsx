"use client"
import { Badge } from "@/components/ui"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  User, 
  Building, 
  Shield, 
  ShoppingCart, 
  FileText 
} from "lucide-react"
import { ROUTES, API_ENDPOINTS } from "@/lib/constants/dashboard"





// ============================================
// COMPONENTE: UserDropdown
// Menú desplegable del usuario con opciones según rol
// ============================================








interface UserDropdownProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  userEmail: string
  userRole: string
  userType: string
  isEmpresa: boolean
  isValidated: boolean
  isAdmin: boolean
}

export function UserDropdown({
  isOpen,
  onClose,
  userName,
  userEmail,
  userRole,
  userType,
  isEmpresa,
  isValidated,
  isAdmin,
}: UserDropdownProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleLogout = async () => {
    try {
      await fetch(API_ENDPOINTS.LOGOUT, { method: "POST" })
    } catch (error) {
      console.error("Error logging out:", error)
    }
    signOut({ callbackUrl: ROUTES.AUTH.LOGIN })
  }

  const navigateTo = (path: string) => {
    router.push(path)
    onClose()
  }

  const getIconComponent = () => {
    if (isAdmin) return Shield
    if (isEmpresa) return Building
    return User
  }

  const getIconColors = () => {
    if (isAdmin) return 'bg-red-100 text-red-700'
    if (isEmpresa) return 'bg-emerald-100 text-emerald-700'
    return 'bg-green-100 text-green-700'
  }

  const IconComponent = getIconComponent()

  return (
    <div className="absolute top-full right-0 mt-2 w-72 z-[9999] animate-in fade-in duration-200">
      <div className="backdrop-blur-sm bg-white/95 rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* User Info Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getIconColors()}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">
                {isAdmin ? "Admin ECOFOR" : userName}
              </div>
              <div className="text-sm text-gray-600">{userEmail}</div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={isEmpresa ? "default" : "secondary"} className="text-xs bg-emerald-100 text-emerald-800">
                  {isAdmin ? "Administrador" : userRole === "VENDEDOR" ? "Vendedor" : isEmpresa ? "Empresa" : "Personal"}
                </Badge>
                {!isAdmin && userRole !== "VENDEDOR" && (
                  <Badge 
                    variant={isValidated ? "default" : "destructive"} 
                    className={`text-xs ${
                      isValidated 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {isValidated ? "Verificado" : "Pendiente"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {/* Mi Perfil - Para todos */}
          <button 
            onClick={() => navigateTo(ROUTES.PERFIL)}
            className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Mi Perfil</span>
          </button>

          {/* Opciones según tipo de usuario */}
          {isAdmin ? (
            // Admin no necesita opciones adicionales aquí
            <></>
          ) : userRole === 'VENDEDOR' ? (
            // Vendedor no ve "Mis Pedidos" porque no compra, solo gestiona pedidos de clientes
            <></>
          ) : isEmpresa ? (
            <>
              <button 
                onClick={() => navigateTo(ROUTES.PEDIDOS)}
                className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Mis Órdenes</span>
              </button>
              <button 
                onClick={() => navigateTo(ROUTES.COTIZACIONES)}
                className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Cotizaciones</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigateTo(ROUTES.PEDIDOS)}
              className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Mis Pedidos</span>
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Cerrar Sesión */}
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}