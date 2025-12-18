#!/usr/bin/env node

/**
 * Script para limpiar carritos huérfanos (sin usuario válido)
 * 
 * Este script elimina carritos que:
 * - No tienen un usuario asociado válido
 * - Pertenecen a usuarios que no existen
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanOrphanedCarts(dryRun = true) {
  console.log(`🧹 ${dryRun ? 'SIMULACIÓN' : 'LIMPIEZA'} de carritos huérfanos...\n`)

  try {
    // Buscar carritos huérfanos usando SQL raw
    const orphanedCarts = await prisma.$queryRaw`
      SELECT c.id, c."userId", c."createdAt"
      FROM carts c
      LEFT JOIN users u ON c."userId" = u.id
      WHERE u.id IS NULL
    `

    // Obtener los items de los carritos huérfanos
    if (orphanedCarts.length > 0) {
      const cartIds = orphanedCarts.map(cart => cart.id)
      
      for (let i = 0; i < orphanedCarts.length; i++) {
        const cart = orphanedCarts[i]
        const items = await prisma.cartItem.findMany({
          where: { cartId: cart.id },
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        })
        cart.items = items
      }
    }

    if (orphanedCarts.length === 0) {
      console.log('✅ No se encontraron carritos huérfanos para limpiar')
      return
    }

    console.log(`📊 Encontrados ${orphanedCarts.length} carritos huérfanos:`)
    
    let totalItems = 0
    orphanedCarts.forEach((cart, index) => {
      console.log(`\n${index + 1}. Carrito ID: ${cart.id}`)
      console.log(`   - Usuario ID: ${cart.userId}`)
      console.log(`   - Creado: ${cart.createdAt}`)
      console.log(`   - Items: ${cart.items.length}`)
      
      if (cart.items.length > 0) {
        console.log('   - Productos:')
        cart.items.forEach(item => {
          console.log(`     * ${item.product.name} (${item.product.sku}) - ${item.quantity} unidades`)
        })
        totalItems += cart.items.length
      }
    })

    console.log(`\n📈 Resumen:`)
    console.log(`   - Carritos huérfanos: ${orphanedCarts.length}`)
    console.log(`   - Items totales: ${totalItems}`)

    if (dryRun) {
      console.log('\n🔍 MODO SIMULACIÓN - No se realizarán cambios')
      console.log('   Para ejecutar la limpieza real, usa: node scripts/clean-orphaned-carts.js --execute')
    } else {
      console.log('\n🗑️  Ejecutando limpieza...')
      
      // Eliminar carritos huérfanos (los items se eliminan automáticamente por CASCADE)
      const deleteResult = await prisma.cart.deleteMany({
        where: {
          id: {
            in: orphanedCarts.map(cart => cart.id)
          }
        }
      })

      console.log(`✅ Eliminados ${deleteResult.count} carritos huérfanos`)
      console.log(`✅ Eliminados aproximadamente ${totalItems} items de carrito`)
      
      // Log de la actividad
      await prisma.activityLog.create({
        data: {
          userId: 'system', // Usuario del sistema
          action: 'cleanup_orphaned_carts',
          description: `Limpieza automática: eliminados ${deleteResult.count} carritos huérfanos con ${totalItems} items`,
          metadata: {
            cartsDeleted: deleteResult.count,
            itemsDeleted: totalItems,
            cartIds: orphanedCarts.map(cart => cart.id)
          }
        }
      }).catch(err => {
        console.warn('⚠️  No se pudo registrar la actividad en el log:', err.message)
      })
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Manejar argumentos de línea de comandos
const args = process.argv.slice(2)
const execute = args.includes('--execute')

// Ejecutar limpieza si se llama directamente
if (require.main === module) {
  cleanOrphanedCarts(!execute)
    .then(() => {
      console.log('\n✅ Limpieza completada')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en la limpieza:', error)
      process.exit(1)
    })
}

module.exports = { cleanOrphanedCarts }
