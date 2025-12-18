const { PrismaClient } = require('@prisma/client')
const fs = require('fs').promises
const path = require('path')
const https = require('https')
const http = require('http')

const prisma = new PrismaClient()

// Crear directorio de imágenes si no existe
async function ensureImageDirectory() {
  const imageDir = path.join(process.cwd(), 'public', 'images', 'products')
  try {
    await fs.access(imageDir)
  } catch {
    await fs.mkdir(imageDir, { recursive: true })
    console.log(`📁 Directorio creado: ${imageDir}`)
  }
  return imageDir
}

// Descargar imagen desde URL
async function downloadImage(url, filename, imageDir) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    
    console.log(`  📡 Descargando: ${url}`)
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const filepath = path.join(imageDir, filename)
        const file = require('fs').createWriteStream(filepath)
        
        response.pipe(file)
        
        file.on('finish', () => {
          file.close()
          console.log(`  ✅ Descargada: ${filename}`)
          resolve(`/images/products/${filename}`)
        })
        
        file.on('error', (err) => {
          require('fs').unlink(filepath, () => {}) // Eliminar archivo parcial
          reject(err)
        })
      } else {
        reject(new Error(`HTTP ${response.statusCode}`))
      }
    }).on('error', reject)
  })
}

// Generar nombre de archivo único
function generateFilename(productSlug, imageIndex, originalUrl) {
  const ext = path.extname(originalUrl.split('?')[0]) || '.jpg'
  const safeSlug = productSlug.replace(/[^a-z0-9-]/g, '-')
  return `${safeSlug}-${imageIndex}${ext}`
}

// Verificar si una URL es externa
function isExternalUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
}

async function migrateAllImagesToLocal() {
  try {
    console.log('🌱 Migrando TODAS las imágenes a locales...')
    
    // Preparar directorio de imágenes
    const imageDir = await ensureImageDirectory()
    
    // Obtener todos los productos
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        slug: true,
        mainImage: true,
        images: true
      }
    })

    console.log(`📦 Procesando ${products.length} productos...`)

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const product of products) {
      try {
        console.log(`\n🔄 Procesando: ${product.name} (SKU: ${product.sku})`)
        
        // Verificar si ya tiene imágenes locales
        const hasLocalImages = product.mainImage && !isExternalUrl(product.mainImage)
        
        if (hasLocalImages) {
          console.log(`  ⏭️  Ya tiene imágenes locales, saltando...`)
          skipped++
          continue
        }

        // Descargar imágenes
        const localImages = []
        const imagesToProcess = product.images || []
        
        if (imagesToProcess.length === 0) {
          console.log(`  ⚠️  No hay imágenes, usando placeholder`)
          localImages.push('/images/products/placeholder-product.svg')
        } else {
          for (let i = 0; i < imagesToProcess.length; i++) {
            const url = imagesToProcess[i]
            
            if (!isExternalUrl(url)) {
              console.log(`  ⏭️  Imagen ${i + 1} ya es local: ${url}`)
              localImages.push(url)
              continue
            }
            
            try {
              const filename = generateFilename(product.slug, i + 1, url)
              const localPath = await downloadImage(url, filename, imageDir)
              localImages.push(localPath)
            } catch (error) {
              console.log(`  ⚠️  Error descargando imagen ${i + 1}: ${error.message}`)
              // Usar placeholder si falla
              localImages.push('/images/products/placeholder-product.svg')
            }
          }
        }
        
        // Establecer mainImage
        const mainImage = localImages[0] || '/images/products/placeholder-product.svg'
        
        // Actualizar producto con imágenes locales
        await prisma.product.update({
          where: { id: product.id },
          data: {
            images: localImages,
            mainImage: mainImage,
            updatedAt: new Date()
          }
        })
        
        console.log(`  ✅ Actualizado: ${product.name}`)
        updated++
        
      } catch (error) {
        console.error(`  ❌ Error procesando ${product.name}:`, error.message)
        errors++
      }
    }

    // Estadísticas finales
    console.log('\n📊 RESUMEN DE MIGRACIÓN:')
    console.log(`   🔄 Productos actualizados: ${updated}`)
    console.log(`   ⏭️  Productos saltados (ya locales): ${skipped}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log(`   📦 Total procesados: ${products.length}`)

    // Verificar imágenes finales
    console.log('\n🔍 VERIFICACIÓN FINAL:')
    const finalProducts = await prisma.product.findMany({
      select: { name: true, sku: true, mainImage: true }
    })
    
    const localCount = finalProducts.filter(p => !isExternalUrl(p.mainImage)).length
    const externalCount = finalProducts.filter(p => isExternalUrl(p.mainImage)).length
    
    console.log(`   📁 Imágenes locales: ${localCount}`)
    console.log(`   🌐 Imágenes externas: ${externalCount}`)

    console.log('\n🎉 Migración a imágenes locales completada!')
    console.log(`📁 Imágenes guardadas en: ${imageDir}`)

  } catch (error) {
    console.error('❌ Error en la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
if (require.main === module) {
  migrateAllImagesToLocal()
    .then(() => {
      console.log('✅ Script ejecutado correctamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error)
      process.exit(1)
    })
}

module.exports = { migrateAllImagesToLocal }
