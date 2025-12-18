#!/usr/bin/env node

/**
 * Script para crear archivo .env.local con configuración básica
 * Uso: node scripts/setup-env.js
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const envLocalPath = path.join(process.cwd(), '.env.local')
const envExamplePath = path.join(process.cwd(), 'env.example')

// Generar secret seguro
const secret = crypto.randomBytes(32).toString('base64')

// Contenido del archivo .env.local
const envContent = `# ============================================
# VARIABLES DE ENTORNO - ECOFOR MARKET
# ============================================
# Archivo de configuración local (no versionar en git)
# Generado automáticamente por setup-env.js

# ============================================
# BASE DE DATOS (REQUERIDO)
# ============================================
# ⚠️  CONFIGURA TU DATABASE_URL AQUÍ
DATABASE_URL="postgresql://usuario:password@localhost:5432/ecofor_market"

# ============================================
# AUTENTICACIÓN (REQUERIDO)
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${secret}"

# ============================================
# DESARROLLO
# ============================================
NODE_ENV="development"
`

// Verificar si ya existe .env.local
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  El archivo .env.local ya existe.')
  console.log('   Si quieres regenerarlo, elimínalo primero.\n')
  process.exit(0)
}

// Crear el archivo
try {
  fs.writeFileSync(envLocalPath, envContent, 'utf8')
  console.log('✅ Archivo .env.local creado exitosamente!\n')
  console.log('📋 Configuración generada:')
  console.log(`   NEXTAUTH_URL="http://localhost:3000"`)
  console.log(`   NEXTAUTH_SECRET="${secret}"`)
  console.log('\n⚠️  IMPORTANTE:')
  console.log('   1. Configura tu DATABASE_URL en .env.local')
  console.log('   2. Reinicia el servidor después de crear/editar .env.local')
  console.log('   3. Limpia las cookies del navegador si sigues viendo errores JWT\n')
} catch (error) {
  console.error('❌ Error creando .env.local:', error.message)
  process.exit(1)
}


