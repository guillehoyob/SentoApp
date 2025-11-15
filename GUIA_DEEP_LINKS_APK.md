# 🔗 GUÍA: ARREGLAR DEEP LINKS + GENERAR APK

## ✅ **CAMBIOS APLICADOS**

### 1. Edge Function Corregido
- ✅ Cambiado de `https://iybjzqtiispacfmmynsx.supabase.co/invite/...`
- ✅ A `sento://invite/${group_id}?t=${token}`
- ✅ Archivo `deno.json` creado (elimina errores IDE)

### 2. App Ya Configurada
- ✅ `app.json`: Scheme `sento://` + intent filters
- ✅ `app/_layout.tsx`: Deep link handler (líneas 20-56)
- ✅ `app/(authenticated)/join.tsx`: Recibe groupId + token

---

## 🚀 **PASOS SIGUIENTES**

### **PASO 1: Redeployar Edge Function**

```bash
# En la raíz del proyecto
npx supabase functions deploy generate-invite
```

**Resultado esperado:**
```
Deploying function generate-invite
✓ Deployed function generate-invite
```

---

### **PASO 2: Verificar Deep Link Funciona**

```bash
# Limpiar cache + iniciar Expo
npx expo start --clear
```

**Test rápido (sin APK):**
1. Entrar a un grupo
2. Botón "👥 Invitar"
3. Generar invitación
4. **AHORA DEBE VER**: `sento://invite/12345-abc?t=eyJhbGc...`
5. Clic "🧪 Simular invitación" → Debe funcionar

---

### **PASO 3: Generar Nueva APK**

#### **Opción A: Build Local (Más rápido)**

```bash
# 1. Instalar eas-cli si no lo tienes
npm install -g eas-cli

# 2. Generar APK local
eas build --platform android --profile preview --local

# Esperar 10-20 minutos
# APK se guardará en la carpeta del proyecto
```

#### **Opción B: Build en la Nube (Recomendado)**

```bash
# 1. Login a Expo
eas login

# 2. Configurar build (si es primera vez)
eas build:configure

# 3. Generar APK
eas build --platform android --profile preview

# 4. Esperar ~15 minutos
# 5. Descargar APK del link que te da
```

**Si da error "No build profiles configured":**

Crear archivo `eas.json` en la raíz:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

### **PASO 4: Instalar APK en Móviles**

**Método 1: Cable USB**
```bash
# Conectar móvil con USB debugging activado
adb install nombre-del-archivo.apk
```

**Método 2: Compartir por WhatsApp/Drive**
1. Subir APK a Google Drive
2. Compartir link
3. Descargar en móvil
4. Instalar (activar "Instalar apps desconocidas" si pide)

---

### **PASO 5: TEST MULTI-USUARIO**

#### **Setup:**
- 2 móviles con APK instalada
- Usuario A registrado
- Usuario B registrado

#### **Test Completo:**

```
[USUARIO A - Móvil 1]
1. Login
2. Crear grupo "Test Deep Link"
3. Entrar al grupo
4. Botón "👥 Invitar"
5. Copiar link (debe ser sento://invite/...)
6. Compartir por WhatsApp a Usuario B

[USUARIO B - Móvil 2]
7. Recibir WhatsApp
8. Clic en link "sento://invite/..."
9. ✅ DEBE ABRIR APP SENTO automáticamente
10. ✅ DEBE VER pantalla join con info del grupo
11. Botón "Unirme al grupo"
12. ✅ DEBE unirse exitosamente
13. ✅ DEBE VER el grupo en su lista

[USUARIO A - Verificación]
14. Refrescar grupo
15. ✅ DEBE VER a Usuario B en miembros
```

---

## 🐛 **TROUBLESHOOTING**

### **Error: "Link no abre la app"**

**Causas:**
1. APK no instalada correctamente
2. Scheme no registrado en Android

**Solución:**
```bash
# Verificar app instalada
adb shell pm list packages | grep sento

# Reinstalar APK
adb uninstall com.lilg8b.app_composer
adb install nueva.apk
```

### **Error: "Link abre navegador"**

Si el link abre Chrome en vez de la app:

**Android:**
1. Abrir Configuración
2. Apps → Sento
3. "Abrir por defecto"
4. "Agregar enlaces" → Activar `sento://`

### **Error: "Edge function not found"**

```bash
# Verificar funciones deployadas
npx supabase functions list

# Si no aparece, redesplegar
npx supabase functions deploy generate-invite

# Verificar en Supabase Dashboard:
# Project → Edge Functions → generate-invite debe estar verde
```

### **Error: "Token inválido" al unirse**

**Causa:** JWT_SECRET diferente entre local y production

**Solución:**
1. Supabase Dashboard → Settings → API
2. Copiar "JWT Secret"
3. Verificar Edge Function usa variable de entorno (✅ ya configurado)
4. Redesplegar: `npx supabase functions deploy generate-invite`

---

## 📋 **CHECKLIST FINAL**

- [ ] Edge function redesplegada
- [ ] Link generado es `sento://invite/...` (no `https://`)
- [ ] APK instalada en ambos móviles
- [ ] Usuario A puede generar invitación
- [ ] Usuario B puede copiar link
- [ ] Link abre app automáticamente
- [ ] Pantalla join muestra info correcta
- [ ] Usuario B puede unirse
- [ ] Usuario A ve a B en miembros

---

## 🔄 **FLUJO COMPLETO VISUAL**

```
Usuario A (Owner)                    Usuario B (Invitado)
─────────────────                    ────────────────────

1. Crear grupo
2. Generar invitación
   └─> sento://invite/abc?t=xyz
3. Compartir por WhatsApp
                            ───────────────────────────>
                                     4. Recibe WhatsApp
                                     5. Clic link
                                     6. App se abre 🎉
                                     7. Ve pantalla join
                                     8. "Unirme al grupo"
                                     9. Unido exitosamente
                            <───────────────────────────
10. Refrescar grupo
11. Ve a B en miembros ✅
```

---

## 🎯 **SIGUIENTE PASO**

**Ejecuta ahora:**

```bash
# 1. Redesplegar Edge Function
npx supabase functions deploy generate-invite

# 2. Verificar en Expo
npx expo start --clear

# 3. Test rápido: Generar invitación → Ver que dice sento://

# 4. Si OK → Generar APK:
eas build --platform android --profile preview
```

**Una vez tengas la APK instalada en 2 móviles, avísame para continuar con el test multi-usuario completo.**

