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

### **Fase 8: Vault Inteligente (8A++)** ⏱️ Backend: ✅ | Frontend: 10-11 días
**Objetivo:** Sistema completo con roles, pre-requisitos y solicitudes inteligentes

#### **BACKEND ✅ COMPLETADO**

**Migración SQL:** `011_vault_inteligente_completo.sql` (1832 líneas)
- [x] **8 tablas creadas:**
  - [x] `user_documents` - Vault personal
  - [x] `document_shares` - Compartir con grupos (5 tipos)
  - [x] `document_individual_shares` - Shares individuales
  - [x] `document_access_logs` - Auditoría completa
  - [x] `document_access_requests` - Solicitudes individuales
  - [x] `bulk_access_requests` - Solicitudes masivas
  - [x] `group_document_requirements` - Pre-requisitos
  - [x] `document_rate_limits` - Rate limiting

- [x] **26 RPC Functions creadas:**
  - [x] Gestión de documentos (3)
  - [x] Compartir (3)
  - [x] Solicitudes individuales (4)
  - [x] Solicitudes masivas (3)
  - [x] Pre-requisitos (4)
  - [x] Roles (3)
  - [x] Acceso y auditoría (3)
  - [x] Rate limiting (2)
  - [x] Helpers (1)

- [x] **30+ índices para performance**
- [x] **24+ RLS policies para seguridad**
- [x] **1 trigger para updated_at**
- [x] **Storage bucket configurado** (privado, 10MB)
- [x] **3 RLS policies en Storage**

**Cómo ejecutar:** Ver `GUIA_RAPIDA_FASE_8_FINAL.md` (5 pasos, 30 min)
**Explicaciones detalladas:** Ver `INSTRUCCIONES_FASE_8_COMPLETO.md`

---

#### **FRONTEND ⏳ PENDIENTE** (10-11 días)

##### **Sistema de Roles & Permisos:** ⭐ CRÍTICO (1 día)
- [ ] UI para mostrar rol del usuario (badge)
- [ ] Botón "Promocionar a Admin" (solo owners)
- [ ] Permisos diferenciados en UI según rol
- [ ] Badge visual Owner/Admin/Member en listas

##### **Pre-requisitos de Grupo:** ⭐ GAME-CHANGER (1.5 días)
- [ ] Formulario al crear grupo (seleccionar docs requeridos)
- [ ] Obligatorios vs opcionales (checkboxes)
- [ ] Visibilidad: admins_only vs all_members (dropdown)
- [ ] **Modal de bienvenida** al unirse (wizard de compartir)
- [ ] Dashboard de cumplimiento (barra de progreso, X/N completo)
- [ ] Lista de quién falta qué docs (solo admins)

##### **Permisos Inteligentes:** (2 días)
- [ ] **5 tipos de permisos en UI:**
  - [ ] Permanente (toggle simple)
  - [ ] Ligado al viaje (auto, con preview de fechas)
  - [ ] Temporal (input de días)
  - [ ] Manual (default, toggle on/off cuando quiera)
  - [ ] Programado (date picker desde/hasta)
- [ ] Wizard de compartir (paso a paso, simple)
- [ ] Preview de "cuándo será visible" antes de compartir
- [ ] Iconos visuales para cada tipo

##### **Solicitudes Inteligentes:** ⭐ ESENCIAL PARA UX (1.5 días)
- [ ] **Solicitudes masivas:**
  - [ ] Modal: "Solicitar múltiples docs" (checkboxes)
  - [ ] Dashboard: "Progreso X/N aprobadas" (barra)
  - [ ] Notificación agrupada: "María te solicita 3 docs"
- [ ] **Solicitudes individuales:**
  - [ ] Botón "Solicitar acceso" en docs ocultos
  - [ ] Modal de aprobar: "Para quién?" (yo / grupo), "Cuánto?" (días)
  - [ ] Modal de rechazar: input de razón
- [ ] Badge de solicitudes pendientes (número rojo)

##### **Gestión del Vault:** (1.5 días)
- [ ] Pantalla "Mi Vault" (lista de docs)
- [ ] Botón "Subir documento" (tipo, título, archivo)
- [ ] Ver en qué grupos está compartido cada doc
- [ ] Ocultar/mostrar doc de un grupo (toggle)
- [ ] Ver logs de acceso (quién lo vio, cuándo)

##### **Dashboard de Documentos:** (1 día)
- [ ] Ver docs del grupo (filtrar por tipo)
- [ ] Ver quién compartió qué
- [ ] Indicador de "expiración próxima" (⚠️ caduca en 2 días)
- [ ] Filtros: por persona, por tipo, por estado

##### **Testing e Integración:** (2 días)
- [ ] Flujo completo: crear grupo → configurar requisitos → invitar → wizard
- [ ] Solicitudes masivas: múltiples docs
- [ ] Solicitudes masivas: 1 doc a múltiples
- [ ] Rate limiting (verificar que no explote)
- [ ] Logs de auditoría (verificar que se registra todo)
- [ ] Expiración automática de permisos trip-linked

**Estado:** Backend ✅ completo y robusto. MVP frontend usable. GDPR básico ✓✓

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

