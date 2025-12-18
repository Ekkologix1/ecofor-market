#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de archivos con errores de sintaxis
const filesToFix = [
  'src/app/admin/usuarios/page.tsx',
  'src/app/auth/olvidaste-contrasena/confirmacion/page.tsx',
  'src/app/auth/olvidaste-contrasena/restablecer/page.tsx',
  'src/app/checkout/cotizacion-confirmada/page.tsx',
  'src/app/admin/stock/page.tsx',
  'src/app/auth/login/page.tsx',
  'src/app/dashboard/page.tsx'
];

// Función para corregir errores de sintaxis
function fixSyntaxErrors(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Archivo no encontrado: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Corregir import de HydrationBoundary mal formateado
    if (content.includes('import { HydrationBoundary } from "@/components/HydrationBoundary"')) {
      // Ya está bien formateado
    } else if (content.includes('import { HydrationBoundary }')) {
      // Corregir import mal formateado
      content = content.replace(
        /import\s*{\s*HydrationBoundary\s*}\s*from\s*["']@\/components\/HydrationBoundary["']\s*;?\s*/g,
        'import { HydrationBoundary } from "@/components/HydrationBoundary"\n'
      );
      modified = true;
    }

    // Corregir problemas con HydrationBoundary mal cerrado
    if (content.includes('<HydrationBoundary>') && !content.includes('</HydrationBoundary>')) {
      // Buscar el patrón de cierre mal formateado
      const patterns = [
        // Patrón 1: </HydrationBoundary> mal formateado
        /<\/\s*HydrationBoundary\s*>\s*\)\s*$/gm,
        // Patrón 2: Cierre sin HydrationBoundary
        /\)\s*$/gm
      ];

      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, '</HydrationBoundary>\n  )');
          modified = true;
        }
      });
    }

    // Corregir problemas de sintaxis JSX
    // Eliminar líneas vacías problemáticas
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Corregir indentación inconsistente
    content = content.replace(/^\s+$/gm, '');

    // Corregir problemas específicos de cada archivo
    if (filePath.includes('admin/usuarios/page.tsx')) {
      // Corregir problemas específicos de este archivo
      content = content.replace(
        /return\s*\(\s*<HydrationBoundary>\s*<div/g,
        'return (\n    <HydrationBoundary>\n      <div'
      );
      content = content.replace(
        /<\/div>\s*\)\s*$/,
        '</div>\n    </HydrationBoundary>\n  )'
      );
      modified = true;
    }

    if (filePath.includes('auth/olvidaste-contrasena')) {
      // Corregir problemas específicos de estos archivos
      content = content.replace(
        /return\s*\(\s*<HydrationBoundary>\s*<div/g,
        'return (\n    <HydrationBoundary>\n      <div'
      );
      content = content.replace(
        /<\/div>\s*\)\s*$/,
        '</div>\n    </HydrationBoundary>\n  )'
      );
      modified = true;
    }

    if (filePath.includes('checkout/cotizacion-confirmada')) {
      // Corregir problemas específicos de este archivo
      content = content.replace(
        /return\s*\(\s*<HydrationBoundary>\s*<div/g,
        'return (\n    <HydrationBoundary>\n      <div'
      );
      content = content.replace(
        /<\/div>\s*\)\s*$/,
        '</div>\n    </HydrationBoundary>\n  )'
      );
      modified = true;
    }

    if (filePath.includes('admin/stock/page.tsx')) {
      // Corregir problemas específicos de este archivo
      content = content.replace(
        /return\s*\(\s*<HydrationBoundary>\s*<div/g,
        'return (\n    <HydrationBoundary>\n      <div'
      );
      content = content.replace(
        /<\/div>\s*\)\s*$/,
        '</div>\n    </HydrationBoundary>\n  )'
      );
      modified = true;
    }

    if (filePath.includes('dashboard/page.tsx')) {
      // Corregir problemas específicos de este archivo
      content = content.replace(
        /return\s*\(\s*<HydrationBoundary>\s*<div/g,
        'return (\n    <HydrationBoundary>\n      <div'
      );
      content = content.replace(
        /<\/div>\s*\)\s*$/,
        '</div>\n    </HydrationBoundary>\n  )'
      );
      modified = true;
    }

    // Limpiar líneas problemáticas
    content = content.replace(/^\s*$\n/gm, '');

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Corregidos errores de sintaxis en: ${filePath}`);
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
  console.log('🔧 Corrigiendo errores de sintaxis en archivos con HydrationBoundary...\n');
  
  let successCount = 0;
  let totalCount = filesToFix.length;

  filesToFix.forEach(filePath => {
    if (fixSyntaxErrors(filePath)) {
      successCount++;
    }
  });

  console.log(`\n📊 Resumen:`);
  console.log(`   Total de archivos: ${totalCount}`);
  console.log(`   Corregidos: ${successCount}`);
  console.log(`   Sin cambios: ${totalCount - successCount}`);
  
  if (successCount > 0) {
    console.log('\n✨ ¡Errores de sintaxis corregidos!');
    console.log('💡 Los archivos deberían compilar correctamente ahora.');
  } else {
    console.log('\nℹ️  No se requirieron cambios en ningún archivo.');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { fixSyntaxErrors, main };
