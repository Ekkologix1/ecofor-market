import { authOptions, prisma } from "@/lib"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

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

    // Consulta optimizada - solo campos necesarios para la boleta
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
            type: true,
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

    // Generar HTML de la boleta
    const html = generateBoletaHTML(order);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, max-age=300',
      },
    });

  } catch (error) {
    console.error('Error generando boleta HTML:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}

function generateBoletaHTML(order: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShippingMethodText = (method: string) => {
    if (method === 'RETIRO_TIENDA') return 'Retiro en tienda';
    if (method === 'DESPACHO_GRATIS') return 'Despacho gratuito';
    if (method === 'COURIER') return 'Courier';
    return method;
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boleta Electrónica - Pedido #${order.orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .company-info {
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 5px;
    }
    .company-details {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }
    .doc-info {
      text-align: right;
    }
    .doc-title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    .doc-number {
      font-size: 18px;
      color: #666;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-item {
      margin-bottom: 10px;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .info-value {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    thead {
      background: #f9fafb;
    }
    th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: bold;
      color: #666;
      text-transform: uppercase;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tbody tr:hover {
      background: #f9fafb;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 16px;
    }
    .total-final {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
      padding-top: 10px;
      border-top: 2px solid #e5e7eb;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-info">
        <div class="company-name">ECOFOR MARKET</div>
        <div class="company-details">
          Insumos de Aseo Profesional<br>
          Región del Bío Bío, Chile<br>
          contacto@ecofor.cl | +56 9 1234 5678
        </div>
      </div>
      <div class="doc-info">
        <div class="doc-title">${order.type === 'COMPRA' ? 'BOLETA ELECTRÓNICA' : 'COTIZACIÓN'}</div>
        <div class="doc-number">#${order.orderNumber}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Información del Pedido</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Fecha de Emisión</div>
          <div class="info-value">${formatDate(order.createdAt)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Estado</div>
          <div class="info-value">${order.status}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Método de Envío</div>
          <div class="info-value">${getShippingMethodText(order.shippingMethod)}</div>
        </div>
        ${order.estimatedDate ? `
        <div class="info-item">
          <div class="info-label">Fecha Estimada de Entrega</div>
          <div class="info-value">${formatDate(order.estimatedDate)}</div>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Cliente</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Nombre</div>
          <div class="info-value">${order.user.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${order.user.email}</div>
        </div>
        ${order.user.rut ? `
        <div class="info-item">
          <div class="info-label">RUT</div>
          <div class="info-value">${order.user.rut}</div>
        </div>
        ` : ''}
        ${order.user.phone ? `
        <div class="info-item">
          <div class="info-label">Teléfono</div>
          <div class="info-value">${order.user.phone}</div>
        </div>
        ` : ''}
        ${order.user.company ? `
        <div class="info-item">
          <div class="info-label">Empresa</div>
          <div class="info-value">${order.user.company}</div>
        </div>
        ` : ''}
        ${order.shippingAddress ? `
        <div class="info-item" style="grid-column: 1 / -1;">
          <div class="info-label">Dirección de Envío</div>
          <div class="info-value">${order.shippingAddress}${order.shippingCity ? `, ${order.shippingCity}` : ''}</div>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Productos</div>
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th class="text-right">Cantidad</th>
            <th class="text-right">Precio Unit.</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item: any) => `
            <tr>
              <td>${item.productSku}</td>
              <td>${item.productName}</td>
              <td class="text-right">${item.quantity} ${item.productUnit || 'un'}</td>
              <td class="text-right">${formatCurrency(item.unitPrice)}</td>
              <td class="text-right">${formatCurrency(item.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(order.subtotal)}</span>
      </div>
      ${order.discountAmount > 0 ? `
      <div class="total-row">
        <span>Descuento:</span>
        <span>-${formatCurrency(order.discountAmount)}</span>
      </div>
      ` : ''}
      <div class="total-row">
        <span>Envío:</span>
        <span>${order.shippingCost === 0 ? 'Gratis' : formatCurrency(order.shippingCost)}</span>
      </div>
      <div class="total-row total-final">
        <span>Total:</span>
        <span>${formatCurrency(order.total)}</span>
      </div>
    </div>

    ${order.customerNotes ? `
    <div class="section">
      <div class="section-title">Notas</div>
      <p style="color: #666; line-height: 1.6;">${order.customerNotes}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p>Este documento es válido como comprobante de ${order.type === 'COMPRA' ? 'compra' : 'cotización'}</p>
      <p style="margin-top: 10px;">ECOFOR MARKET - Todos los derechos reservados</p>
    </div>
  </div>
</body>
</html>
  `;
}



