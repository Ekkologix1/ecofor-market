const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkImages() {
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        sku: true,
        mainImage: true,
        images: true
      }
    })

    console.log('📊 Productos con imágenes:')
    console.log('========================')
    
    products.forEach(product => {
      console.log(`\n📦 ${product.name}`)
      console.log(`   SKU: ${product.sku}`)
      console.log(`   Main Image: ${product.mainImage}`)
      console.log(`   All Images: ${product.images?.join(', ') || 'N/A'}`)
    })

    console.log(`\n✅ Total productos: ${products.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkImages()
