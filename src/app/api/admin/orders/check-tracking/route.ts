import { prisma } from "@/lib"
import { NextRequest, NextResponse } from 'next/server'
import { withStaffAuth, AuthSession } from '@/lib/middleware/auth'







async function checkTrackingHandler(request: NextRequest, _session: AuthSession) {
  try {
    const { trackingNumber, currentOrderId } = await request.json()

    if (!trackingNumber) {
      return NextResponse.json({ exists: false })
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        trackingNumber: trackingNumber,
        NOT: {
          id: currentOrderId
        }
      },
      select: {
        id: true,
        orderNumber: true
      }
    })

    if (existingOrder) {
      return NextResponse.json({
        exists: true,
        orderNumber: existingOrder.orderNumber
      })
    }

    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error('Error checking tracking:', error)
    return NextResponse.json(
      { error: 'Error al verificar número de seguimiento' },
      { status: 500 }
    )
  }
}

// Wrapper para mantener la firma correcta de Next.js 15
export async function POST(request: NextRequest, _context: { params: Promise<Record<string, never>> }) {
  const withMiddleware = withStaffAuth(checkTrackingHandler)
  return await withMiddleware(request)
}