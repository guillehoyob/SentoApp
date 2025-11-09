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

---

## 🔐 ROADMAP: SISTEMA DE DOCUMENTOS

### **Fase 8: Vault Inteligente (8A++)** ⏱️ 10-11 días
**Objetivo:** Sistema completo con roles, pre-requisitos y solicitudes inteligentes

#### **Sistema de Roles & Permisos:** ⭐ CRÍTICO
- [ ] **3 roles:** Owner, Admin, Member
- [ ] Owners/Admins en whitelist automática (ven todo)
- [ ] Promocionar miembros a admin
- [ ] Permissions por rol (ver docs, solicitar, gestionar)

#### **Pre-requisitos de Grupo:** ⭐ GAME-CHANGER
- [ ] Configurar docs requeridos al crear grupo/viaje
- [ ] Obligatorios vs opcionales
- [ ] Visibilidad: admins_only vs all_members
- [ ] **Modal de bienvenida** al unirse (solicita docs)
- [ ] Dashboard de cumplimiento (X/N personas completas)

#### **Permisos Inteligentes:**
- [ ] Documentos personales del usuario (vault privado)
- [ ] **5 tipos de permisos:**
  - [ ] Permanente (siempre visible)
  - [ ] Ligado al viaje (start_date → end_date automático)
  - [ ] Temporal (X días personalizados)
  - [ ] Manual (hasta que el dueño oculte)
  - [ ] Programado (desde fecha X hasta Y)
- [ ] Activación automática según contexto del viaje
- [ ] Diferenciación viajes vs grupos (lógica distinta)

#### **Solicitudes Inteligentes:** ⭐ ESENCIAL PARA UX
- [ ] **Solicitudes masivas:**
  - [ ] Múltiples docs a 1 persona (vs 1 notif por doc)
  - [ ] 1 doc a múltiples personas (solicitar pasaporte a todos)
  - [ ] Dashboard de progreso (X/N aprobadas)
- [ ] **Solicitudes individuales:**
  - [ ] Solicitar acceso a docs ocultos/expirados
  - [ ] Aprobar/Rechazar con condiciones
- [ ] Notificaciones inteligentes (agrupadas)
- [ ] Historial completo en auditoría

#### **Seguridad & Auditoría:**
- [ ] Auditoría mejorada (quién, qué, cuándo, desde dónde)
- [ ] Rate limiting (10 accesos/minuto)
- [ ] Log de intentos fallidos
- [ ] Log de solicitudes (individuales y masivas)
- [ ] Storage privado con RLS robusto
- [ ] Metadata de accesos (IP, user agent)

**Estado:** MVP completo y usable. GDPR básico ✓✓

---

### **Fase 11 (Futuro): Documentos de Grupo** ⏱️ 2 días
**Objetivo:** Docs no sensibles del viaje (reservas, tickets)

- [ ] Tabla `group_documents` (separada de vault personal)
- [ ] Diferencia visual: "Mi Vault" vs "Docs del grupo"
- [ ] Todos los miembros ven docs del grupo (sin permisos)
- [ ] Subida colaborativa

---

### **Fase 14 (PRE-LAUNCH): Upgrade a Seguridad Máxima (C+++)** ⏱️ 2-3 semanas
**Objetivo:** Compliance GDPR completo + marketing de seguridad

**⚠️ CRÍTICO ANTES DE LANZAMIENTO PÚBLICO**

#### **C1: Encriptación E2E** (1 semana)
- [ ] Encriptación client-side con Web Crypto API
- [ ] Clave maestra derivada del password del usuario
- [ ] Key derivation con PBKDF2 (100k iteraciones)
- [ ] Archivos encriptados con AES-256-GCM
- [ ] Solo el usuario puede desencriptar
- [ ] Compartir: encriptar con clave del grupo

#### **C2: Auditoría Avanzada** (2-3 días)
- [ ] Logs inmutables (append-only)
- [ ] Detección de accesos anómalos
- [ ] Alertas automáticas al usuario
- [ ] Export de logs para compliance
- [ ] Retención de logs: 2 años (GDPR)

#### **C3: Controles Avanzados** (3-4 días)
- [ ] Marcas de agua en PDFs/imágenes
- [ ] Proxy de descargas (bloquear screenshot)
- [ ] Expiración forzada de permisos
- [ ] Revocación retroactiva (invalidar URLs)
- [ ] Geofencing (acceso solo desde ciertos países)

#### **C4: Compliance Legal** (2-3 días)
- [ ] Terms of Service para documentos
- [ ] Consentimiento explícito (modal)
- [ ] Right to be forgotten (delete cascade)
- [ ] Data export (JSON completo del usuario)
- [ ] Privacy Policy específica para docs
- [ ] Cookie consent para storage de auditoría

**Estado:** Listo para lanzamiento público europeo. GDPR completo ✓✓✓

---

## 📅 TIMELINE RECOMENDADO:

```
AHORA (Semanas 1-2):
├─ Fase 8: Vault Seguro (B+) ✓
└─ Fase 9-10: Frontend del vault

Semanas 3-6:
├─ Fases 11-13: Otras features (gastos, chat, etc.)
└─ Beta testing con usuarios reales

Semanas 7-9 (PRE-LAUNCH):
├─ Fase 14: Upgrade a C+++
└─ Legal review + términos

Semana 10+:
└─ LANZAMIENTO PÚBLICO
```

**IMPORTANTE:** 
- B+ es suficiente para desarrollo y beta
- C+++ es OBLIGATORIO antes de lanzamiento público
- El upgrade B+ → C+++ está diseñado para ser directo (mismas tablas, añadir features)

---

## 🚨 NOTAS IMPORTANTES PARA PRODUCCIÓN:

### **1. Cambiar deep link en Edge Function**
```typescript
// De:
const deepLink = `https://sento.app/invite/${group_id}?t=${inviteToken}`;
// A:
const deepLink = `sento://invite/${group_id}?t=${inviteToken}`;
```

**Archivo:** `supabase/functions/generate-invite/index.ts` (línea 205)

### **2. Eliminar botón de prueba**
**Archivo:** `ShareInviteModal.tsx` (líneas 179-201)

Eliminar el botón "🧪 Simular invitación (testing)"

### **3. Configurar variables de entorno en producción**
- Verificar que `JWT_SECRET` está configurado en Edge Function Settings
- Verificar URLs de callback de OAuth
- Configurar SMTP para emails de confirmación (si se habilita)

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

