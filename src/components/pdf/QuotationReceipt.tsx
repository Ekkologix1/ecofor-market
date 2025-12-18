import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { formatPrice } from '@/lib/constants/business'
import React from 'react'



// Registrar fuentes para mejor renderizado
Font.register({
  family: 'Roboto',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2'
})

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#10b981'
  },
  logo: {
    width: 80,
    height: 80
  },
  headerInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 5
  },
  documentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10
  },
  documentNumber: {
    fontSize: 12,
    color: '#6b7280'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5
  },
  infoLabel: {
    width: 120,
    fontWeight: 'bold',
    color: '#374151'
  },
  infoValue: {
    flex: 1,
    color: '#6b7280'
  },
  quotationDetails: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },
  productsTable: {
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 4
  },
  tableHeaderText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  tableCell: {
    fontSize: 9,
    color: '#374151'
  },
  productImage: {
    width: 30,
    height: 30,
    marginRight: 10
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 2
  },
  productDetails: {
    fontSize: 8,
    color: '#6b7280'
  },
  quantityCell: {
    width: 60,
    textAlign: 'center'
  },
  priceCell: {
    width: 80,
    textAlign: 'right'
  },
  totalCell: {
    width: 80,
    textAlign: 'right',
    fontWeight: 'bold'
  },
  summarySection: {
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 8,
    marginTop: 20
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  summaryLabel: {
    color: '#374151'
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#10b981'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#10b981'
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151'
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981'
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center'
  },
  importantNotice: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: 15,
    borderRadius: 8,
    marginTop: 20
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 5
  },
  noticeText: {
    fontSize: 9,
    color: '#92400e',
    lineHeight: 1.3
  }
})

interface QuotationReceiptProps {
  quotation: {
    id: string
    orderNumber: string
    status: string
    type: string
    createdAt: string
    total: number
    subtotal: number
    quotationDescription: string
    desiredDeliveryDate: string
    clientType: string
    items: Array<{
      product: {
        id: string
        name: string
        image: string
        price: number
      }
      quantity: number
      price: number
    }>
    user: {
      name: string
      email: string
      type: string
    }
  }
}

const QuotationReceipt: React.FC<QuotationReceiptProps> = ({ quotation }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            style={styles.logo}
            src="/images/logo-ecofor.png"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.companyName}>ECOFOR MARKET</Text>
            <Text style={styles.documentType}>COMPROBANTE DE COTIZACIÓN</Text>
            <Text style={styles.documentNumber}>N° {quotation.orderNumber}</Text>
          </View>
        </View>

        {/* Información del Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{quotation.user.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{quotation.user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo:</Text>
            <Text style={styles.infoValue}>
              {quotation.user.type === 'EMPRESA' ? 'Empresa' : 'Persona Natural'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha Solicitud:</Text>
            <Text style={styles.infoValue}>{formatDate(quotation.createdAt)}</Text>
          </View>
        </View>

        {/* Detalles de la Cotización */}
        <View style={styles.quotationDetails}>
          <Text style={styles.sectionTitle}>Detalles de la Cotización</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Descripción:</Text>
            <Text style={styles.infoValue}>
              {quotation.quotationDescription || 'Sin descripción adicional'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha Deseada:</Text>
            <Text style={styles.infoValue}>{formatDate(quotation.desiredDeliveryDate)}</Text>
          </View>
        </View>

        {/* Productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos Solicitados</Text>
          
          {/* Header de la tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Producto</Text>
            <Text style={[styles.tableHeaderText, styles.quantityCell]}>Cantidad</Text>
            <Text style={[styles.tableHeaderText, styles.priceCell]}>Precio Unit.</Text>
            <Text style={[styles.tableHeaderText, styles.totalCell]}>Total</Text>
          </View>

          {/* Filas de productos */}
          {quotation.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.productDetails}>
                  {formatPrice(item.product.price)} c/u
                </Text>
              </View>
              <Text style={[styles.tableCell, styles.quantityCell]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.priceCell]}>
                {formatPrice(item.product.price)}
              </Text>
              <Text style={[styles.tableCell, styles.totalCell]}>
                {formatPrice(item.price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Resumen */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatPrice(quotation.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Valor Estimado Total:</Text>
            <Text style={styles.totalValue}>{formatPrice(quotation.total)}</Text>
          </View>
        </View>

        {/* Aviso Importante */}
        <View style={styles.importantNotice}>
          <Text style={styles.noticeTitle}>⚠️ IMPORTANTE</Text>
          <Text style={styles.noticeText}>
            Este es un comprobante de solicitud de cotización. Los precios mostrados son estimados y pueden variar. 
            La cotización formal será enviada por nuestro equipo comercial en un plazo de 24-48 horas hábiles. 
            La cotización final tendrá una validez de 30 días desde su emisión.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>ECOFOR MARKET - Especialistas en Productos de Limpieza e Higiene</Text>
          <Text>Teléfono: +56 9 1234 5678 | Email: ventas@ecofor.cl</Text>
          <Text>www.ecofor.cl</Text>
        </View>
      </Page>
    </Document>
  )
}

export default QuotationReceipt
