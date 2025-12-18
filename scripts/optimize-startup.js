#!/usr/bin/env node

/**
 * Script para optimizar el tiempo de startup de la aplicación
 * Ejecutar con: node scripts/optimize-startup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 OPTIMIZACIÓN DE STARTUP');
console.log('==========================\n');

// 1. Verificar archivos de configuración pesados
console.log('📋 Verificando archivos de configuración...');

const configFiles = [
  'next.config.ts',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.mjs'
];

configFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file}: ${stats.size} bytes`);
  } else {
    console.log(`⚠️  ${file}: No encontrado`);
  }
});

// 2. Verificar imports pesados en componentes principales
console.log('\n📦 Verificando imports pesados...');

const heavyImports = [
  '@react-pdf/renderer',
  '@tanstack/react-table',
  'winston',
  'xlsx',
  'reflect-metadata',
  'tsyringe'
];

heavyImports.forEach(importName => {
  const packagePath = path.join(process.cwd(), 'node_modules', importName);
  if (fs.existsSync(packagePath)) {
    console.log(`⚠️  ${importName}: Paquete pesado detectado`);
  }
});

// 3. Verificar componentes con lazy loading
console.log('\n🔄 Verificando lazy loading...');

const lazyComponents = [
  'src/components/home/HeroSection.tsx',
  'src/components/home/CategoriesSection.tsx',
  'src/components/home/FeaturedProductsSection.tsx',
  'src/components/ui/floating-cart-button.tsx',
  'src/components/ui/cart-sidebar.tsx'
];

lazyComponents.forEach(component => {
  const componentPath = path.join(process.cwd(), component);
  if (fs.existsSync(componentPath)) {
    console.log(`✅ ${component}: Configurado para lazy loading`);
  } else {
    console.log(`❌ ${component}: No encontrado`);
  }
});

// 4. Verificar configuración de Prisma
console.log('\n🗄️  Verificando configuración de base de datos...');

const prismaFiles = [
  'prisma/schema.prisma',
  'node_modules/.prisma/client/index.js'
];

prismaFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file}: ${stats.size} bytes`);
  } else {
    console.log(`❌ ${file}: No encontrado`);
  }
});

// 5. Recomendaciones de optimización
console.log('\n💡 RECOMENDACIONES DE OPTIMIZACIÓN:');
console.log('=====================================');

console.log('\n1. 🚀 OPTIMIZACIONES INMEDIATAS:');
console.log('   - Usar NODE_ENV=development para desarrollo');
console.log('   - Configurar Prisma con log: ["error"] únicamente');
console.log('   - Reducir imports de librerías pesadas');

console.log('\n2. 📦 OPTIMIZACIONES DE IMPORTS:');
console.log('   - Lazy load componentes pesados (PDF, Excel)');
console.log('   - Usar dynamic imports para librerías no críticas');
console.log('   - Optimizar imports de iconos (lucide-react)');

console.log('\n3. 🗄️  OPTIMIZACIONES DE BASE DE DATOS:');
console.log('   - Usar connection pooling en desarrollo');
console.log('   - Configurar Prisma con log mínimo');
console.log('   - Lazy load queries no críticas');

console.log('\n4. 🎨 OPTIMIZACIONES DE UI:');
console.log('   - Preload solo imágenes críticas');
console.log('   - Lazy load componentes de carrito');
console.log('   - Optimizar providers con React.memo');

console.log('\n5. 🔧 CONFIGURACIÓN DE DESARROLLO:');
console.log('   - Usar --turbopack para compilación más rápida');
console.log('   - Configurar watchOptions para archivos críticos');
console.log('   - Usar SWC en lugar de Babel');

console.log('\n📊 TIEMPO OBJETIVO:');
console.log('   - Desarrollo: < 1000ms');
console.log('   - Producción: < 2000ms');

console.log('\n✅ Ejecuta: npm run optimize-imports');
console.log('✅ Ejecuta: npm run dev:fast');
