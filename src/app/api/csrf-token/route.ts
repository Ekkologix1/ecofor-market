import { generateCSRFToken, withApiRateLimit } from "@/lib"
import { NextRequest, NextResponse } from "next/server"






export async function GET(request: NextRequest) {
  try {
    // Aplicar rate limiting para prevenir abuso
    const rateLimitResponse = await withApiRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Generar token CSRF
    const tokenId = await generateCSRFToken(request)

    // Retornar token con headers de seguridad
    const response = NextResponse.json({
      token: tokenId,
      expiresIn: 30 * 60 // 30 minutos en segundos
    })

    // Agregar headers de seguridad
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    
    // Headers para prevenir clickjacking
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    
    return response

  } catch (error) {
    console.error("Error generating CSRF token:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
