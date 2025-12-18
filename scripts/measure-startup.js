#!/usr/bin/env node

/**
 * Script para medir el tiempo de startup de la aplicación
 * Ejecutar con: node scripts/measure-startup.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('⏱️  MEDICIÓN DE TIEMPO DE STARTUP');
console.log('==================================\n');

function measureStartup(command) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Ejecutando: ${command}`);
    
    const startTime = Date.now();
    const [cmd, ...args] = command.split(' ');
    
    const child = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let hasStarted = false;
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Detectar cuando Next.js ha iniciado
      if (text.includes('Ready in') || text.includes('Local:')) {
        if (!hasStarted) {
          hasStarted = true;
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`✅ Aplicación iniciada en: ${duration}ms`);
          console.log(`📊 Tiempo: ${duration < 1000 ? '🟢 Excelente' : duration < 2000 ? '🟡 Bueno' : '🔴 Lento'}`);
          
          // Terminar el proceso
          child.kill('SIGTERM');
          resolve(duration);
        }
      }
    });
    
    child.stderr.on('data', (data) => {
      console.log(`Error: ${data.toString()}`);
    });
    
    child.on('error', (error) => {
      console.error(`Error ejecutando comando: ${error.message}`);
      reject(error);
    });
    
    // Timeout de 30 segundos
    setTimeout(() => {
      if (!hasStarted) {
        child.kill('SIGTERM');
        reject(new Error('Timeout: La aplicación no inició en 30 segundos'));
      }
    }, 30000);
  });
}

async function runTests() {
  const commands = [
    'pnpm run dev',
    'pnpm run dev:optimized'
  ];
  
  const results = {};
  
  for (const command of commands) {
    try {
      console.log(`\n📋 Probando: ${command}`);
      console.log('─'.repeat(50));
      
      const duration = await measureStartup(command);
      results[command] = duration;
      
      // Esperar un poco entre pruebas
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error con ${command}:`, error.message);
      results[command] = 'ERROR';
    }
  }
  
  // Mostrar resumen
  console.log('\n📊 RESUMEN DE RESULTADOS:');
  console.log('==========================');
  
  Object.entries(results).forEach(([command, duration]) => {
    if (duration === 'ERROR') {
      console.log(`❌ ${command}: Error`);
    } else {
      const status = duration < 1000 ? '🟢' : duration < 2000 ? '🟡' : '🔴';
      console.log(`${status} ${command}: ${duration}ms`);
    }
  });
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  console.log('===================');
  
  const optimizedTime = results['pnpm run dev:optimized'];
  const normalTime = results['pnpm run dev'];
  
  if (typeof optimizedTime === 'number' && typeof normalTime === 'number') {
    const improvement = ((normalTime - optimizedTime) / normalTime * 100).toFixed(1);
    console.log(`📈 Mejora del comando optimizado: ${improvement}%`);
    
    if (optimizedTime < 1000) {
      console.log('🎉 ¡Excelente! Tiempo de startup bajo 1 segundo');
    } else if (optimizedTime < 2000) {
      console.log('👍 Buen tiempo de startup');
    } else {
      console.log('⚠️  Considera más optimizaciones');
    }
  }
}

// Ejecutar las pruebas
runTests().catch(console.error);
