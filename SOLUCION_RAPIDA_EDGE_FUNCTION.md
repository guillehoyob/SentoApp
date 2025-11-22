# 🚀 SOLUCIÓN RÁPIDA: Actualizar Edge Function en Dashboard

## 📋 **PASOS (5 minutos):**

### **1. Abrir Edge Function en Supabase**

Ir a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/functions/generate-invite/details

### **2. Editar el código**

1. En la página que se abre, verás el código actual
2. Buscar la línea **202** (aproximadamente) que dice:
   ```typescript
   const deepLink = `https://iybjzqtiispacfmmynsx.supabase.co/invite/${group_id}?t=${inviteToken}`;
   ```

3. **REEMPLAZAR** por:
   ```typescript
   const deepLink = `sento://invite/${group_id}?t=${inviteToken}`;
   ```

4. Botón verde "Deploy" (esquina superior derecha)

---

## 📸 **VISUAL:**

```
ANTES (❌ No funciona):
https://iybjzqtiispacfmmynsx.supabase.co/invite/abc123?t=xyz

DESPUÉS (✅ Funciona):
sento://invite/abc123?t=xyz
```

---

## ✅ **VERIFICAR QUE FUNCIONÓ:**

### **Test 1: Generar invitación nueva**

```bash
# Limpiar cache
npx expo start --clear
```

1. Abrir app en el móvil/emulador
2. Entrar a un grupo
3. Botón "👥 Invitar"
4. Generar invitación
5. ✅ **DEBE MOSTRAR**: `sento://invite/...` (NO `https://...`)

---

## 🐛 **SI NO VES EL EDITOR EN DASHBOARD:**

### **Método Alternativo: Crear nueva versión**

1. Ir a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/functions
2. Clic en `generate-invite`
3. Si no hay editor visible, busca pestaña "Code" o "Source"
4. Si aún no aparece:

**Crear función nueva desde cero:**

```bash
# En tu PowerShell
cd C:\Users\ghoyo\Desktop\app_composer\supabase\functions\generate-invite

# Ver contenido del archivo
type index.ts
```

Luego:
1. Dashboard → Functions → "Create a new function"
2. Nombre: `generate-invite`
3. Copiar TODO el contenido de `index.ts`
4. Pegar en el editor
5. Deploy

---

## 💡 **ALTERNATIVA: Usar Supabase Studio (Local)**

Si prefieres NO usar Dashboard:

```bash
# 1. Iniciar Supabase local
npx supabase start

# 2. Abrir Studio local
# Ir a: http://localhost:54323

# 3. Editar función ahí
# 4. Aplicar cambios al proyecto remoto
npx supabase db push
```

---

## 🎯 **RESULTADO FINAL:**

Una vez actualizada la función (por cualquier método):

✅ Links generados serán: `sento://invite/...`  
✅ Al clic en Android/iOS → Abre app Sento  
✅ Navega a pantalla join automáticamente  

---

**¿Qué método prefieres?**
- **A)** Editar en Dashboard (más simple)
- **B)** Copiar/pegar código completo en función nueva
- **C)** Yo te doy el código completo corregido y lo pegas manual

