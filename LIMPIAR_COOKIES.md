# 🍪 Cómo Limpiar Cookies para Solucionar Error JWT

## ⚡ Solución Rápida

El error `JWEDecryptionFailed` se debe a **cookies con tokens JWT inválidos** en tu navegador. La solución es simple: **limpiar las cookies**.

---

## 🔧 Método 1: Desde DevTools (Recomendado)

### Chrome/Edge:
1. Abre **DevTools** (F12 o Ctrl+Shift+I)
2. Ve a la pestaña **Application**
3. En el menú izquierdo, expande **Cookies**
4. Selecciona `http://localhost:3000`
5. Busca y **elimina** todas las cookies que empiecen con:
   - `next-auth.session-token`
   - `next-auth.csrf-token`
   - `__Secure-next-auth.session-token`
   - `__Host-next-auth.csrf-token`
6. **Recarga la página** (F5)

### Firefox:
1. Abre **DevTools** (F12 o Ctrl+Shift+I)
2. Ve a la pestaña **Storage**
3. En el menú izquierdo, expande **Cookies**
4. Selecciona `http://localhost:3000`
5. **Elimina** todas las cookies de NextAuth
6. **Recarga la página** (F5)

---

## 🔧 Método 2: Modo Incógnito (Más Rápido)

1. Abre una **ventana de incógnito**:
   - Chrome/Edge: `Ctrl+Shift+N`
   - Firefox: `Ctrl+Shift+P`
2. Visita `http://localhost:3000`
3. Los errores deberían desaparecer (no hay cookies previas)

---

## 🔧 Método 3: Limpiar Todas las Cookies

### Chrome/Edge:
1. Presiona `Ctrl+Shift+Delete`
2. Selecciona **"Cookies y otros datos del sitio"**
3. Período: **"Última hora"** o **"Todo el tiempo"**
4. Haz clic en **"Borrar datos"**

### Firefox:
1. Presiona `Ctrl+Shift+Delete`
2. Selecciona **"Cookies"**
3. Período: **"Última hora"** o **"Todo"**
4. Haz clic en **"Limpiar ahora"**

---

## 🔧 Método 4: Desde la Consola del Navegador

Abre la consola (F12) y ejecuta:

```javascript
// Eliminar todas las cookies de NextAuth
document.cookie.split(";").forEach(c => {
  const name = c.trim().split("=")[0];
  if (name.includes("next-auth")) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=localhost;`;
  }
});
location.reload();
```

---

## ✅ Verificar que Funcionó

Después de limpiar las cookies:

1. **Recarga la página** (F5)
2. Los errores `JWEDecryptionFailed` deberían **desaparecer**
3. Puedes hacer **login normalmente**
4. No deberías ver más errores 401 en la consola

---

## 🔄 Si el Problema Persiste

1. **Cierra completamente el navegador** y vuelve a abrirlo
2. **Limpia la caché del navegador** también (Ctrl+Shift+Delete → selecciona "Imágenes y archivos en caché")
3. **Reinicia el servidor** de desarrollo:
   ```bash
   # Detén (Ctrl+C) y reinicia
   pnpm dev
   ```

---

## 📝 Nota Importante

- Las cookies se regeneran automáticamente cuando haces login
- Si cambias `NEXTAUTH_SECRET` en tu entorno (Neon, Vercel, etc.), todos los usuarios tendrán que hacer login de nuevo
- En desarrollo, es normal que necesites limpiar cookies ocasionalmente

---

*Última actualización: $(date)*


