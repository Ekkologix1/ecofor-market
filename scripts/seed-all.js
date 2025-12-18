const { execSync } = require('child_process')
const path = require('path')

console.log('🌱 INICIANDO SEED COMPLETO DE ECOFOR MARKET')
console.log('===============================================\n')

const scripts = [
  {
    name: 'Categorías',
    file: 'seed-categories.js',
    description: 'Creando categorías del catálogo'
  },
  {
    name: 'Usuarios',
    file: 'seed-users.js', 
    description: 'Creando usuarios de prueba'
  },
  {
    name: 'Productos Reales',
    file: 'seed-complete-products.js',
    description: 'Creando productos reales del catálogo'
  },
  {
    name: 'Productos de Prueba',
    file: 'seed-test-products.js',
    description: 'Generando productos adicionales para pruebas'
  }
]

async function runSeedScript(script) {
  try {
    console.log(`\n📦 ${script.name}`)
    console.log(`   ${script.description}...`)
    
    const scriptPath = path.join(__dirname, script.file)
    
    // Ejecutar el script
    const output = execSync(`node "${scriptPath}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    })
    
    // Mostrar output del script
    if (output.trim()) {
      console.log(output)
    }
    
    console.log(`✅ ${script.name} completado`)
    
  } catch (error) {
    console.error(`❌ Error en ${script.name}:`, error.message)
    
    // Si hay output de error, mostrarlo
    if (error.stdout) {
      console.log('STDOUT:', error.stdout)
    }
    if (error.stderr) {
      console.log('STDERR:', error.stderr)
    }
    
    throw error
  }
}

async function seedAll() {
  try {
    const startTime = Date.now()
    
    // Ejecutar scripts en orden
    for (const script of scripts) {
      await runSeedScript(script)
      
      // Pequeña pausa entre scripts
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    console.log('\n🎉 SEED COMPLETO FINALIZADO')
    console.log('===============================================')
    console.log(`⏱️  Tiempo total: ${duration} segundos`)
    console.log('✅ Todos los scripts se ejecutaron correctamente')
    
    console.log('\n📋 PRÓXIMOS PASOS:')
    console.log('   1. Verificar la base de datos con: npx prisma studio')
    console.log('   2. Probar la aplicación en desarrollo')
    console.log('   3. Verificar que todos los productos se muestren correctamente')
    
  } catch (error) {
    console.error('\n❌ ERROR EN SEED COMPLETO')
    console.error('===============================================')
    console.error('Error:', error.message)
    console.error('\n🔧 SOLUCIONES:')
    console.error('   1. Verificar que la base de datos esté funcionando')
    console.error('   2. Ejecutar: npx prisma db push')
    console.error('   3. Verificar las variables de entorno en .env')
    
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedAll()
}

module.exports = { seedAll }
