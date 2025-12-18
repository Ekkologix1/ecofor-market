import { BackgroundDecorations } from "./BackgroundDecorations"

// ============================================
// COMPONENTE: LoadingScreen
// Pantalla de carga con animación
// ============================================



export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden" suppressHydrationWarning>
      <BackgroundDecorations />

      <div className="relative z-10 min-h-screen flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" suppressHydrationWarning></div>
          <p className="text-gray-600" suppressHydrationWarning>Cargando tu panel de control...</p>
        </div>
      </div>
    </div>
  )
}