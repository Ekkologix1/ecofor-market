#!/usr/bin/env node

/**
 * Script para validar variables de entorno
 * Ejecutar con: node scripts/validate-env.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 VALIDACIÓN DE VARIABLES DE ENTORNO');
console.log('=====================================\n');

try {
  // Verificar si existe .env.local o .env
  const fs = require('fs');
  let envPath = path.join(process.cwd(), '.env.local');
  let envFile = '.env.local';
  
  if (fs.existsSync(envPath)) {
    console.log('✅ Archivo .env.local encontrado');
  } else {
    envPath = path.join(process.cwd(), '.env');
    envFile = '.env';
    if (fs.existsSync(envPath)) {
      console.log('✅ Archivo .env encontrado');
    } else {
      console.log('⚠️  Archivo .env o .env.local no encontrado');
      console.log('   Copia env.example como .env.local y configura las variables');
    }
  }

  // Cargar variables de entorno
  require('dotenv').config({ path: envPath });

  // Variables requeridas
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL', 
    'NEXTAUTH_SECRET'
  ];

  // Variables opcionales
  const optionalVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'REDIS_URL',
    'EMAIL_SERVER_HOST',
    'EMAIL_SERVER_PORT',
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD',
    'EMAIL_FROM',
    'LOG_LEVEL'
  ];

  console.log('\n📋 VARIABLES REQUERIDAS:');
  let missingRequired = 0;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configurada`);
      
      // Validaciones específicas
      if (varName === 'NEXTAUTH_SECRET' && process.env[varName].length < 32) {
        console.log(`   ⚠️  ${varName} debe tener al menos 32 caracteres`);
      }
      
      if (varName === 'DATABASE_URL' && !process.env[varName].startsWith('postgresql://')) {
        console.log(`   ⚠️  ${varName} debería empezar con postgresql://`);
      }
      
      if (varName === 'NEXTAUTH_URL' && !process.env[varName].startsWith('http')) {
        console.log(`   ⚠️  ${varName} debería ser una URL válida`);
      }
    } else {
      console.log(`❌ ${varName}: No configurada`);
      missingRequired++;
    }
  });

  console.log('\n📋 VARIABLES OPCIONALES:');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configurada`);
    } else {
      console.log(`⚪ ${varName}: No configurada (opcional)`);
    }
  });

  // Verificar configuración de Redis
  console.log('\n🔧 CONFIGURACIÓN DE REDIS:');
  const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const hasLocalRedis = !!process.env.REDIS_URL;
  
  if (hasUpstash) {
    console.log('✅ Redis configurado (Upstash)');
  } else if (hasLocalRedis) {
    console.log('✅ Redis configurado (local)');
  } else {
    console.log('⚪ Redis no configurado (cache y rate limiting deshabilitados)');
  }

  // Verificar configuración de email
  console.log('\n📧 CONFIGURACIÓN DE EMAIL:');
  const hasEmailConfig = !!(
    process.env.EMAIL_SERVER_HOST &&
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD
  );
  
  if (hasEmailConfig) {
    console.log('✅ Email configurado');
  } else {
    console.log('⚪ Email no configurado (notificaciones deshabilitadas)');
  }

  // Resumen
  console.log('\n📊 RESUMEN:');
  if (missingRequired === 0) {
    console.log('✅ Todas las variables requeridas están configuradas');
    console.log('🚀 La aplicación debería funcionar correctamente');
  } else {
    console.log(`❌ Faltan ${missingRequired} variables requeridas`);
    console.log('🔧 Configura las variables faltantes antes de continuar');
  }

  console.log('\n💡 PRÓXIMOS PASOS:');
  if (missingRequired > 0) {
    console.log('1. Copia env.example como .env.local');
    console.log('2. Configura las variables requeridas');
    console.log('3. Ejecuta este script nuevamente');
  } else {
    console.log('1. Ejecuta: npm run dev');
    console.log('2. Verifica que la aplicación inicie correctamente');
  }

} catch (error) {
  console.error('❌ Error ejecutando validación:', error.message);
  process.exit(1);
}
