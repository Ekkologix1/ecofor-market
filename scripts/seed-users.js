const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function seedUsers() {
  try {
    console.log(' Creando usuarios de prueba para ECOFOR...')

    // Hash para todas las contraseñas (123456)
    const hashedPassword = await bcrypt.hash('123456', 10)

    const users = [
      // ADMINISTRADORES
      {
        email: 'oscar@ecofor.cl',
        password: hashedPassword,
        name: 'Oscar Orstica',
        rut: '12345678-9',
        phone: '+56912345678',
        type: 'NATURAL',
        role: 'ADMIN',
        validated: true,
        validatedAt: new Date(),
        shippingAddress: 'Oficina ECOFOR, Concepción'
      },
      {
        email: 'admin@ecofor.cl',
        password: hashedPassword,
        name: 'Administrador ECOFOR',
        rut: '87654321-0',
        phone: '+56987654321',
        type: 'NATURAL',
        role: 'ADMIN',
        validated: true,
        validatedAt: new Date(),
        shippingAddress: 'Oficina Principal ECOFOR'
      },

      // VENDEDOR
      {
        email: 'vendedor@ecofor.cl',
        password: hashedPassword,
        name: 'Juan Vendedor',
        rut: '11222333-4',
        phone: '+56911222333',
        type: 'NATURAL',
        role: 'VENDEDOR',
        validated: true,
        validatedAt: new Date(),
        shippingAddress: 'Sucursal ECOFOR'
      },

      // USUARIOS PERSONAS NATURALES (VALIDADOS)
      {
        email: 'cliente1@gmail.com',
        password: hashedPassword,
        name: 'María González',
        rut: '16789123-5',
        phone: '+56916789123',
        type: 'NATURAL',
        role: 'USER',
        validated: true,
        validatedAt: new Date(),
        shippingAddress: 'Los Carrera 1234, Concepción'
      },
      {
        email: 'cliente2@gmail.com',
        password: hashedPassword,
        name: 'Pedro Martínez',
        rut: '17890234-6',
        phone: '+56917890234',
        type: 'NATURAL',
        role: 'USER',
        validated: true,
        validatedAt: new Date(),
        shippingAddress: 'Avenida Paicaví 567, Concepción'
      },

      // USUARIOS EMPRESAS (VALIDADOS)
      {
        email: 'compras@gmail.cl',
        password: hashedPassword,
        name: 'Ana Silva',
        rut: '76123456-7',
        phone: '+56941123456',
        type: 'EMPRESA',
        role: 'USER',
        company: 'Hotel Concepción Plaza',
        businessType: 'Servicios de Alojamiento',
        billingAddress: 'Barros Arana 457, Concepción',
        shippingAddress: 'Barros Arana 457, Concepción - Recepción',
        validated: true,
        validatedAt: new Date()
      },
      {
        email: 'administracion@gmail.cl',
        password: hashedPassword,
        name: 'Carlos Restaurant',
        rut: '76234567-8',
        phone: '+56942234567',
        type: 'EMPRESA',
        role: 'USER',
        company: 'Restaurant Bío Vino',
        businessType: 'Servicios de Alimentación',
        billingAddress: 'Castellón 364, Concepción',
        shippingAddress: 'Castellón 364, Concepción - Cocina',
        validated: true,
        validatedAt: new Date()
      },
      {
        email: 'gerencia@gmail.cl',
        password: hashedPassword,
        name: 'Doctora Carmen López',
        rut: '76345678-9',
        phone: '+56943345678',
        type: 'EMPRESA',
        role: 'USER',
        company: 'Clínica San Vicente',
        businessType: 'Servicios de Salud',
        billingAddress: 'San Martín 1436, Concepción',
        shippingAddress: 'San Martín 1436, Concepción - Bodega',
        validated: true,
        validatedAt: new Date()
      },

      // USUARIOS PENDIENTES DE VALIDACIÓN
      {
        email: 'nuevo1@gmail.com',
        password: hashedPassword,
        name: 'Roberto Nuevo',
        rut: '18901345-7',
        phone: '+56918901345',
        type: 'NATURAL',
        role: 'USER',
        validated: false,
        shippingAddress: 'Las Heras 890, Talcahuano'
      },
      {
        email: 'empresa@constructora.cl',
        password: hashedPassword,
        name: 'Jefe de Compras',
        rut: '76456789-0',
        phone: '+56944456789',
        type: 'EMPRESA',
        role: 'USER',
        company: 'Constructora Los Andes Ltda.',
        businessType: 'Construcción',
        billingAddress: 'Freire 1245, Concepción',
        shippingAddress: 'Obra Los Robles, Chiguayante',
        validated: false
      }
    ]

    // Crear usuarios uno por uno
    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData
      })
      console.log(`Usuario creado: ${user.name} (${user.email}) - ${user.type} ${user.role}`)
    }

    console.log('Usuarios de prueba creados correctamente!')
    console.log('Resumen de usuarios:')
    
    const adminCount = users.filter(u => u.role === 'ADMIN').length
    const vendedorCount = users.filter(u => u.role === 'VENDEDOR').length
    const userCount = users.filter(u => u.role === 'USER').length
    const validatedCount = users.filter(u => u.validated).length
    const pendingCount = users.filter(u => !u.validated).length
    const naturalCount = users.filter(u => u.type === 'NATURAL').length
    const empresaCount = users.filter(u => u.type === 'EMPRESA').length

    console.log(`   Administradores: ${adminCount}`)
    console.log(`   Vendedores: ${vendedorCount}`)
    console.log(`   Usuarios: ${userCount}`)
    console.log(`   Validados: ${validatedCount}`)
    console.log(`   Pendientes: ${pendingCount}`)
    console.log(`   Personas Naturales: ${naturalCount}`)
    console.log(`   Empresas: ${empresaCount}`)
    console.log('')
 
  } catch (error) {
    console.error('Error al crear usuarios:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedUsers()