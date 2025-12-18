#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Función para corregir errores básicos de sintaxis
function quickFixSyntax(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Corregir imports mal formateados
    if (content.includes('HydrationBoundary"import')) {
      content = content.replace(/HydrationBoundary"import/g, 'HydrationBoundary"\nimport');
      modified = true;
    }

    // Corregir imports sin punto y coma
    if (content.includes('HydrationBoundary"import') || content.includes('HydrationBoundary"\nimport')) {
      content = content.replace(/HydrationBoundary"\nimport/g, 'HydrationBoundary"\nimport');
      modified = true;
    }

    // Corregir cierres mal formateados
    if (content.includes('</HydrationBoundary>') && content.includes('</HydrationBoundary>\n  )')) {
      // Ya está bien formateado
    } else if (content.includes('<HydrationBoundary>') && !content.includes('</HydrationBoundary>')) {
      // Agregar cierre si falta
      content = content.replace(/\)\s*$/, '</HydrationBoundary>\n  )');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Corregido: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
    return false;
  }
}

// Lista de archivos problemáticos
const problemFiles = [
  'src/app/auth/login/page.tsx',
  'src/app/admin/usuarios/page.tsx',
  'src/app/auth/olvidaste-contrasena/confirmacion/page.tsx',
  'src/app/auth/olvidaste-contrasena/restablecer/page.tsx',
  'src/app/checkout/cotizacion-confirmada/page.tsx',
  'src/app/admin/stock/page.tsx'
];

console.log('🔧 Aplicando correcciones rápidas de sintaxis...\n');

let fixed = 0;
problemFiles.forEach(file => {
  if (quickFixSyntax(file)) {
    fixed++;
  }
});

console.log(`\n✨ Corregidos ${fixed} archivos.`);
