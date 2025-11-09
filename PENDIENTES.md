# Pendientes

---

## 🎯 FASE 6 & 7: Sistema de Invitaciones

### ✅ Completado:
- [x] RPC function `join_group` creada en Supabase
- [x] Edge Function `generate-invite` desplegada
- [x] Modal de compartir invitación (copiar, WhatsApp, compartir)
- [x] Pantalla de join con preview del grupo
- [x] Configuración de deep linking (`sento://`)
- [x] Botón de prueba para desarrollo

### ⏳ Pendiente de validar:

#### **1. Probar con 2 usuarios reales**

**Cómo hacerlo:**

**Opción A: Con 2 móviles/cuentas**
1. Usuario A genera invitación y comparte por WhatsApp
2. Usuario B abre link desde WhatsApp
3. Como Expo Go no soporta deep links custom, Usuario B debe:
   - Copiar el link completo
   - En la app de Usuario B, ir a cualquier grupo
   - Pulsar "Invitar"
   - Pulsar botón "🧪 Simular invitación"
   - Esto navega a pantalla de join
4. Usuario B pulsa "Unirme al grupo"
5. Verificar en Supabase SQL Editor:
   ```sql
   SELECT g.name, gm.role, p.email 
   FROM group_members gm
   JOIN groups g ON gm.group_id = g.id
   JOIN profiles p ON gm.user_id = p.id
   WHERE g.name = 'NombreDelGrupo';
   ```

**Opción B: Generar APK de desarrollo**
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Configurar proyecto
eas build:configure

# Generar APK
eas build --platform android --profile preview
```
Con APK instalado, los deep links `sento://invite/...` funcionarán directamente.

#### **2. Validar errores**

**Ya es miembro:**
- Intenta unirte a tu propio grupo
- Debe mostrar: "Ya eres miembro de este grupo"

**Token expirado:**
- Genera token con `expiresIn: 60` (1 minuto)
- Espera 2 minutos
- Intenta unirte
- Debe mostrar: "Este link de invitación ha expirado"

#### **3. Deep links en producción**

**Cuando publiques la app:**
- Los deep links `sento://invite/...` abrirán la app automáticamente
- No será necesario el botón de prueba
- Eliminar el botón "🧪 Simular" de `ShareInviteModal.tsx` (líneas 179-201)

**Archivo a modificar:**
```typescript
// supabase/functions/generate-invite/index.ts línea 205
// Cambiar de:
const deepLink = `https://sento.app/invite/${group_id}?t=${inviteToken}`;
// A:
const deepLink = `sento://invite/${group_id}?t=${inviteToken}`;
```

---

## OAuth con Google

### Configuración en Google Cloud Console
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Seleccionar el proyecto o crear uno nuevo
3. Habilitar "Google+ API" en APIs & Services
4. Crear credenciales OAuth 2.0:
   - Tipo: Web application
   - Authorized redirect URIs:
     - `http://localhost:8081`
     - `http://localhost:8081/auth/callback`
     - `https://iybjzqtiispacfmmynsx.supabase.co/auth/v1/callback`
5. Copiar Client ID y Client Secret

### Configuración en Supabase
1. Dashboard → Authentication → Providers → Google
2. Habilitar "Enable Sign in with Google"
3. Pegar Client ID y Client Secret
4. Guardar

### Notas
- El callback URL de Supabase ya está configurado: `https://iybjzqtiispacfmmynsx.supabase.co/auth/v1/callback`
- Para desarrollo local, agregar `http://localhost:8081` y `http://localhost:8081/auth/callback` en Google Cloud Console
- El flujo funciona así: Usuario → Google → Supabase → App (`/auth/callback`)

## Confirmación de Email

### Opción 1: Deshabilitar (Desarrollo)
- Dashboard → Authentication → Settings → Email Auth
- Desactivar "Enable email confirmations"
- Los usuarios pueden iniciar sesión inmediatamente después de registrarse

### Opción 2: Habilitar con servicio de email local (Desarrollo)
1. Usar servicio como [Mailtrap](https://mailtrap.io/) o [MailHog](https://github.com/mailhog/MailHog)
2. Configurar SMTP en Supabase:
   - Dashboard → Settings → Auth → SMTP Settings
   - Usar credenciales del servicio de email
3. Los emails de confirmación llegarán al servicio de prueba

### Opción 3: Usar ngrok para producción (Testing)
1. Instalar ngrok: `npm install -g ngrok`
2. Exponer localhost: `ngrok http 8081`
3. Usar la URL de ngrok en Supabase Redirect URLs
4. Configurar email templates en Supabase con la URL de ngrok

### Notas
- En producción, usar un dominio real y configurar SMTP real
- Los emails de confirmación contienen un link que debe apuntar a la app
- Para mobile, el link debe usar el scheme `sento://` configurado en `app.json`

