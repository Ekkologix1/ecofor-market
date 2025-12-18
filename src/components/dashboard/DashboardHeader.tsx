"use client"
// ============================================
// COMPONENTE: DashboardHeader
// Header del dashboard con logo y dropdown de usuario
// ============================================






import { useDropdown } from "@/hooks"
import { User, Building, Shield } from "lucide-react"
import { UserDropdown } from "./UserDropdown"
import { DROPDOWN_CONFIG } from "@/lib/constants/dashboard"
import Image from "next/image"





interface DashboardHeaderProps {
  userName: string
  userEmail: string
  userRole: string
  userType: string
  isEmpresa: boolean
  isValidated: boolean
  isAdmin: boolean
}

export function DashboardHeader({
  userName,
  userEmail,
  userRole,
  userType,
  isEmpresa,
  isValidated,
  isAdmin,
}: DashboardHeaderProps) {
  const { isOpen, toggle, close } = useDropdown(DROPDOWN_CONFIG.ID)

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
    <header className="backdrop-blur-sm bg-white/80 shadow-2xl border-b border-emerald-100 relative z-50 opacity-0 animate-fade-in-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-white rounded-xl shadow-lg transform rotate-1 group-hover:rotate-2 transition-transform duration-300"></div>
              <div className="relative bg-white rounded-xl p-3 shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                <Image
                  src="/images/logo-ecofor.png"
                  alt="ECOFOR Market"
                  width={140}
                  height={60}
                  priority
                  className="hover:opacity-90 transition-all duration-300 group-hover:scale-105"
                  style={{ width: "auto", height: "auto" }}
                  sizes="140px"
                />
              </div>
            </div>
          </div>

          {/* User Dropdown Button */}
          <div className="flex items-center space-x-6">
            <div className="relative" id={DROPDOWN_CONFIG.ID}>
              <button
                onClick={toggle}
                className="flex items-center space-x-3 p-2 rounded-xl bg-white/70 hover:bg-white/90 border border-emerald-200 hover:border-emerald-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColors()}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {isAdmin ? "Admin ECOFOR" : userName}
                  </div>
                  <div className="text-xs text-gray-500">{userEmail}</div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <UserDropdown
                isOpen={isOpen}
                onClose={close}
                userName={userName}
                userEmail={userEmail}
                userRole={userRole}
                userType={userType}
                isEmpresa={isEmpresa}
                isValidated={isValidated}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}