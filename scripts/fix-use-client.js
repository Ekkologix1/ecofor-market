#!/usr/bin/env node

/**
 * Script para arreglar las directivas "use client" movidas incorrectamente
 * por el script de optimización de imports
 */

const fs = require('fs')
const path = require('path')

function fixUseClientDirective(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    
    // Buscar si hay una directiva "use client" en el archivo
    const useClientIndex = lines.findIndex(line => 
      line.trim() === '"use client"' || line.trim() === "'use client'"
    )
    
    if (useClientIndex === -1) {
      // No hay directiva "use client", no hacer nada
      return false
    }
    
    // Si ya está en la primera línea, no hacer nada
    if (useClientIndex === 0) {
      return false
    }
    
    // Remover la directiva de su posición actual
    const useClientLine = lines.splice(useClientIndex, 1)[0]
    
    // Insertar al principio del archivo
    lines.unshift(useClientLine)
    
    // Escribir el archivo corregido
    const fixedContent = lines.join('\n')
    fs.writeFileSync(filePath, fixedContent)
    
    console.log(`Arreglado: ${filePath}`)
    return true
    
  } catch (error) {
    console.error(`Error procesando ${filePath}:`, error.message)
    return false
  }
}

function processFile(filePath) {
  return fixUseClientDirective(filePath)
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath)
  let fixedCount = 0
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory() && !['node_modules', '.next', '.git'].includes(file)) {
      fixedCount += processDirectory(fullPath)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (processFile(fullPath)) {
        fixedCount++
      }
    }
  })
  
  return fixedCount
}

// Main execution
function main() {
  const target = process.argv[2] || 'src'
  const targetPath = path.resolve(target)
  
  if (!fs.existsSync(targetPath)) {
    console.error(`Ruta no encontrada: ${targetPath}`)
    process.exit(1)
  }

  console.log(`Arreglando directivas "use client" en: ${targetPath}`)
  
  const stat = fs.statSync(targetPath)
  let fixedCount = 0
  
  if (stat.isDirectory()) {
    fixedCount = processDirectory(targetPath)
  } else {
    if (processFile(targetPath)) {
      fixedCount = 1
    }
  }

  console.log(`Arreglados ${fixedCount} archivos!`)
}

if (require.main === module) {
  main()
}

module.exports = {
  fixUseClientDirective,
  processFile,
  processDirectory
}
