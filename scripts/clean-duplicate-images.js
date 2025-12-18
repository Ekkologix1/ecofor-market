const { PrismaClient } = require('@prisma/client')
const fs = require('fs').promises
const path = require('path')

const prisma = new PrismaClient()

async function cleanDuplicateImages() {
  try {
    console.log('🧹 Limpiando imágenes duplicadas...')
    
    const imageDir = path.join(process.cwd(), 'public', 'images', 'products')
    
    // Obtener todos los archivos en el directorio
    const files = await fs.readdir(imageDir)
    
    // Identificar archivos duplicados (terminan en -2.jpg, -2.png, etc.)
    const duplicateFiles = files.filter(file => 
      file.match(/-\d+\.(jpg|png|jpeg)$/) && 
      !file.endsWith('-1.jpg') && 
      !file.endsWith('-1.png') && 
      !file.endsWith('-1.jpeg')
    )
    
    console.log(`📁 Archivos duplicados encontrados: ${duplicateFiles.length}`)
    
    let deletedFiles = 0
    let updatedProducts = 0
    
    // Eliminar archivos duplicados
    for (const duplicateFile of duplicateFiles) {
      try {
        const filePath = path.join(imageDir, duplicateFile)
        await fs.unlink(filePath)
        console.log(`🗑️  Eliminado: ${duplicateFile}`)
        deletedFiles++
      } catch (error) {
        console.error(`❌ Error eliminando ${duplicateFile}:`, error.message)
      }
    }
    
    // Actualizar productos en la base de datos
    console.log('\n🔄 Actualizando productos en la base de datos...')
    
    const products = await prisma.product.findMany({
      select: { id: true, name: true, images: true, mainImage: true }
    })
    
    for (const product of products) {
      if (!product.images || product.images.length === 0) continue
      
      // Filtrar imágenes duplicadas (mantener solo las que no terminan en -2, -3, etc.)
      const cleanedImages = product.images.filter(image => {
        const filename = path.basename(image)
        // Mantener solo archivos que terminan en -1 o no tienen número al final
        return !filename.match(/-\d+\.(jpg|png|jpeg)$/) || filename.endsWith('-1.jpg') || filename.endsWith('-1.png') || filename.endsWith('-1.jpeg')
      })
      
      // Si las imágenes cambiaron, actualizar el producto
      if (cleanedImages.length !== product.images.length) {
        const newMainImage = cleanedImages[0] || product.mainImage
        
        await prisma.product.update({
          where: { id: product.id },
          data: {
            images: cleanedImages,
            mainImage: newMainImage,
            updatedAt: new Date()
          }
        })
        
        console.log(`✅ Actualizado: ${product.name} (${product.images.length} → ${cleanedImages.length} imágenes)`)
        updatedProducts++
      }
    }
    
    // Estadísticas finales
    console.log('\n📊 RESUMEN DE LIMPIEZA:')
    console.log(`   🗑️  Archivos eliminados: ${deletedFiles}`)
    console.log(`   🔄 Productos actualizados: ${updatedProducts}`)
    console.log(`   📁 Archivos duplicados encontrados: ${duplicateFiles.length}`)
    
    // Verificar resultado final
    const remainingFiles = await fs.readdir(imageDir)
    const remainingDuplicates = remainingFiles.filter(file => 
      file.match(/-\d+\.(jpg|png|jpeg)$/) && 
      !file.endsWith('-1.jpg') && 
      !file.endsWith('-1.png') && 
      !file.endsWith('-1.jpeg')
    )
    
    console.log(`\n🔍 VERIFICACIÓN FINAL:`)
    console.log(`   📁 Archivos restantes: ${remainingFiles.length}`)
    console.log(`   🚫 Duplicados restantes: ${remainingDuplicates.length}`)
    
    if (remainingDuplicates.length === 0) {
      console.log('\n🎉 ¡Limpieza completada exitosamente!')
    } else {
      console.log('\n⚠️  Aún quedan duplicados por procesar')
    }
    
  } catch (error) {
    console.error('❌ Error en la limpieza:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la limpieza
if (require.main === module) {
  cleanDuplicateImages()
    .then(() => {
      console.log('✅ Script ejecutado correctamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error)
      process.exit(1)
    })
}

module.exports = { cleanDuplicateImages }
