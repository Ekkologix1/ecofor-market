import { authOptions, prisma } from "@/lib"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import React from 'react'

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Await params para Next.js 15
    const resolvedParams = await params;
    const quotationId = resolvedParams.id;

    // Headers para optimización de caché
    const headers = new Headers();
    headers.set('Cache-Control', 'private, max-age=300'); // 5 minutos de caché
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="cotizacion-${quotationId}.pdf"`);

    // Consulta optimizada - solo campos necesarios para PDF
    const quotation = await prisma.order.findUnique({
      where: { 
        id: quotationId,
        userId: session.user.id, // Asegurar que solo pueda acceder a sus propias cotizaciones
        type: 'COTIZACION' // Solo cotizaciones
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        total: true,
        subtotal: true,
        createdAt: true,
        customerNotes: true,
        estimatedDate: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            subtotal: true,
            productName: true,
            product: {
              select: {
                id: true,
                name: true,
                images: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            type: true
          }
        }
      }
    });

    if (!quotation) {
      return new NextResponse('Cotización no encontrada', { status: 404 });
    }

    // Preparar datos para el PDF
    const quotationData = {
      id: quotation.id,
      orderNumber: quotation.orderNumber,
      status: quotation.status,
      type: quotation.type,
      createdAt: quotation.createdAt.toISOString(),
      total: Number(quotation.total),
      subtotal: Number(quotation.subtotal),
      quotationDescription: quotation.customerNotes || '',
      desiredDeliveryDate: quotation.estimatedDate 
        ? quotation.estimatedDate.toISOString().split('T')[0]
        : '',
      clientType: quotation.user.type,
      items: quotation.items.map(item => ({
        product: {
          id: item.product.id,
          name: item.productName,
          image: Array.isArray(item.product.images) && item.product.images.length > 0 
            ? item.product.images[0] 
            : '/images/products/placeholder-product.svg',
          price: Number(item.unitPrice)
        },
        quantity: item.quantity,
        price: Number(item.subtotal)
      })),
      user: {
        name: quotation.user.name,
        email: quotation.user.email,
        type: quotation.user.type
      }
    };

    // Importar dinámicamente para evitar problemas de SSR
    const ReactPDF = await import('@react-pdf/renderer');
    const { default: QuotationReceipt } = await import('@/components/pdf/QuotationReceipt');
    
    // Crear elemento React y generar PDF
    const element = React.createElement(QuotationReceipt, { quotation: quotationData });
    
    // Generar PDF con configuración optimizada
    const pdfBuffer = await (ReactPDF as any).renderToBuffer(element);

    // Convertir Buffer a Uint8Array
    const pdfArray = new Uint8Array(pdfBuffer);

    // Retornar PDF con headers optimizados
    return new NextResponse(pdfArray, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion-${quotation.orderNumber}.pdf"`,
        'Cache-Control': 'private, max-age=300',
        'Content-Length': pdfArray.length.toString()
      }
    });

  } catch (error) {
    console.error('Error generando PDF de cotización:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}
