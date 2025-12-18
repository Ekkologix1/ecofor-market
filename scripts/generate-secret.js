#!/usr/bin/env node

/**
 * Script para generar un NEXTAUTH_SECRET válido
 * Uso: node scripts/generate-secret.js
 */

const crypto = require('crypto')

// Generar un secret seguro de 64 caracteres
const secret = crypto.randomBytes(32).toString('base64')

console.log('\n🔐 NEXTAUTH_SECRET generado:\n')
console.log(`NEXTAUTH_SECRET="${secret}"`)
console.log('\n📋 Copia esta línea a tu archivo .env.local\n')
console.log('⚠️  IMPORTANTE:')
console.log('   - Guarda este secret de forma segura')
console.log('   - No lo compartas públicamente')
console.log('   - Si lo cambias, los usuarios tendrán que hacer login de nuevo\n')


