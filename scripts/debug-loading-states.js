#!/usr/bin/env node

/**
 * Script para debuggear los estados de carga
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Debuggeando estados de carga...')

// Verificar que los estados estén correctamente separados
const cartContextContent = fs.readFileSync('src/contexts/CartContext.tsx', 'utf8')

console.log('\n📋 Estados de carga en CartContext:')
console.log('1. loading (global):')
const loadingMatches = cartContextContent.match(/setLoading\(true\)/g)
console.log(`   - Se activa ${loadingMatches ? loadingMatches.length : 0} veces`)
if (loadingMatches) {
  console.log('   - Ubicaciones:', cartContextContent.match(/setLoading\(true\)[\s\S]{0,50}/g)?.map(m => m.trim()))
}

console.log('\n2. itemOperationsLoading (items):')
const itemLoadingMatches = cartContextContent.match(/setItemOperationsLoading\(true\)/g)
console.log(`   - Se activa ${itemLoadingMatches ? itemLoadingMatches.length : 0} veces`)
if (itemLoadingMatches) {
  console.log('   - Ubicaciones:', cartContextContent.match(/setItemOperationsLoading\(true\)[\s\S]{0,50}/g)?.map(m => m.trim()))
}

console.log('\n3. Verificando finally blocks:')
const finallyBlocks = cartContextContent.match(/finally\s*{[\s\S]*?setLoading\(false\)[\s\S]*?}/g)
console.log(`   - Finally blocks con setLoading(false): ${finallyBlocks ? finallyBlocks.length : 0}`)

const itemFinallyBlocks = cartContextContent.match(/finally\s*{[\s\S]*?setItemOperationsLoading\(false\)[\s\S]*?}/g)
console.log(`   - Finally blocks con setItemOperationsLoading(false): ${itemFinallyBlocks ? itemFinallyBlocks.length : 0}`)

console.log('\n4. Componentes que usan loading:')
const cartSidebarContent = fs.readFileSync('src/components/ui/cart-sidebar.tsx', 'utf8')
const floatingButtonContent = fs.readFileSync('src/components/ui/floating-cart-button.tsx', 'utf8')
const cartIconContent = fs.readFileSync('src/components/ui/cart-icon.tsx', 'utf8')

console.log('   - cart-sidebar.tsx:')
console.log(`     * loading: ${(cartSidebarContent.match(/loading/g) || []).length} referencias`)
console.log(`     * itemOperationsLoading: ${(cartSidebarContent.match(/itemOperationsLoading/g) || []).length} referencias`)

console.log('   - floating-cart-button.tsx:')
console.log(`     * loading: ${(floatingButtonContent.match(/loading/g) || []).length} referencias`)

console.log('   - cart-icon.tsx:')
console.log(`     * loading: ${(cartIconContent.match(/loading/g) || []).length} referencias`)

console.log('\n🎯 Análisis:')
console.log('- El estado loading debería usarse solo para operaciones globales')
console.log('- El estado itemOperationsLoading debería usarse solo para operaciones de items')
console.log('- Los componentes floating-cart-button y cart-icon deberían usar loading (no itemOperationsLoading)')

console.log('\n✅ Si todo está correcto, el problema puede estar en:')
console.log('1. El estado no se está reseteando correctamente')
console.log('2. Hay algún componente que no hemos identificado')
console.log('3. El problema está en el timing de las actualizaciones')
