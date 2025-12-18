#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de archivos que necesitan ser revertidos
const filesToRevert = [
  'src/app/admin/usuarios/page.tsx',
  'src/app/auth/olvidaste-contrasena/confirmacion/page.tsx',
  'src/app/auth/olvidaste-contrasena/restablecer/page.tsx',
  'src/app/checkout/cotizacion-confirmada/page.tsx',
  'src/app/admin/stock/page.tsx'
];

// Función para revertir cambios problemáticos
function revertProblematicChanges(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Remover import de HydrationBoundary si existe
    if (content.includes('import { HydrationBoundary } from "@/components/HydrationBoundary"')) {
      content = content.replace(/import\s*{\s*HydrationBoundary\s*}\s*from\s*["']@\/components\/HydrationBoundary["']\s*;?\s*/g, '');
      modified = true;
    }

    // Remover HydrationBoundary tags
    if (content.includes('<HydrationBoundary>')) {
      content = content.replace(/<HydrationBoundary>\s*/g, '');
      modified = true;
    }

    if (content.includes('</HydrationBoundary>')) {
      content = content.replace(/\s*<\/HydrationBoundary>/g, '');
      modified = true;
    }

    // Limpiar líneas vacías extra
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Revertidos cambios problemáticos en: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No se requieren cambios en: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Función principal
function main() {
  console.log('🔄 Revirtiendo cambios problemáticos y aplicando solución conservadora...\n');
  
  let successCount = 0;
  let totalCount = filesToRevert.length;

  filesToRevert.forEach(filePath => {
    if (revertProblematicChanges(filePath)) {
      successCount++;
    }
  });

  console.log(`\n📊 Resumen:`);
  console.log(`   Total de archivos: ${totalCount}`);
  console.log(`   Revertidos: ${successCount}`);
  console.log(`   Sin cambios: ${totalCount - successCount}`);
  
  if (successCount > 0) {
    console.log('\n✨ ¡Cambios problemáticos revertidos!');
    console.log('💡 Los errores de sintaxis deberían estar resueltos.');
    console.log('🔧 La solución de hidratación principal sigue activa en el layout.');
  } else {
    console.log('\nℹ️  No se requirieron cambios en ningún archivo.');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { revertProblematicChanges, main };
