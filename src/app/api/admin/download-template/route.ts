






import { authOptions, prisma } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import * as XLSX from 'xlsx'

interface TemplateRow {
  Codigo: string
  Nombre: string
  Stock: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Verificar autenticación y permisos de admin
    const hasAccess = session?.user?.role === 'ADMIN' || session?.user?.role === 'VENDEDOR'
    if (!session || !hasAccess) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'empty' // 'empty' o 'current'

    console.log(`[DOWNLOAD TEMPLATE] Tipo solicitado: ${type}`)

    let templateData: TemplateRow[] = []

    if (type === 'current') {
      // DEBUGGING: Consulta mejorada con logs detallados
      console.log('[DOWNLOAD TEMPLATE] Iniciando consulta de productos...')
      
      // Primero, contamos total de productos
      const totalCount = await prisma.product.count()
      console.log(`[DOWNLOAD TEMPLATE] Total productos en sistema: ${totalCount}`)

      // Luego obtenemos los productos
      const products = await prisma.product.findMany({
        select: {
          sku: true,
          name: true,
          stock: true,
          updatedAt: true
        },
        orderBy: [
          { sku: 'asc' }
        ]
      })

      console.log(`[DOWNLOAD TEMPLATE] Productos encontrados: ${products.length}`)

      // DEBUGGING: Mostrar algunos ejemplos
      if (products.length > 0) {
        console.log('[DOWNLOAD TEMPLATE] Primeros 5 productos:')
        products.slice(0, 5).forEach((p, idx) => {
          console.log(`  ${idx + 1}. SKU: ${p.sku}, Stock: ${p.stock}, Actualizado: ${p.updatedAt}`)
        })

        // Buscar específicamente los productos que mencionaste
        const testProducts = products.filter(p => ['P000005', 'P000006'].includes(p.sku))
        if (testProducts.length > 0) {
          console.log('[DOWNLOAD TEMPLATE] Productos de prueba encontrados:')
          testProducts.forEach(p => {
            console.log(`  - ${p.sku}: Stock ${p.stock}, Actualizado: ${p.updatedAt}`)
          })
        } else {
          console.log('[DOWNLOAD TEMPLATE] No se encontraron productos P000005 o P000006')
        }
      } else {
        console.log('[DOWNLOAD TEMPLATE] No se encontraron productos en la consulta')
      }

      templateData = products.map(product => ({
        'Codigo': product.sku,
        'Nombre': product.name,
        'Stock': product.stock
      }))

      console.log(`[DOWNLOAD TEMPLATE] Datos preparados para Excel: ${templateData.length} filas`)

    } else {
      // Plantilla vacía con ejemplos
      console.log('[DOWNLOAD TEMPLATE] Generando plantilla vacía')
      templateData = [
        {
          'Codigo': 'EJ001',
          'Nombre': 'Ejemplo Producto 1',
          'Stock': 100
        },
        {
          'Codigo': 'EJ002', 
          'Nombre': 'Ejemplo Producto 2',
          'Stock': 50
        },
        {
          'Codigo': 'EJ003',
          'Nombre': 'Ejemplo Producto 3',
          'Stock': 25
        }
      ]
    }

    // Crear workbook
    const wb = XLSX.utils.book_new()
    
    // Crear worksheet principal
    const ws = XLSX.utils.json_to_sheet(templateData)

    // Configurar ancho de columnas
    ws['!cols'] = [
      { wch: 15 }, // Código
      { wch: 40 }, // Nombre
      { wch: 10 }  // Stock
    ]

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Stock')

    // Si es stock actual y hay datos, agregar hoja de estadísticas
    if (type === 'current' && templateData.length > 0) {
      const statsData = [
        ['ESTADÍSTICAS DEL STOCK ACTUAL'],
        [''],
        ['Total de productos:', templateData.length.toString()],
        ['Productos con stock:', templateData.filter(p => p.Stock > 0).length.toString()],
        ['Productos sin stock:', templateData.filter(p => p.Stock === 0).length.toString()],
        ['Stock promedio:', Math.round(templateData.reduce((sum, p) => sum + p.Stock, 0) / templateData.length).toString()],
        ['Stock total:', templateData.reduce((sum, p) => sum + p.Stock, 0).toString()],
        [''],
        ['Fecha de generación:', new Date().toLocaleString('es-CL')],
        ['Usuario:', session.user.name || session.user.email]
      ]

      const wsStats = XLSX.utils.aoa_to_sheet(statsData)
      wsStats['!cols'] = [{ wch: 30 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas')
    }

    // Agregar hoja de instrucciones
    const instructionsData = [
      ['INSTRUCCIONES PARA CARGA DE STOCK'],
      [''],
      ['1. Mantén las columnas en el mismo orden: Codigo, Nombre, Stock'],
      ['2. No cambies los nombres de las columnas (headers)'],
      ['3. El codigo debe coincidir exactamente con los productos existentes'],
      ['4. El stock debe ser un número entero positivo'],
      ['5. No dejes filas vacías entre los datos'],
      ['6. Guarda el archivo en formato Excel (.xlsx)'],
      [''],
      ['FORMATOS VÁLIDOS:'],
      ['• Codigo: Texto alfanumérico (ej: ABC123, PROD-001)'],
      ['• Nombre: Texto descriptivo'],
      ['• Stock: Número entero (ej: 0, 25, 100)'],
      [''],
      ['NOTAS IMPORTANTES:'],
      ['• Solo se actualizarán productos que ya existan en el sistema'],
      ['• Productos con codigos no encontrados serán reportados'],
      ['• El stock negativo será rechazado'],
      ['• Se recomienda hacer respaldo antes de cargas masivas']
    ]

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData)
    wsInstructions['!cols'] = [{ wch: 60 }]
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones')

    // Generar buffer del archivo Excel
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    console.log(`[DOWNLOAD TEMPLATE] Excel generado: ${buffer.length} bytes`)

    // Registrar descarga en logs con información detallada
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'download_template',
        description: `Descarga de plantilla Excel tipo: ${type} (${templateData.length} productos)`,
        metadata: {
          templateType: type,
          productsCount: templateData.length,
          fileSize: buffer.length,
          timestamp: new Date().toISOString()
        }
      }
    })

    // Crear nombre de archivo con timestamp más detallado
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
    const fileName = type === 'current' 
      ? `stock-actual-ecofor-${templateData.length}-productos-${timestamp}.xlsx`
      : `plantilla-stock-ecofor-${timestamp}.xlsx`

    console.log(`[DOWNLOAD TEMPLATE] Enviando archivo: ${fileName}`)

    // Retornar archivo
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error("[DOWNLOAD TEMPLATE] Error generando plantilla:", error)
    return NextResponse.json(
      { error: "Error generando plantilla", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}