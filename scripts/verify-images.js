const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyImages() {
  try {
    console.log('🔍 VERIFICACIÓN DE IMÁGENES LOCALES:')
    console.log('=====================================\n')
    
    const products = await prisma.product.findMany({
      select: { name: true, mainImage: true, images: true }
    })
    
    let localCount = 0
    let externalCount = 0
    
    products.forEach(product => {
      console.log(`📦 ${product.name}`)
      console.log(`   🖼️  Imagen principal: ${product.mainImage}`)
      console.log(`   📷 Total imágenes: ${product.images.length}`)
      
      // Verificar si es local o externa
      const isLocal = product.mainImage && product.mainImage.startsWith('/images/')
      if (isLocal) {
        console.log(`   ✅ IMAGEN LOCAL`)
        localCount++
      } else {
        console.log(`   ❌ IMAGEN EXTERNA`)
        externalCount++
      }
      console.log('')
    })
    
    console.log('📊 RESUMEN:')
    console.log(`   ✅ Imágenes locales: ${localCount}`)
    console.log(`   ❌ Imágenes externas: ${externalCount}`)
    console.log(`   📦 Total productos: ${products.length}`)
    
    if (externalCount === 0) {
      console.log('\n🎉 ¡Todas las imágenes son locales!')
    } else {
      console.log('\n⚠️  Algunas imágenes aún son externas')
    }
    
  } catch (error) {
    console.error('❌ Error verificando imágenes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyImages()
