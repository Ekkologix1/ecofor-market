#!/usr/bin/env node

/**
 * Script para optimizar imports usando barrel exports
 * Uso: node scripts/optimize-imports.js [archivo-o-carpeta]
 */

const fs = require('fs')
const path = require('path')

// Mapeo de imports a barrel exports
const BARREL_MAPPINGS = {
  // UI Components
  '@/components/ui/button': '@/components/ui',
  '@/components/ui/input': '@/components/ui',
  '@/components/ui/label': '@/components/ui',
  '@/components/ui/card': '@/components/ui',
  '@/components/ui/alert': '@/components/ui',
  '@/components/ui/badge': '@/components/ui',
  '@/components/ui/progress': '@/components/ui',
  '@/components/ui/form': '@/components/ui',

  // Auth Components
  '@/components/auth/login-form': '@/components/auth',
  '@/components/auth/register-empresa-form': '@/components/auth',
  '@/components/auth/register-natural-form': '@/components/auth',
  '@/components/auth/user-type-selector': '@/components/auth',
  '@/components/auth/ProtectedRoute': '@/components/auth',

  // Dashboard Components
  '@/components/dashboard/LoadingScreen': '@/components/dashboard',
  '@/components/dashboard/DashboardCard': '@/components/dashboard',
  '@/components/dashboard/DashboardHeader': '@/components/dashboard',
  '@/components/dashboard/WelcomeSection': '@/components/dashboard',
  '@/components/dashboard/BackgroundDecorations': '@/components/dashboard',

  // Services
  '@/services/orderService': '@/services',
  '@/services/productService': '@/services',
  '@/services/userService': '@/services',
  '@/services/cartService': '@/services',
  '@/services/cacheService': '@/services',

  // Lib utilities
  '@/lib/utils': '@/lib',
  '@/lib/db': '@/lib',
  '@/lib/auth': '@/lib',
  '@/lib/validations': '@/lib',
  '@/lib/errorHandler': '@/lib',
  '@/lib/pagination': '@/lib',
  '@/lib/rateLimiter': '@/lib',
  '@/lib/csrf': '@/lib',
  '@/lib/cache': '@/lib',

  // Hooks
  '@/hooks/useAuth': '@/hooks',
  '@/hooks/useCSRF': '@/hooks',
  '@/hooks/useDropdown': '@/hooks',

  // Types
  '@/types/auth': '@/types',

  // Domain
  '@/domain/entities/User': '@/domain',
  '@/domain/value-objects/Email': '@/domain',
  '@/domain/repositories/UserRepository': '@/domain',

  // Application
  '@/application/dto/UserDto': '@/application',
  '@/application/use-cases/CreateUserUseCase': '@/application',
  '@/application/use-cases/GetUserUseCase': '@/application',
  '@/application/use-cases/ValidateUserUseCase': '@/application',

  // Infrastructure
  '@/infrastructure/repositories/PrismaUserRepository': '@/infrastructure',
}

function optimizeImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  let optimizedContent = content

  // Procesar cada import statement
  const importRegex = /import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/g
  const imports = []
  let match

  // Recopilar todos los imports
  while ((match = importRegex.exec(content)) !== null) {
    const [, importsList, fromPath] = match
    imports.push({
      fullMatch: match[0],
      importsList: importsList.trim(),
      fromPath
    })
  }

  // Agrupar imports por barrel export
  const groupedImports = {}
  const standaloneImports = []

  imports.forEach(importItem => {
    const barrelPath = BARREL_MAPPINGS[importItem.fromPath]
    
    if (barrelPath) {
      if (!groupedImports[barrelPath]) {
        groupedImports[barrelPath] = []
      }
      groupedImports[barrelPath].push(...importItem.importsList.split(',').map(imp => imp.trim()))
    } else {
      standaloneImports.push(importItem)
    }
  })

  // Remover imports originales
  imports.forEach(importItem => {
    optimizedContent = optimizedContent.replace(importItem.fullMatch, '')
  })

  // Agregar imports optimizados
  let newImports = []

  // Imports agrupados
  Object.entries(groupedImports).forEach(([barrelPath, importNames]) => {
    const uniqueImports = [...new Set(importNames)].filter(name => name.length > 0)
    if (uniqueImports.length > 0) {
      newImports.push(`import { ${uniqueImports.join(', ')} } from "${barrelPath}"`)
    }
  })

  // Imports standalone
  standaloneImports.forEach(importItem => {
    newImports.push(importItem.fullMatch)
  })

  // Insertar imports optimizados al inicio del archivo
  const lines = optimizedContent.split('\n')
  const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import'))
  
  if (firstImportIndex !== -1) {
    lines.splice(firstImportIndex, 0, ...newImports)
  } else {
    lines.unshift(...newImports)
  }

  return lines.join('\n')
}

function processFile(filePath) {
  try {
    const optimized = optimizeImports(filePath)
    fs.writeFileSync(filePath, optimized)
    console.log(`Optimizado: ${filePath}`)
  } catch (error) {
    console.error(`Error procesando ${filePath}:`, error.message)
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath)
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && !['node_modules', '.next', '.git'].includes(file)) {
      processDirectory(fullPath)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(fullPath)
    }
  })
}

// Main execution
function main() {
  const target = process.argv[2]
  
  if (!target) {
    console.log('Uso: pnpm run optimize-imports [archivo-o-carpeta]')
    console.log('Ejemplos:')
    console.log('  pnpm run optimize-imports src/components')
    console.log('  pnpm run optimize-imports src/app/dashboard/page.tsx')
    console.log('  pnpm exec node scripts/optimize-imports.js src/services')
    process.exit(1)
  }

  const targetPath = path.resolve(target)
  
  if (!fs.existsSync(targetPath)) {
    console.error(`Ruta no encontrada: ${targetPath}`)
    process.exit(1)
  }

  const stat = fs.statSync(targetPath)
  
  if (stat.isDirectory()) {
    console.log(`Procesando directorio: ${targetPath}`)
    processDirectory(targetPath)
  } else {
    console.log(`Procesando archivo: ${targetPath}`)
    processFile(targetPath)
  }

  console.log('Optimización completada!')
}

if (require.main === module) {
  main()
}

module.exports = {
  optimizeImports,
  processFile,
  processDirectory
}
