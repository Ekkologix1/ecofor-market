#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de páginas que necesitan ser actualizadas
const pagesToUpdate = [
  'src/app/dashboard/page.tsx',
  'src/app/auth/login/page.tsx',
  'src/app/admin/stock/page.tsx',
  'src/app/checkout/cotizacion-confirmada/page.tsx',
  'src/app/mis-pedidos/page.tsx',
  'src/app/checkout/page.tsx',
  'src/app/auth/olvidaste-contrasena/restablecer/page.tsx',
  'src/app/auth/olvidaste-contrasena/confirmacion/page.tsx',
  'src/app/admin/usuarios/page.tsx',
  'src/app/catalogo/page.tsx',
  'src/app/checkout/confirmacion/page.tsx',
  'src/app/perfil/page.tsx',
  'src/app/auth/olvidaste-contrasena/exito/page.tsx',
  'src/app/auth/olvidaste-contrasena/page.tsx',
  'src/app/auth/registro/page.tsx',
  'src/app/admin/pedidos/[orderId]/page.tsx',
  'src/app/admin/pedidos/page.tsx',
  'src/app/auth/registro-exitoso/page.tsx',
  'src/app/admin/usuarios/todos/page.tsx',
  'src/app/admin/roles/page.tsx',
  'src/app/admin/actividad/page.tsx'
];

// Función para aplicar el fix de hidratación a un archivo
function applyHydrationFix(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Verificar si ya tiene el import de HydrationBoundary
    if (!content.includes('import { HydrationBoundary }')) {
      // Agregar import después de los otros imports de componentes
      const importRegex = /(import.*from.*["'].*["'];?\s*)+/;
      const match = content.match(importRegex);
      
      if (match) {
        const imports = match[0];
        const newImport = imports + '\nimport { HydrationBoundary } from "@/components/HydrationBoundary"';
        content = content.replace(imports, newImport);
        modified = true;
      }
    }

    // Verificar si ya está envuelto en HydrationBoundary
    if (!content.includes('<HydrationBoundary>')) {
      // Buscar el return statement principal
      const returnRegex = /return\s*\(\s*<([^>]+)/;
      const match = content.match(returnRegex);
      
      if (match) {
        const openingTag = match[1];
        const closingTag = openingTag.split(' ')[0];
        
        // Envolver el contenido principal en HydrationBoundary
        content = content.replace(
          new RegExp(`return\\s*\\(\\s*<${openingTag}`),
          `return (\n    <HydrationBoundary>\n      <${openingTag}`
        );
        
        // Cerrar el HydrationBoundary antes del último cierre
        const lastClosingTag = new RegExp(`</${closingTag}>\\s*\\)\\s*$`);
        content = content.replace(
          lastClosingTag,
          `</${closingTag}>\n    </HydrationBoundary>\n  )`
        );
        
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Aplicado fix de hidratación a: ${filePath}`);
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
  console.log('🚀 Aplicando fix de hidratación a todas las páginas...\n');
  
  let successCount = 0;
  let totalCount = pagesToUpdate.length;

  pagesToUpdate.forEach(pagePath => {
    if (applyHydrationFix(pagePath)) {
      successCount++;
    }
  });

  console.log(`\n📊 Resumen:`);
  console.log(`   Total de páginas: ${totalCount}`);
  console.log(`   Actualizadas: ${successCount}`);
  console.log(`   Sin cambios: ${totalCount - successCount}`);
  
  if (successCount > 0) {
    console.log('\n✨ ¡Fix de hidratación aplicado exitosamente!');
    console.log('💡 Los errores de hidratación deberían estar resueltos ahora.');
  } else {
    console.log('\nℹ️  No se requirieron cambios en ninguna página.');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { applyHydrationFix, main };
