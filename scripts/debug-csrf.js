#!/usr/bin/env node

/**
 * Script para debuggear el sistema CSRF
 * 
 * Este script ayuda a entender qué está pasando con los tokens CSRF
 */

// Usar fetch nativo de Node.js (disponible desde v18+)
// Si no está disponible, usar https nativo
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Función fetch simple usando https nativo
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => {
              try {
                return Promise.resolve(JSON.parse(data));
              } catch (parseError) {
                return Promise.reject(new Error(`Error parseando JSON: ${parseError.message}. Data: ${data}`));
              }
            },
            text: () => Promise.resolve(data)
          };
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
      
      res.on('error', (error) => {
        reject(error);
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function debugCSRF() {
  console.log('🔍 Debuggeando sistema CSRF...\n');
  console.log(`📍 URL base: ${BASE_URL}\n`);

  try {
    // 1. Verificar que el servidor esté funcionando
    console.log('0️⃣ Verificando conectividad con el servidor...');
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/csrf-token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CSRF-Debug-Script/1.0'
        }
      });
      console.log(`   Status del servidor: ${healthResponse.status}`);
    } catch (healthError) {
      console.error(`   ❌ Error de conectividad: ${healthError.message}`);
      console.error('   💡 Asegúrate de que el servidor esté ejecutándose en:', BASE_URL);
      return;
    }

    // 1. Obtener token CSRF
    console.log('\n1️⃣ Obteniendo token CSRF...');
    const csrfResponse = await fetch(`${BASE_URL}/api/csrf-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CSRF-Debug-Script/1.0'
      }
    });

    console.log(`   Status: ${csrfResponse.status}`);
    
    if (!csrfResponse.ok) {
      console.error(`❌ Error obteniendo token CSRF: ${csrfResponse.status}`);
      try {
        const errorText = await csrfResponse.text();
        console.error('Respuesta del servidor:', errorText);
      } catch (textError) {
        console.error('No se pudo obtener el texto de error:', textError.message);
      }
      return;
    }

    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.token;
    console.log(`✅ Token CSRF obtenido: ${csrfToken}`);
    console.log(`   Expira en: ${csrfData.expiresIn} segundos`);

    // 2. Probar llamada al carrito
    console.log('\n2️⃣ Probando llamada al carrito...');
    const cartResponse = await fetch(`${BASE_URL}/api/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'User-Agent': 'CSRF-Debug-Script/1.0'
      }
    });

    console.log(`   Status: ${cartResponse.status}`);
    if (!cartResponse.ok) {
      const errorData = await cartResponse.json();
      console.log(`   Error: ${errorData.error}`);
      
      if (errorData.error && errorData.error.includes('CSRF')) {
        console.log('   🔍 Este es el error de CSRF que estamos debuggeando');
      }
    } else {
      console.log('   ✅ Llamada al carrito exitosa');
    }

    // 3. Intentar operación POST
    console.log('\n3️⃣ Probando operación POST al carrito...');
    const postResponse = await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'User-Agent': 'CSRF-Debug-Script/1.0'
      },
      body: JSON.stringify({
        productId: 'test-product-id',
        quantity: 1
      })
    });

    console.log(`   Status: ${postResponse.status}`);
    if (!postResponse.ok) {
      const errorData = await postResponse.json();
      console.log(`   Error: ${errorData.error}`);
    } else {
      console.log('   ✅ Operación POST exitosa');
    }

    // 4. Verificar logs del servidor
    console.log('\n4️⃣ Revisa los logs del servidor para ver los mensajes de debug CSRF');
    console.log('   Busca mensajes que empiecen con:');
    console.log('   - "Generando token CSRF para sessionId:"');
    console.log('   - "Validando token CSRF para sessionId:"');
    console.log('   - "Middleware CSRF - Token recibido:"');

  } catch (error) {
    console.error('\n❌ Error durante el debug:', error.message);
  }
}

// Ejecutar debug
debugCSRF()
  .then(() => {
    console.log('\n🏁 Debug completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });
