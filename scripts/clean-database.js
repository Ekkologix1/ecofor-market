const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanDatabase() {
  try {
    console.log('Limpiando base de datos...')
    
    // Eliminar todos los productos existentes
    const deletedProducts = await prisma.product.deleteMany({})
    console.log(`Productos eliminados: ${deletedProducts.count}`)
    
    // Eliminar todas las categorías existentes
    const deletedCategories = await prisma.category.deleteMany({})
    console.log(`Categorías eliminadas: ${deletedCategories.count}`)
    
    // Eliminar todas las reglas de precios existentes
    const deletedPriceRules = await prisma.priceRule.deleteMany({})
    console.log(`Reglas de precios eliminadas: ${deletedPriceRules.count}`)
    
    console.log('Base de datos limpia y lista para productos reales!')
    
  } catch (error) {
    console.error('Error al limpiar base de datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()