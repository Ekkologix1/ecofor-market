import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// src/components/pdf/OrderComprobante.tsx
;

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderUser {
  name: string;
  email: string;
  rut?: string;
  phone?: string;
  company?: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  total: number;
  createdAt: string;
  shippingMethod: string;
  estimatedDate?: string;
  items: OrderItem[];
  user?: OrderUser;
}

interface OrderComprobanteProps {
  orderData: OrderData;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    borderBottomStyle: 'solid',
  },
  companyInfo: {
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  docInfo: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  docNumber: {
    fontSize: 12,
    color: '#6b7280',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    backgroundColor: '#f8fafc',
    padding: 15,
  },
  orderColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 3,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
  clientSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    borderLeftStyle: 'solid',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  clientInfo: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    color: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    fontSize: 8,
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  colProduct: {
    flex: 3,
    textAlign: 'left',
  },
  colSku: {
    flex: 2,
    textAlign: 'center',
  },
  colQuantity: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 2,
    textAlign: 'right',
  },
  colTotal: {
    flex: 2,
    textAlign: 'right',
  },
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  totalsBox: {
    width: 250,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderStyle: 'solid',
    padding: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 10,
    color: '#374151',
  },
  totalValue: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 'bold',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#22c55e',
    borderTopStyle: 'solid',
  },
  finalTotalLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
  },
  finalTotalValue: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 3,
  },
  contactInfo: {
    fontSize: 8,
    color: '#059669',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    RECIBIDO: 'Pedido Recibido',
    VALIDANDO: 'Validando Pedido',
    APROBADO: 'Pedido Aprobado',
    PREPARANDO: 'Preparando Pedido',
    EN_RUTA: 'En Camino',
    ENTREGADO: 'Entregado',
  };
  return statusMap[status] || status;
};

const getShippingText = (method: string): string => {
  const shippingMap: Record<string, string> = {
    RETIRO_TIENDA: 'Retiro en tienda',
    DESPACHO_GRATIS: 'Despacho gratuito',
    RUTA_PROGRAMADA: 'Ruta programada',
    COURIER: 'Envío por courier',
  };
  return shippingMap[method] || method;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const OrderComprobante = ({ orderData }: OrderComprobanteProps) => {
  const calculateTotals = () => {
    const subtotal = orderData.items.reduce((sum, item) => {
      return sum + Number(item.subtotal || 0);
    }, 0);
    
    let shipping = 0;
    
    if (orderData.shippingMethod === 'DESPACHO_GRATIS' && subtotal < 35000) {
      shipping = 5000;
    } else if (orderData.shippingMethod === 'COURIER') {
      shipping = 8000;
    }
    
    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  };

  const totals = calculateTotals();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>ECOFOR MARKET</Text>
            <Text style={styles.companyDetails}>Insumos de Aseo Profesional</Text>
            <Text style={styles.companyDetails}>Región del Bío Bío, Chile</Text>
            <Text style={styles.companyDetails}>contacto@ecofor.cl | +56 9 1234 5678</Text>
          </View>
          
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>
              {orderData.type === 'COMPRA' ? 'COMPROBANTE' : 'COTIZACIÓN'}
            </Text>
            <Text style={styles.docNumber}>#{orderData.orderNumber}</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.orderColumn}>
            <Text style={styles.infoLabel}>FECHA DEL PEDIDO</Text>
            <Text style={styles.infoValue}>
              {formatDate(orderData.createdAt)}
            </Text>
            
            <Text style={styles.infoLabel}>TIPO DE OPERACIÓN</Text>
            <Text style={styles.infoValue}>
              {orderData.type === 'COMPRA' ? 'Compra' : 'Cotización'}
            </Text>
          </View>
          
          <View style={styles.orderColumn}>
            {orderData.type === 'COMPRA' && (
              <>
                <Text style={styles.infoLabel}>MÉTODO DE ENVÍO</Text>
                <Text style={styles.infoValue}>
                  {getShippingText(orderData.shippingMethod)}
                </Text>
                
                <Text style={styles.infoLabel}>ESTADO ACTUAL</Text>
                <View style={styles.statusBadge}>
                  <Text>{getStatusText(orderData.status)}</Text>
                </View>
              </>
            )}
            {orderData.type === 'COTIZACION' && (
              <>
                <Text style={styles.infoLabel}>FECHA DESEADA DE ENTREGA</Text>
                <Text style={styles.infoValue}>
                  {orderData.estimatedDate ? formatDate(orderData.estimatedDate) : 'No especificada'}
                </Text>
                
                <Text style={styles.infoLabel}>TIPO DE CLIENTE</Text>
                <Text style={styles.infoValue}>
                  {orderData.user?.company ? 'Empresa' : 'Persona Natural'}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <Text style={styles.clientInfo}>
            Nombre: {orderData.user?.name || 'N/A'}
          </Text>
          {orderData.user?.company && (
            <Text style={styles.clientInfo}>
              Empresa: {orderData.user.company}
            </Text>
          )}
          <Text style={styles.clientInfo}>
            Email: {orderData.user?.email || 'N/A'}
          </Text>
          {orderData.user?.rut && (
            <Text style={styles.clientInfo}>
              RUT: {orderData.user.rut}
            </Text>
          )}
          {orderData.user?.phone && (
            <Text style={styles.clientInfo}>
              Teléfono: {orderData.user.phone}
            </Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colProduct, { textAlign: 'left' }]}>PRODUCTO</Text>
            <Text style={styles.colSku}>SKU</Text>
            <Text style={styles.colQuantity}>CANT.</Text>
            <Text style={styles.colPrice}>PRECIO UNIT.</Text>
            <Text style={styles.colTotal}>SUBTOTAL</Text>
          </View>
          
          {orderData.items.map((item, index) => (
            <View 
              key={item.id} 
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : {},
              ]}
            >
              <Text style={[styles.colProduct, { textAlign: 'left' }]}>
                {item.productName}
              </Text>
              <Text style={styles.colSku}>{item.productSku}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {orderData.type === 'COMPRA' ? 'Subtotal productos:' : 'Valor estimado:'}
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
            </View>
            
            {orderData.type === 'COMPRA' && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Envío:</Text>
                <Text style={styles.totalValue}>
                  {totals.shipping === 0 ? 'Gratis' : formatCurrency(totals.shipping)}
                </Text>
              </View>
            )}
            
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>
                {orderData.type === 'COMPRA' ? 'TOTAL FINAL:' : 'VALOR ESTIMADO TOTAL:'}
              </Text>
              <Text style={styles.finalTotalValue}>
                {orderData.type === 'COMPRA' ? formatCurrency(totals.total) : formatCurrency(totals.subtotal)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {orderData.type === 'COMPRA' 
              ? 'Este documento es un comprobante válido de su pedido en ECOFOR Market'
              : 'Esta cotización es válida por 30 días desde su emisión'}
          </Text>
          <Text style={styles.footerText}>
            {orderData.type === 'COMPRA' 
              ? 'El pago se realizará contra entrega según condiciones comerciales.'
              : 'Los precios finales se confirmarán en la cotización formal.'}
          </Text>
          <Text style={styles.contactInfo}>
            ECOFOR Market - contacto@ecofor.cl - +56 9 1234 5678
          </Text>
        </View>
        
      </Page>
    </Document>
  );
};