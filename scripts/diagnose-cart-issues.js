#!/usr/bin/env node

/**
 * Script para diagnosticar y limpiar problemas de integridad en el sistema de carritos
 * 
 * Este script ayuda a identificar y resolver:
 * - Carritos huérfanos (sin usuario válido)
 * - Usuarios con sesiones inválidas
 * - Inconsistencias en la base de datos
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function diagnoseCartIssues() {
  console.log('🔍 Iniciando diagnóstico de problemas de carritos...\n')

  try {
    // 1. Buscar carritos con usuarios inexistentes usando SQL raw
    console.log('1. Verificando carritos con usuarios inexistentes...')
    const cartsWithInvalidUsers = await prisma.$queryRaw`
      SELECT c.id, c."userId", c."createdAt"
      FROM carts c
      LEFT JOIN users u ON c."userId" = u.id
      WHERE u.id IS NULL
    `

    if (cartsWithInvalidUsers.length > 0) {
      console.log(`❌ Encontrados ${cartsWithInvalidUsers.length} carritos con usuarios inexistentes:`)
      cartsWithInvalidUsers.forEach(cart => {
        console.log(`   - Carrito ID: ${cart.id}, UserId: ${cart.userId}, Creado: ${cart.createdAt}`)
      })
    } else {
      console.log('✅ No se encontraron carritos con usuarios inexistentes')
    }

    // 2. Buscar usuarios no validados con carritos
    console.log('\n2. Verificando usuarios no validados con carritos...')
    const unvalidatedUsersWithCarts = await prisma.user.findMany({
      where: {
        validated: false,
        cart: {
          isNot: null
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        validated: true,
        cart: {
          select: {
            id: true,
            createdAt: true
          }
        }
      }
    })

    if (unvalidatedUsersWithCarts.length > 0) {
      console.log(`⚠️  Encontrados ${unvalidatedUsersWithCarts.length} usuarios no validados con carritos:`)
      unvalidatedUsersWithCarts.forEach(user => {
        console.log(`   - Usuario: ${user.name} (${user.email}), Carrito: ${user.cart.id}`)
      })
    } else {
      console.log('✅ No se encontraron usuarios no validados con carritos')
    }

    // 3. Buscar usuarios eliminados con carritos activos
    console.log('\n3. Verificando usuarios eliminados con carritos activos...')
    const deletedUsersWithCarts = await prisma.user.findMany({
      where: {
        deletedAt: {
          not: null
        },
        cart: {
          isNot: null
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true,
        cart: {
          select: {
            id: true,
            createdAt: true
          }
        }
      }
    })

    if (deletedUsersWithCarts.length > 0) {
      console.log(`🗑️  Encontrados ${deletedUsersWithCarts.length} usuarios eliminados con carritos:`)
      deletedUsersWithCarts.forEach(user => {
        console.log(`   - Usuario: ${user.name} (${user.email}), Eliminado: ${user.deletedAt}, Carrito: ${user.cart.id}`)
      })
    } else {
      console.log('✅ No se encontraron usuarios eliminados con carritos')
    }

    // 4. Estadísticas generales
    console.log('\n4. Estadísticas generales:')
    const totalUsers = await prisma.user.count()
    const validatedUsers = await prisma.user.count({ where: { validated: true } })
    const totalCarts = await prisma.cart.count()
    const cartsWithItems = await prisma.cart.count({
      where: {
        items: {
          some: {}
        }
      }
    })

    console.log(`   - Total de usuarios: ${totalUsers}`)
    console.log(`   - Usuarios validados: ${validatedUsers}`)
    console.log(`   - Total de carritos: ${totalCarts}`)
    console.log(`   - Carritos con items: ${cartsWithItems}`)

    // 5. Resumen de problemas
    const totalIssues = cartsWithInvalidUsers.length + unvalidatedUsersWithCarts.length + deletedUsersWithCarts.length
    
    if (totalIssues > 0) {
      console.log(`\n🚨 Resumen: Se encontraron ${totalIssues} problemas de integridad`)
      console.log('\n💡 Recomendaciones:')
      
      if (cartsWithInvalidUsers.length > 0) {
        console.log('   - Ejecutar: node scripts/clean-orphaned-carts.js')
      }
      
      if (unvalidatedUsersWithCarts.length > 0) {
        console.log('   - Revisar política de validación de usuarios')
        console.log('   - Considerar eliminar carritos de usuarios no validados')
      }
      
      if (deletedUsersWithCarts.length > 0) {
        console.log('   - Ejecutar: node scripts/clean-deleted-user-carts.js')
      }
    } else {
      console.log('\n🎉 ¡Excelente! No se encontraron problemas de integridad')
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar diagnóstico si se llama directamente
if (require.main === module) {
  diagnoseCartIssues()
    .then(() => {
      console.log('\n✅ Diagnóstico completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en el diagnóstico:', error)
      process.exit(1)
    })
}

module.exports = { diagnoseCartIssues }
