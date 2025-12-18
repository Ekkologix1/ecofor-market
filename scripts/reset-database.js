const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetDatabase() {
  try {
    console.log('🗑️  INICIANDO RESET DE BASE DE DATOS')
    console.log('===============================================\n')
    
    console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos!')
    console.log('   - Usuarios')
    console.log('   - Productos') 
    console.log('   - Categorías')
    console.log('   - Pedidos')
    console.log('   - Carritos')
    console.log('   - Logs de actividad')
    console.log('   - Todo lo demás...\n')
    
    // Listar tablas a limpiar
    const tables = [
      'order_status_history',
      'order_items', 
      'orders',
      'cart_items',
      'carts',
      'products',
      'categories',
      'price_rules',
      'activity_logs',
      'session_logs',
      'users'
    ]
    
    console.log('📋 Tablas a limpiar:')
    tables.forEach(table => console.log(`   - ${table}`))
    
    console.log('\n🧹 Limpiando base de datos...')
    
    // Limpiar en orden correcto (respetando foreign keys)
    for (const table of tables) {
      try {
        const result = await prisma.$executeRawUnsafe(`DELETE FROM ${table}`)
        console.log(`✅ Limpiado: ${table} (${result} registros)`)
      } catch (error) {
        console.error(`❌ Error limpiando ${table}:`, error.message)
      }
    }
    
    // Resetear secuencias de ID (PostgreSQL)
    console.log('\n🔄 Reseteando secuencias...')
    
    const sequences = [
      'users_id_seq',
      'categories_id_seq', 
      'products_id_seq',
      'orders_id_seq',
      'cart_items_id_seq',
      'carts_id_seq',
      'order_items_id_seq',
      'order_status_history_id_seq',
      'activity_logs_id_seq',
      'session_logs_id_seq',
      'price_rules_id_seq'
    ]
    
    for (const sequence of sequences) {
      try {
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE ${sequence} RESTART WITH 1`)
        console.log(`✅ Reset: ${sequence}`)
      } catch (error) {
        console.log(`⚠️  Secuencia ${sequence} no existe o no se pudo resetear`)
      }
    }
    
    console.log('\n✅ BASE DE DATOS RESETEADA COMPLETAMENTE')
    console.log('===============================================')
    console.log('📋 PRÓXIMOS PASOS:')
    console.log('   1. Ejecutar: node scripts/seed-all.js')
    console.log('   2. O ejecutar scripts individuales:')
    console.log('      - node scripts/seed-categories.js')
    console.log('      - node scripts/seed-users.js')
    console.log('      - node scripts/seed-complete-products.js')
    
  } catch (error) {
    console.error('\n❌ ERROR EN RESET DE BASE DE DATOS')
    console.error('===============================================')
    console.error('Error:', error.message)
    console.error('\n🔧 POSIBLES SOLUCIONES:')
    console.error('   1. Verificar conexión a la base de datos')
    console.error('   2. Ejecutar: npx prisma db push')
    console.error('   3. Verificar permisos de la base de datos')
    
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('\n✅ Reset completado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Error en reset:', error)
      process.exit(1)
    })
}

module.exports = { resetDatabase }
