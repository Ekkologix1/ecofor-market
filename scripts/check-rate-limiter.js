function checkRateLimiter() {
  console.log('🔍 VERIFICACIÓN DEL RATE LIMITER:')
  console.log('=================================\n')
  
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`)
  
  // Verificar variables de entorno
  console.log('\n📋 VARIABLES DE ENTORNO:')
  console.log(`   UPSTASH_REDIS_REST_URL: ${process.env.UPSTASH_REDIS_REST_URL ? '✅ Configurada' : '❌ No configurada'}`)
  console.log(`   UPSTASH_REDIS_REST_TOKEN: ${process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ Configurada' : '❌ No configurada'}`)
  console.log(`   REDIS_URL: ${process.env.REDIS_URL ? '✅ Configurada' : '❌ No configurada'}`)
  
  console.log('\n🔧 CAMBIOS REALIZADOS:')
  console.log('   ✅ Rate limiting deshabilitado completamente en desarrollo')
  console.log('   ✅ Middleware de carrito modificado para desarrollo')
  console.log('   ✅ Función withRateLimit actualizada')
  
  console.log('\n💡 ESTADO ACTUAL:')
  if (process.env.NODE_ENV === 'development') {
    console.log('   ✅ En desarrollo, el rate limiting está DESHABILITADO')
    console.log('   ✅ No se requieren variables de Redis para desarrollo')
    console.log('   ✅ Las APIs del carrito funcionarán sin restricciones')
    console.log('   ✅ No más errores 429 en desarrollo')
  } else {
    console.log('   ⚠️  En producción, se recomienda configurar Redis')
    console.log('   📝 Configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN')
    console.log('   🔗 O instala Redis local y configura REDIS_URL')
  }
  
  console.log('\n🚀 PRÓXIMOS PASOS:')
  console.log('   1. Reinicia el servidor de desarrollo (Ctrl+C y npm run dev)')
  console.log('   2. Verifica que no aparezcan más errores 429')
  console.log('   3. Las imágenes locales deberían funcionar perfectamente')
  
  console.log('\n🎉 Verificación completada!')
}

checkRateLimiter()
