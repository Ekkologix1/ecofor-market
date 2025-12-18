"use client"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'





interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log('ProtectedRoute useEffect triggered:', { status, hasSession: !!session })
    
    if (status === 'loading') return
    
    // Solo redirigir si definitivamente no hay sesión y no está cargando
    if (status === 'unauthenticated' && !session) {
      console.log('ProtectedRoute: Definitely no session, redirecting to login')
      router.push('/auth/login')
    }
  }, [session, status, router])

  console.log('ProtectedRoute render:', { status, hasSession: !!session })

  // Si no hay sesión, mostrar fallback o null
  if (status === 'unauthenticated' || !session) {
    console.log('ProtectedRoute: No session, showing fallback')
    return fallback || null
  }

  // Mientras carga, mostrar null en lugar de loading screen
  if (status === 'loading') {
    return null
  }

  // Si hay sesión, mostrar el contenido
  console.log('ProtectedRoute: Session found, rendering children')
  return <>{children}</>
}
