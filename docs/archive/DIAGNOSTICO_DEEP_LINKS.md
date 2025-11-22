# 🔍 DIAGNÓSTICO: Deep Links

## ❓ **¿Dónde aparece el error "requested path is invalid"?**

Este error puede aparecer en **3 momentos diferentes**:

---

### **CASO 1: Al generar la invitación**

**Síntoma:**
- Abres el modal "👥 Invitar"
- Se muestra "Generando link..."
- Aparece error inmediatamente

**Causa:** La Edge Function en Supabase falló
**Solución:** Verificar deploy

---

### **CASO 2: Al intentar compartir por WhatsApp**

**Síntoma:**
- El link se genera OK (`sento://...`)
- Copiar link funciona
- Pero al clic "Compartir por WhatsApp" da error

**Causa:** `Linking.canOpenURL('sento://...')` no puede validar custom schemes
**Solución:** Es NORMAL, ignorar este error (solo pasa en dev/expo go)

---

### **CASO 3: Al hacer clic en el link**

**Síntoma:**
- Compartes link por WhatsApp
- Otra persona hace clic
- Da error al abrir

**Causa:** App no está instalada o intent filter no configurado
**Solución:** Necesitas APK instalada

---

## 🧪 **TEST PASO A PASO**

### **Test 1: Verificar que el link es correcto**

```
1. Abrir app
2. Entrar a un grupo
3. Botón "👥 Invitar"
4. Esperar que cargue
5. Ver el link generado
```

**✅ DEBE MOSTRAR:**
```
sento://invite/abc-123-def-456?t=eyJhbGc...
```

**❌ SI MUESTRA:**
```
https://iybjzqtiispacfmmynsx.supabase.co/invite/...
```

→ **El deploy NO funcionó**, necesitas volver a hacer deploy en Dashboard

---

### **Test 2: Copiar link (debe funcionar)**

```
1. Clic "📋 Copiar link"
2. Abrir notas/bloc de notas
3. Pegar
4. Verificar que dice: sento://invite/...
```

**✅ Si funciona:** Deploy correcto
**❌ Si da error:** Hay problema con el modal

---

### **Test 3: Compartir por WhatsApp (puede dar error)**

```
1. Clic "💬 Compartir por WhatsApp"
2. Si da error "requested path is invalid" → Es NORMAL en desarrollo
```

**Razón:** `Linking.canOpenURL('sento://...')` solo funciona con URLs http/https en Expo Go

**Solución:** Usar APK real para probar compartir

---

### **Test 4: Simular invitación (debe funcionar)**

```
1. Clic "🧪 Simular invitación (testing)"
2. Debe navegar a pantalla join
3. Debe mostrar info del grupo
```

**✅ Si funciona:** Todo OK
**❌ Si da error:** Hay problema con el parser del link

---

## 🎯 **SIGUIENTE PASO SEGÚN RESULTADO**

### **Si el link dice `sento://...` → ✅ CORRECTO**

Entonces:
- Deploy funcionó ✅
- El error "requested path is invalid" es del paso de compartir
- Es **NORMAL en desarrollo** con Expo Go
- **SOLUCIÓN:** Generar APK para probar compartir real

---

### **Si el link dice `https://...` → ❌ INCORRECTO**

Entonces:
- Deploy NO funcionó
- **SOLUCIÓN:** Volver a hacer deploy

**Pasos:**
1. Ir a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/functions/generate-invite/details
2. Buscar línea que dice:
   ```typescript
   const deepLink = `https://...
   ```
3. Cambiar por:
   ```typescript
   const deepLink = `sento://invite/${group_id}?t=${inviteToken}`;
   ```
4. Clic "Deploy" (verde, arriba derecha)
5. Esperar 10-20 segundos
6. Refrescar app con `r` en la terminal
7. Generar invitación de nuevo

---

## 🚀 **GENERAR APK (cuando link sea sento://)**

Una vez que el link sea correcto (`sento://`):

```bash
# Instalar EAS CLI (si no lo tienes)
npm install -g eas-cli

# Login
eas login

# Generar APK
eas build --platform android --profile preview
```

Esperar ~15 minutos, descargar APK, instalar en 2 móviles, y probar el flujo completo.

---

## 📊 **RESUMEN DIAGNÓSTICO**

| Paso | Qué hacer | Resultado esperado |
|------|-----------|-------------------|
| 1. Generar invitación | Modal → Ver link | `sento://invite/...` |
| 2. Copiar link | Pegar en notas | Se copia correctamente |
| 3. Compartir WhatsApp | Clic botón | Puede dar error (normal) |
| 4. Simular invitación | Clic 🧪 | Abre pantalla join |

---

**¿Cuál es tu resultado en el PASO 1?** (El link generado)

