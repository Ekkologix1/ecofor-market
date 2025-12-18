import { authOptions, prisma } from "@/lib"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'



// src/app/api/orders/[id]/download-pdf/route.ts
;
;
;
;

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
    const orderId = resolvedParams.id;

    // Headers para optimización de caché
    const headers = new Headers();
    headers.set('Cache-Control', 'private, max-age=300'); // 5 minutos de caché
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="comprobante-${orderId}.pdf"`);

    // Consulta optimizada - solo campos necesarios para PDF
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        total: true,
        subtotal: true,
        discountAmount: true,
        shippingCost: true,
        shippingMethod: true,
        shippingAddress: true,
        shippingCity: true,
        customerNotes: true,
        createdAt: true,
        estimatedDate: true,
        items: {
          select: {
            id: true,
            productName: true,
            productSku: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
            productUnit: true,
            discount: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            rut: true,
            phone: true,
            company: true,
          },
        },
      },
    });

    if (!order) {
      return new NextResponse('Pedido no encontrado', { status: 404 });
    }

    if (order.user.id !== session.user.id && session.user.role !== 'ADMIN') {
      return new NextResponse('No autorizado para este pedido', { status: 403 });
    }

    // Generar PDF usando importación dinámica para evitar problemas de tipos
    const ReactPDF = await import('@react-pdf/renderer');
    const React = await import('react');
    const { OrderComprobante } = await import('@/components/pdf/OrderComprobante');

    // Datos optimizados - ya vienen en el formato correcto de la consulta
    const orderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      type: order.type,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingCost: Number(order.shippingCost),
      shippingMethod: order.shippingMethod,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      customerNotes: order.customerNotes,
      createdAt: order.createdAt.toISOString(),
      estimatedDate: order.estimatedDate?.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        productSku: item.productSku,
        productUnit: item.productUnit,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        discount: item.discount,
      })),
      user: order.user ? {
        name: order.user.name,
        email: order.user.email,
        rut: order.user.rut || undefined,
        phone: order.user.phone || undefined,
        company: order.user.company || undefined,
      } : undefined,
    };

    // Crear elemento React y generar PDF
    const element = React.createElement(OrderComprobante, { orderData });
    
    // Generar PDF con configuración optimizada
    const pdfBuffer = await (ReactPDF as any).renderToBuffer(element);

    return new Response(pdfBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error generando PDF:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}