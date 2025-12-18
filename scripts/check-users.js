const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 VERIFICACIÓN DE USUARIOS EN LA BASE DE DATOS:')
    console.log('================================================\n')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        type: true,
        validated: true,
        company: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ]
    })
    
    if (users.length === 0) {
      console.log('📭 No hay usuarios en la base de datos')
      return
    }
    
    console.log(`📊 Total de usuarios encontrados: ${users.length}\n`)
    
    // Agrupar por rol
    const usersByRole = users.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = []
      acc[user.role].push(user)
      return acc
    }, {})
    
    // Mostrar usuarios por rol
    Object.entries(usersByRole).forEach(([role, roleUsers]) => {
      console.log(`👥 ${role}S (${roleUsers.length}):`)
      roleUsers.forEach(user => {
        const status = user.validated ? '✅ Validado' : '⏳ Pendiente'
        const company = user.company ? ` - ${user.company}` : ''
        const type = user.type === 'EMPRESA' ? '🏢' : '👤'
        
        console.log(`   ${type} ${user.name} (${user.email})${company}`)
        console.log(`      📅 Creado: ${user.createdAt.toLocaleDateString('es-CL')}`)
        console.log(`      🔄 Actualizado: ${user.updatedAt.toLocaleDateString('es-CL')}`)
        console.log(`      📋 Estado: ${status}`)
        console.log('')
      })
    })
    
    // Estadísticas generales
    const stats = {
      total: users.length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      vendedores: users.filter(u => u.role === 'VENDEDOR').length,
      usuarios: users.filter(u => u.role === 'USER').length,
      validados: users.filter(u => u.validated).length,
      pendientes: users.filter(u => !u.validated).length,
      empresas: users.filter(u => u.type === 'EMPRESA').length,
      naturales: users.filter(u => u.type === 'NATURAL').length
    }
    
    console.log('📈 ESTADÍSTICAS:')
    console.log(`   📦 Total usuarios: ${stats.total}`)
    console.log(`   👑 Administradores: ${stats.admins}`)
    console.log(`   💼 Vendedores: ${stats.vendedores}`)
    console.log(`   👤 Usuarios normales: ${stats.usuarios}`)
    console.log(`   ✅ Validados: ${stats.validados}`)
    console.log(`   ⏳ Pendientes: ${stats.pendientes}`)
    console.log(`   🏢 Empresas: ${stats.empresas}`)
    console.log(`   👤 Personas naturales: ${stats.naturales}`)
    
    // Mostrar emails para referencia
    console.log('\n📧 LISTA DE EMAILS:')
    users.forEach(user => {
      console.log(`   ${user.email}`)
    })
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
