require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Actualizando pedidos con método DESPACHO...')
  
  // Usar SQL crudo para evitar validación del enum
  const result = await prisma.$executeRaw`
    UPDATE "Order" 
    SET "shippingMethod" = 'DESPACHO_GRATIS' 
    WHERE "shippingMethod" = 'DESPACHO'
  `
  
  console.log(`Actualizado correctamente: ${result} registros modificados`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())