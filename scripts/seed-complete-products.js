const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedCompleteProducts() {
  try {
    console.log('🌱 Iniciando seed completo de productos ECOFOR...')
    
    // Verificar que las categorías existan
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    })

    if (categories.length === 0) {
      console.log('❌ No se encontraron categorías. Ejecuta primero seed-categories.js')
      return
    }

    console.log(`✅ Categorías encontradas: ${categories.length}`)
    categories.forEach(cat => console.log(`   - ${cat.name} (${cat.slug})`))

    const [papeleria, quimicos, limpieza, eppHoreca] = categories

    // Productos completos con todos los campos del schema
    const completeProducts = [
      // ============ PAPELERÍA INSTITUCIONAL ============
      {
        name: 'Dispensador Evolution Higiénico Jumbo Blanco',
        slug: 'dispensador-evolution-higienico-jumbo-blanco',
        description: 'Dispensador Evolution de papel higiénico formato jumbo, color blanco, ideal para instalaciones comerciales y oficinas. Fabricado en plástico resistente con mecanismo de extracción suave.',
        shortDescription: 'Dispensador de papel higiénico jumbo para baños institucionales',
        sku: 'DISP91509',
        categoryId: papeleria.id,
        basePrice: 28500,
        wholesalePrice: 24200,
        stock: 15,
        minStock: 3,
        maxStock: 50,
        brand: 'Evolution',
        unit: 'unidad',
        weight: 0.850,
        dimensions: '25cm x 15cm x 35cm',
        images: [
          '/images/products/dispensador-evolution-higienico-jumbo-blanco-1.jpg'
        ],
        mainImage: '/images/products/dispensador-evolution-higienico-jumbo-blanco-1.jpg',
        active: true,
        featured: true,
        promotion: false,
        metaTitle: 'Dispensador Evolution Papel Higiénico Jumbo Blanco - ECOFOR',
        metaDescription: 'Dispensador Evolution para papel higiénico jumbo, color blanco. Ideal para baños institucionales y comerciales.',
        tags: ['dispensador', 'papel higiénico', 'baño', 'institucional', 'evolution']
      },
      {
        name: 'Higiénico Elite PQ 4 X 500 MT',
        slug: 'higienico-elite-pq-4x500mt',
        description: 'Papel higiénico de alta calidad Elite, presentación 4 rollos por paquete de 500 metros cada uno. Suavidad y resistencia para uso institucional.',
        shortDescription: 'Papel higiénico Elite paquete 4 rollos x 500 metros',
        sku: '52091',
        categoryId: papeleria.id,
        basePrice: 12800,
        wholesalePrice: 10900,
        stock: 45,
        minStock: 10,
        maxStock: 200,
        brand: 'Elite',
        unit: 'paquete',
        weight: 2.200,
        dimensions: '30cm x 20cm x 15cm',
        images: [
          '/images/products/higienico-elite-pq-4x500mt-1.png'
        ],
        mainImage: '/images/products/higienico-elite-pq-4x500mt-1.png',
        active: true,
        featured: false,
        promotion: true,
        promotionPrice: 11500,
        promotionStart: new Date('2025-01-01'),
        promotionEnd: new Date('2025-12-31'),
        metaTitle: 'Papel Higiénico Elite 4x500m - ECOFOR',
        metaDescription: 'Papel higiénico Elite paquete 4 rollos de 500 metros. Calidad institucional para baños comerciales.',
        tags: ['papel higiénico', 'elite', 'baño', 'institucional', '500 metros']
      },
      {
        name: 'Servilleta Restaurant Coctel 24 X 120',
        slug: 'servilleta-restaurant-coctel-24x120',
        description: 'Servilletas de papel para restaurant formato coctel, paquete de 24 unidades con 120 servilletas cada una. Ideal para restaurantes y eventos.',
        shortDescription: 'Servilletas restaurant formato coctel 24x120 unidades',
        sku: 'HI55024',
        categoryId: papeleria.id,
        basePrice: 18500,
        wholesalePrice: 15700,
        stock: 32,
        minStock: 5,
        maxStock: 100,
        brand: 'Restaurant',
        unit: 'paquete',
        weight: 1.800,
        dimensions: '35cm x 25cm x 20cm',
        images: [
          '/images/products/servilleta-restaurant-coctel-24x120-1.jpg'
        ],
        mainImage: '/images/products/servilleta-restaurant-coctel-24x120-1.jpg',
        active: true,
        featured: false,
        promotion: false,
        metaTitle: 'Servilletas Restaurant Coctel 24x120 - ECOFOR',
        metaDescription: 'Servilletas de papel formato coctel para restaurant. Paquete 24 unidades x 120 servilletas.',
        tags: ['servilletas', 'restaurant', 'coctel', 'papel', 'eventos']
      },
      {
        name: 'Papel Bond Oficio 75 Gr 500 Hojas',
        slug: 'papel-bond-oficio-75gr-500hojas',
        description: 'Papel bond blanco tamaño oficio, 75 gramos, paquete de 500 hojas. Ideal para impresiones y fotocopias en oficinas.',
        shortDescription: 'Papel bond oficio 75gr paquete 500 hojas',
        sku: 'PAP750OF',
        categoryId: papeleria.id,
        basePrice: 8500,
        wholesalePrice: 7200,
        stock: 28,
        minStock: 5,
        maxStock: 150,
        brand: 'Office Pro',
        unit: 'paquete',
        weight: 2.500,
        dimensions: '32cm x 24cm x 5cm',
        images: [
          '/images/products/papel-bond-oficio-75gr-500hojas-1.jpeg'
        ],
        mainImage: '/images/products/papel-bond-oficio-75gr-500hojas-1.jpeg',
        active: true,
        featured: false,
        promotion: false,
        metaTitle: 'Papel Bond Oficio 75gr 500 Hojas - ECOFOR',
        metaDescription: 'Papel bond blanco tamaño oficio, 75 gramos, paquete de 500 hojas para oficina.',
        tags: ['papel', 'bond', 'oficio', 'impresión', 'oficina']
      },

      // ============ QUÍMICOS INDUSTRIALES ============
      {
        name: 'Detergente Industrial Concentrado 5L',
        slug: 'detergente-industrial-concentrado-5l',
        description: 'Detergente industrial concentrado de alta eficacia, presentación de 5 litros. Ideal para limpieza pesada en industrias y talleres.',
        shortDescription: 'Detergente industrial concentrado 5 litros',
        sku: 'DET5000',
        categoryId: quimicos.id,
        basePrice: 45000,
        wholesalePrice: 38200,
        stock: 12,
        minStock: 3,
        maxStock: 50,
        brand: 'Industrial Clean',
        unit: 'litro',
        weight: 5.200,
        dimensions: '25cm x 15cm x 30cm',
        images: [
          '/images/products/detergente-industrial-concentrado-5l-1.jpg'
        ],
        mainImage: '/images/products/detergente-industrial-concentrado-5l-1.jpg',
        active: true,
        featured: true,
        promotion: false,
        metaTitle: 'Detergente Industrial Concentrado 5L - ECOFOR',
        metaDescription: 'Detergente industrial concentrado de alta eficacia, 5 litros para limpieza pesada.',
        tags: ['detergente', 'industrial', 'concentrado', 'limpieza', 'químico']
      },
      {
        name: 'Desinfectante Multiuso 1L',
        slug: 'desinfectante-multiuso-1l',
        description: 'Desinfectante multiuso de amplio espectro, elimina bacterias, virus y hongos. Presentación de 1 litro para uso profesional.',
        shortDescription: 'Desinfectante multiuso 1 litro',
        sku: 'DES1000',
        categoryId: quimicos.id,
        basePrice: 12500,
        wholesalePrice: 10600,
        stock: 25,
        minStock: 5,
        maxStock: 100,
        brand: 'BioShield',
        unit: 'litro',
        weight: 1.100,
        dimensions: '12cm x 8cm x 20cm',
        images: [
          '/images/products/desinfectante-multiuso-1l-1.jpg'
        ],
        mainImage: '/images/products/desinfectante-multiuso-1l-1.jpg',
        active: true,
        featured: false,
        promotion: true,
        promotionPrice: 11000,
        promotionStart: new Date('2025-01-15'),
        promotionEnd: new Date('2025-06-30'),
        metaTitle: 'Desinfectante Multiuso 1L - ECOFOR',
        metaDescription: 'Desinfectante multiuso de amplio espectro, 1 litro para uso profesional.',
        tags: ['desinfectante', 'multiuso', 'bacterias', 'virus', 'profesional']
      },
      {
        name: 'Desengrasante Industrial 3.8L',
        slug: 'desengrasante-industrial-3-8l',
        description: 'Desengrasante industrial de alta potencia, presentación de 3.8 litros. Especialmente formulado para eliminar grasas y aceites industriales.',
        shortDescription: 'Desengrasante industrial 3.8 litros',
        sku: 'DESG3800',
        categoryId: quimicos.id,
        basePrice: 38000,
        wholesalePrice: 32300,
        stock: 18,
        minStock: 3,
        maxStock: 40,
        brand: 'Heavy Duty',
        unit: 'litro',
        weight: 4.000,
        dimensions: '20cm x 15cm x 25cm',
        images: [
          '/images/products/desengrasante-industrial-3-8l-1.jpg'
        ],
        mainImage: '/images/products/desengrasante-industrial-3-8l-1.jpg',
        active: true,
        featured: false,
        promotion: false,
        metaTitle: 'Desengrasante Industrial 3.8L - ECOFOR',
        metaDescription: 'Desengrasante industrial de alta potencia, 3.8 litros para grasas industriales.',
        tags: ['desengrasante', 'industrial', 'grasas', 'aceites', 'limpieza pesada']
      },

      // ============ LIMPIEZA PROFESIONAL ============
      {
        name: 'Escoba Industrial de Cerdas Naturales',
        slug: 'escoba-industrial-cerdas-naturales',
        description: 'Escoba industrial con cerdas naturales de alta resistencia, mango de madera tratada. Ideal para limpieza pesada en industrias y almacenes.',
        shortDescription: 'Escoba industrial cerdas naturales',
        sku: 'ESC001',
        categoryId: limpieza.id,
        basePrice: 18500,
        wholesalePrice: 15700,
        stock: 22,
        minStock: 5,
        maxStock: 80,
        brand: 'Industrial Tools',
        unit: 'unidad',
        weight: 0.800,
        dimensions: '150cm x 25cm x 8cm',
        images: [
          '/images/products/escoba-industrial-cerdas-naturales-1.png'
        ],
        mainImage: '/images/products/escoba-industrial-cerdas-naturales-1.png',
        active: true,
        featured: true,
        promotion: false,
        metaTitle: 'Escoba Industrial Cerdas Naturales - ECOFOR',
        metaDescription: 'Escoba industrial con cerdas naturales para limpieza pesada en industrias.',
        tags: ['escoba', 'industrial', 'cerdas naturales', 'limpieza', 'herramientas']
      },
      {
        name: 'Balde Industrial 20L con Aro',
        slug: 'balde-industrial-20l-con-aro',
        description: 'Balde industrial de 20 litros con aro de refuerzo, material plástico resistente. Ideal para trabajos de limpieza profesional.',
        shortDescription: 'Balde industrial 20 litros con aro',
        sku: 'BAL2000',
        categoryId: limpieza.id,
        basePrice: 12000,
        wholesalePrice: 10200,
        stock: 35,
        minStock: 5,
        maxStock: 100,
        brand: 'Pro Tools',
        unit: 'unidad',
        weight: 1.200,
        dimensions: '35cm x 35cm x 40cm',
        images: [
          '/images/products/balde-industrial-20l-con-aro-1.jpg'
        ],
        mainImage: '/images/products/balde-industrial-20l-con-aro-1.jpg',
        active: true,
        featured: false,
        promotion: false,
        metaTitle: 'Balde Industrial 20L con Aro - ECOFOR',
        metaDescription: 'Balde industrial de 20 litros con aro de refuerzo para limpieza profesional.',
        tags: ['balde', 'industrial', '20 litros', 'aro', 'plástico']
      },
      {
        name: 'Franela Microfibra 30x40cm',
        slug: 'franela-microfibra-30x40cm',
        description: 'Franela de microfibra de alta calidad, 30x40 cm. Excelente absorción y durabilidad para limpieza profesional.',
        shortDescription: 'Franela microfibra 30x40 cm',
        sku: 'FRA3040',
        categoryId: limpieza.id,
        basePrice: 3500,
        wholesalePrice: 2975,
        stock: 150,
        minStock: 20,
        maxStock: 500,
        brand: 'Micro Clean',
        unit: 'unidad',
        weight: 0.100,
        dimensions: '40cm x 30cm x 0.5cm',
        images: [
          '/images/products/franela-microfibra-30x40cm-1.jpg'
        ],
        mainImage: '/images/products/franela-microfibra-30x40cm-1.jpg',
        active: true,
        featured: false,
        promotion: true,
        promotionPrice: 3000,
        promotionStart: new Date('2025-02-01'),
        promotionEnd: new Date('2025-05-31'),
        metaTitle: 'Franela Microfibra 30x40cm - ECOFOR',
        metaDescription: 'Franela de microfibra de alta calidad, 30x40 cm para limpieza profesional.',
        tags: ['franela', 'microfibra', 'limpieza', 'absorción', 'profesional']
      },

      // ============ EPP HORECA ============
      {
        name: 'Guantes de Nitrilo Desechables Caja 100',
        slug: 'guantes-nitrilo-desechables-caja-100',
        description: 'Guantes de nitrilo desechables, caja de 100 unidades. Protección contra químicos y contaminación en el sector alimentario.',
        shortDescription: 'Guantes nitrilo desechables caja 100 unidades',
        sku: 'GUA100',
        categoryId: eppHoreca.id,
        basePrice: 8500,
        wholesalePrice: 7225,
        stock: 40,
        minStock: 10,
        maxStock: 200,
        brand: 'Safe Touch',
        unit: 'caja',
        weight: 0.500,
        dimensions: '25cm x 15cm x 10cm',
        images: [
          '/images/products/guantes-nitrilo-desechables-caja-100-1.png'
        ],
        mainImage: '/images/products/guantes-nitrilo-desechables-caja-100-1.png',
        active: true,
        featured: true,
        promotion: false,
        metaTitle: 'Guantes Nitrilo Desechables Caja 100 - ECOFOR',
        metaDescription: 'Guantes de nitrilo desechables, caja de 100 unidades para protección alimentaria.',
        tags: ['guantes', 'nitrilo', 'desechables', 'protección', 'alimentario']
      },
      {
        name: 'Mascarilla KN95 Caja 50',
        slug: 'mascarilla-kn95-caja-50',
        description: 'Mascarilla KN95 de alta filtración, caja de 50 unidades. Protección respiratoria para personal de salud y alimentario.',
        shortDescription: 'Mascarilla KN95 caja 50 unidades',
        sku: 'MAS50',
        categoryId: eppHoreca.id,
        basePrice: 25000,
        wholesalePrice: 21250,
        stock: 25,
        minStock: 5,
        maxStock: 100,
        brand: 'Protect Plus',
        unit: 'caja',
        weight: 0.300,
        dimensions: '20cm x 15cm x 5cm',
        images: [
          '/images/products/mascarilla-kn95-caja-50-1.jpg'
        ],
        mainImage: '/images/products/mascarilla-kn95-caja-50-1.jpg',
        active: true,
        featured: false,
        promotion: false,
        metaTitle: 'Mascarilla KN95 Caja 50 - ECOFOR',
        metaDescription: 'Mascarilla KN95 de alta filtración, caja de 50 unidades para protección respiratoria.',
        tags: ['mascarilla', 'KN95', 'protección', 'respiratoria', 'salud']
      },
      {
        name: 'Gorro Desechable Caja 100',
        slug: 'gorro-desechable-caja-100',
        description: 'Gorro desechable para uso alimentario, caja de 100 unidades. Protección capilar en cocinas y procesamiento de alimentos.',
        shortDescription: 'Gorro desechable caja 100 unidades',
        sku: 'GOR100',
        categoryId: eppHoreca.id,
        basePrice: 4500,
        wholesalePrice: 3825,
        stock: 60,
        minStock: 10,
        maxStock: 300,
        brand: 'Food Safe',
        unit: 'caja',
        weight: 0.200,
        dimensions: '20cm x 15cm x 8cm',
        images: [
          '/images/products/gorro-desechable-caja-100-1.jpg'
        ],
        mainImage: '/images/products/gorro-desechable-caja-100-1.jpg',
        active: true,
        featured: false,
        promotion: true,
        promotionPrice: 4000,
        promotionStart: new Date('2025-03-01'),
        promotionEnd: new Date('2025-08-31'),
        metaTitle: 'Gorro Desechable Caja 100 - ECOFOR',
        metaDescription: 'Gorro desechable para uso alimentario, caja de 100 unidades para protección capilar.',
        tags: ['gorro', 'desechable', 'alimentario', 'protección', 'cocina']
      },
      {
        name: 'Delantal Desechable 100 Unidades',
        slug: 'delantal-desechable-100-unidades',
        description: 'Delantal desechable para protección personal, paquete de 100 unidades. Ideal para cocinas, laboratorios y procesamiento de alimentos.',
        shortDescription: 'Delantal desechable 100 unidades',
        sku: 'DEL100',
        categoryId: eppHoreca.id,
        basePrice: 18000,
        wholesalePrice: 15300,
        stock: 30,
        minStock: 5,
        maxStock: 150,
        brand: 'Pro Shield',
        unit: 'paquete',
        weight: 1.500,
        dimensions: '30cm x 25cm x 15cm',
        images: [
          '/images/products/delantal-desechable-100-unidades-1.jpg'
        ],
        mainImage: '/images/products/delantal-desechable-100-unidades-1.jpg',
        active: true,
        featured: false,
        promotion: false,
        metaTitle: 'Delantal Desechable 100 Unidades - ECOFOR',
        metaDescription: 'Delantal desechable para protección personal, paquete de 100 unidades.',
        tags: ['delantal', 'desechable', 'protección', 'personal', 'cocina']
      }
    ]

    console.log(`\n📦 Procesando ${completeProducts.length} productos...`)

    let created = 0
    let updated = 0
    let errors = 0

    for (const product of completeProducts) {
      try {
        // Verificar si el producto ya existe
        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              { sku: product.sku },
              { slug: product.slug }
            ]
          }
        })

        if (existingProduct) {
          console.log(`⚠️  Producto ya existe: ${product.name} (SKU: ${product.sku})`)
          
          // Actualizar producto existente con nuevos campos
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              ...product,
              updatedAt: new Date(),
              version: { increment: 1 }
            }
          })
          updated++
        } else {
          // Crear nuevo producto
          await prisma.product.create({
            data: product
          })
          console.log(`✅ Creado: ${product.name} (SKU: ${product.sku})`)
          created++
        }
      } catch (error) {
        console.error(`❌ Error procesando ${product.name}:`, error.message)
        errors++
      }
    }

    // Estadísticas finales
    console.log('\n📊 RESUMEN DEL SEED:')
    console.log(`   ✅ Productos creados: ${created}`)
    console.log(`   🔄 Productos actualizados: ${updated}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log(`   📦 Total procesados: ${completeProducts.length}`)

    // Verificar productos por categoría
    console.log('\n📋 PRODUCTOS POR CATEGORÍA:')
    for (const category of categories) {
      const count = await prisma.product.count({
        where: { 
          categoryId: category.id,
          deletedAt: null
        }
      })
      console.log(`   ${category.name}: ${count} productos`)
    }

    // Verificar productos destacados y en promoción
    const [featuredCount, promotionCount] = await Promise.all([
      prisma.product.count({ where: { featured: true, deletedAt: null } }),
      prisma.product.count({ where: { promotion: true, deletedAt: null } })
    ])

    console.log(`\n⭐ Productos destacados: ${featuredCount}`)
    console.log(`🏷️  Productos en promoción: ${promotionCount}`)

    console.log('\n🎉 Seed de productos completado exitosamente!')

  } catch (error) {
    console.error('❌ Error en el seed de productos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el seed
if (require.main === module) {
  seedCompleteProducts()
    .then(() => {
      console.log('✅ Script ejecutado correctamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error)
      process.exit(1)
    })
}

module.exports = { seedCompleteProducts }
