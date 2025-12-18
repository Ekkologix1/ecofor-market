// ============================================
// COMPONENTE: BackgroundDecorations
// Elementos decorativos del fondo (burbujas y patrón de grid)
// ============================================

export function BackgroundDecorations() {
  return (
    <>
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30" suppressHydrationWarning>
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-200 rounded-full blur-xl" suppressHydrationWarning></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-teal-200 rounded-full blur-lg" suppressHydrationWarning></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-green-100 rounded-full blur-2xl" suppressHydrationWarning></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-emerald-100 rounded-full blur-xl" suppressHydrationWarning></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" suppressHydrationWarning>
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23059669' fill-opacity='0.4'%3e%3ccircle cx='30' cy='30' r='1.5'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
          }}
          suppressHydrationWarning
        />
      </div>
    </>
  )
}