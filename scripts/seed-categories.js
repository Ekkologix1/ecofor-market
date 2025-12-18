const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedCategories() {
  try {
    console.log('Creando categorías oficiales de ECOFOR...')

    const categories = [
      {
        name: 'Papelería Institucional',
        slug: 'papeleria',
        description: 'Productos de oficina y papelería para empresas e instituciones',
        order: 1,
        active: true
      },
      {
        name: 'Productos Químicos',
        slug: 'quimicos',
        description: 'Productos químicos especializados para limpieza industrial',
        order: 2,
        active: true
      },
      {
        name: 'Artículos de Limpieza',
        slug: 'limpieza',
        description: 'Productos y herramientas para limpieza profesional',
        order: 3,
        active: true
      },
      {
        name: 'EPP Horeca',
        slug: 'epp-horeca',
        description: 'Elementos de protección personal para hoteles, restaurantes y cafeterías',
        order: 4,
        active: true
      }
    ]

    for (const categoryData of categories) {
      const category = await prisma.category.create({
        data: categoryData
      })
      console.log(`Categoría creada: ${category.name}`)
    }

    console.log('Categorías oficiales de ECOFOR creadas correctamente!')

  } catch (error) {
    console.error('Error al crear categorías:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCategories()