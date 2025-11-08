# ⚡ GUÍA RÁPIDA - FASE 6

**Para la guía completa y detallada, abre:** `INSTRUCCIONES_FASE_6.md`

---

## 📋 CHECKLIST RÁPIDO:

### ✅ **PASO 1: SQL en Supabase** (3 min)

1. Abre archivo: `supabase/migrations/009_invitation_system.sql`
2. Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
3. Ve a: https://supabase.com/dashboard → SQL Editor
4. Pega y haz clic en **Run**
5. Verifica: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'join_group';`
6. Debe aparecer: `join_group` en los resultados

**✅ Hecho:** La función `join_group()` está en la base de datos.

---

### ✅ **PASO 2: Desplegar Edge Function** (10 min)

**En PowerShell (como Administrador):**

```powershell
# 1. Instalar Scoop (si no lo tienes)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
irm get.scoop.sh | iex

# 2. Instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 3. Verificar
supabase --version

# 4. Login
supabase login
# (Se abrirá navegador, autoriza)

# 5. Ir a tu proyecto
cd C:\Users\ghoyo\Desktop\app_composer

# 6. Linkear proyecto
supabase link --project-ref iybjzqtiispacfmmynsx
# (Te pedirá contraseña de la BASE DE DATOS)

# 7. Desplegar función
supabase functions deploy generate-invite
```

**Verificar:**
- Ve a: https://supabase.com/dashboard → Edge Functions
- Debe aparecer: `generate-invite` con estado **Active** (verde)

**✅ Hecho:** La Edge Function está desplegada en Supabase.

---

### ✅ **PASO 3: Verificación Final** (2 min)

**Checklist:**
- [ ] Migración SQL ejecutada (función `join_group` existe)
- [ ] Edge Function desplegada (`generate-invite` está Active)
- [ ] Archivos existen:
  - `src/services/invites.service.ts` ✓
  - `src/types/invites.types.ts` ✓

**Si marcaste todo:** 🎉 **FASE 6 COMPLETADA**

---

## 🆘 ERRORES COMUNES:

### ❌ "supabase: command not found"
**Solución:** Cierra y vuelve a abrir PowerShell.

### ❌ Error de contraseña al linkear
**Solución:** 
- Es la contraseña de la BASE DE DATOS (no de tu cuenta)
- La encuentras en: Supabase Dashboard > Settings > Database

### ❌ "function join_group already exists"
**Solución:** Ya la ejecutaste antes. ¡Está bien! Continúa.

---

## 📚 DOCUMENTACIÓN COMPLETA:

**Para explicaciones detalladas, capturas de pantalla y troubleshooting completo:**

👉 **Abre:** `INSTRUCCIONES_FASE_6.md`

---

## ✅ CUANDO TERMINES:

Dime: **"Listo, completé la Fase 6"**

Y continuaremos con la **Fase 7: Frontend de Invitaciones** 🚀

