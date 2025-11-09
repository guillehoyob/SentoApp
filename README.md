# Sento - App de Gestión de Grupos y Viajes

**React Native + Expo SDK 54 + Supabase + TypeScript + NativeWind**

Sistema completo de gestión de grupos/viajes con **Vault Inteligente** para documentos personales.

---

## 🚀 Quick Start

```bash
npm install
npm start
```

Escanea el QR con **Expo Go** en tu móvil.

---

## 📋 Setup desde Cero

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd app_composer
npm install
```

### 2. Supabase - Ejecutar migraciones

**Dashboard → SQL Editor** - Ejecuta **en orden**:

```sql
001_initial_schema.sql              # Tablas base (profiles, groups, group_members)
004_adapt_trips_to_groups.sql       # Sistema de grupos + tipos
008_fix_rls_production.sql          # RLS policies sin recursión
009_invitation_system.sql           # Sistema de invitaciones JWT
011_vault_inteligente_completo.sql  # ⭐ Vault + roles + pre-requisitos (1832 líneas)
```

**Nota:** La migración `011` crea 8 tablas, 25+ funciones RPC, índices, y RLS completo para el sistema de documentos.

### 3. Supabase - Storage

1. **Crear bucket:** `documents` (privado, 10MB limit)
2. **Configurar RLS:** 3 políticas (ver `GUIA_RAPIDA_FASE_8_FINAL.md` PASO 4)

### 4. Edge Function (Invitaciones)

```bash
cd supabase/functions/generate-invite
supabase functions deploy generate-invite
```

Añadir secret en Dashboard: `JWT_SECRET` = tu JWT secret de Supabase

### 5. Variables de entorno

Crea `.env` en root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 6. Run

```bash
npm start
```

---

## ✅ Estado Actual (Fase 8 Completada)

### **Backend: 100% ✅**

| Feature | Estado | Detalles |
|---------|--------|----------|
| Autenticación | ✅ | Email/password + OAuth (Google) |
| Grupos/Viajes | ✅ | CRUD completo, tipo (trip/group), caducidad |
| Miembros | ✅ | Sistema de roles (Owner/Admin/Member) |
| Invitaciones | ✅ | JWT stateless + deep links |
| **Vault Inteligente** | ✅ | **8 tablas, 25 funciones RPC** |
| Sistema de Roles | ✅ | Owner/Admin/Member con permisos |
| Pre-requisitos | ✅ | Docs requeridos al crear grupo |
| Solicitudes Masivas | ✅ | Múltiples docs o múltiples personas |
| Permisos Flexibles | ✅ | 5 tipos (Permanente, Trip-linked, Temporal, Manual, Programado) |
| Seguridad | ✅ | Rate limiting (10/min), auditoría completa |
| Storage | ✅ | Bucket privado con RLS robusto |

### **Frontend: En desarrollo ⏳**

| Feature | Estado |
|---------|--------|
| Auth UI | ✅ |
| Grupos UI | ✅ |
| Invitaciones UI | ✅ |
| Vault UI | 🚧 En progreso |

---

## 🏗️ Arquitectura

### **Backend (Supabase)**

```
📦 DATABASE
├─ profiles (usuarios)
├─ groups (grupos/viajes)
├─ group_members (con roles)
└─ VAULT SYSTEM (8 tablas):
   ├─ user_documents (vault personal)
   ├─ document_shares (compartir, 5 tipos)
   ├─ document_individual_shares
   ├─ document_access_logs (auditoría)
   ├─ document_access_requests
   ├─ bulk_access_requests (solicitudes masivas)
   ├─ group_document_requirements
   └─ document_rate_limits

📦 RPC FUNCTIONS (25+)
├─ Gestión de documentos (3)
├─ Compartir/Ocultar (3)
├─ Solicitudes individuales (4)
├─ Solicitudes masivas (3)
├─ Pre-requisitos (4)
├─ Roles (3)
├─ Acceso y auditoría (3)
└─ Rate limiting (2)

📦 STORAGE
└─ documents (bucket privado con 3 RLS policies)

📦 EDGE FUNCTIONS
└─ generate-invite (JWT tokens)
```

### **Frontend (React Native + Expo)**

```
📱 APP
├─ /app                      # Expo Router (file-based)
│  ├─ index.tsx              # Welcome
│  ├─ auth/                  # Login/Signup
│  └─ (authenticated)/       # Protected routes
│     ├─ home.tsx
│     ├─ groups.tsx
│     ├─ create-group.tsx
│     ├─ group-detail.tsx
│     └─ join.tsx            # Invitaciones
│
├─ /src
│  ├─ /components            # UI reutilizables
│  │  ├─ Button.tsx
│  │  ├─ TextInput.tsx
│  │  └─ ShareInviteModal.tsx
│  │
│  ├─ /services              # Supabase services
│  │  ├─ auth.service.ts
│  │  ├─ groups.service.ts
│  │  └─ invites.service.ts
│  │
│  ├─ /hooks                 # Custom hooks
│  │  ├─ useAuth.ts
│  │  ├─ useGroups.ts
│  │  └─ useGroup.ts
│  │
│  └─ /types                 # TypeScript interfaces
│     ├─ auth.types.ts
│     ├─ groups.types.ts
│     └─ invites.types.ts
│
└─ /supabase
   ├─ /migrations            # SQL migrations
   └─ /functions             # Edge Functions
```

---

## 🎨 Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework** | React Native | - |
| **Build** | Expo | SDK 54 |
| **Routing** | Expo Router | v4 |
| **Language** | TypeScript | 5.x |
| **Backend** | Supabase | - |
| **Database** | PostgreSQL | - |
| **Styling** | NativeWind | v2.0.11 |
| **CSS Framework** | Tailwind CSS | v3.3 |
| **Fonts** | Playfair Display (Google) + General Sans (local) | - |

---

## 🔑 Conceptos Clave

### **Grupos vs Viajes**
- **`type='group'`:** Sin fecha fin (permanente)
- **`type='trip'`:** Con fecha fin (caduca), lógica especial para documentos

### **Sistema de Roles**
- **Owner:** Creador, ve todo, gestiona admins
- **Admin:** Promovido por owner, ve todos los docs, puede solicitar masivamente
- **Member:** Usuario regular, solicita permisos individuales

### **5 Tipos de Permisos (Documentos)**
1. **Permanent:** Siempre visible
2. **Trip-linked:** Se activa/oculta con fechas del viaje
3. **Temporary:** X días personalizados
4. **Manual:** Hasta que el dueño lo oculte
5. **Scheduled:** Desde fecha X hasta Y

### **Solicitudes Masivas**
- **Múltiples docs a 1 persona:** 1 notificación en vez de 5
- **1 doc a múltiples personas:** Dashboard de progreso (X/N aprobadas)

### **Pre-requisitos de Grupo**
Al crear un grupo/viaje, el owner configura qué documentos son obligatorios (ej: Pasaporte + Seguro). Al unirse, los miembros ven un modal de bienvenida solicitando compartir esos docs.

---

## 📚 Documentación

| Documento | Propósito |
|-----------|-----------|
| `PENDIENTES.md` | Plan completo, roadmap, próximos pasos |
| `sento_phased_plan (1).md` | PRD original con todas las fases |
| `GUIA_RAPIDA_FASE_6.md` | Sistema de invitaciones (backend) |
| `GUIA_RAPIDA_FASE_8_FINAL.md` | ⭐ Vault Inteligente (backend) - **Guía de ejecución** |
| `INSTRUCCIONES_FASE_6.md` | Invitaciones con explicaciones detalladas |
| `INSTRUCCIONES_FASE_8.md` | Vault con explicaciones detalladas |
| `DECISION_FINAL_8A_PLUS_PLUS.md` | Por qué elegimos este diseño de Vault |
| `VAULT_INTELIGENTE_B_PLUS_PLUS.md` | Diseño detallado del sistema B++ |
| `ROADMAP_DOCUMENTOS_COMPLETO.md` | Roadmap completo hasta Fase 14 (seguridad máxima) |

---

## 🧪 Testing

### **Verificar Backend**
Ver `GUIA_RAPIDA_FASE_8_FINAL.md` → PASO 5 (Testing básico)

### **Testing en desarrollo**
- Expo Go para testing rápido
- Deep links funcionan solo en builds nativos (APK/IPA)
- Botón de testing incluido para simular deep links en dev

---

## 🚀 Deployment

### **Backend (Supabase)**
- Migraciones ejecutadas ✅
- Edge Functions desplegadas ✅
- Storage configurado ✅

### **Frontend (Expo)**
- **Development:** `npm start` + Expo Go
- **Production:** `eas build` para generar APK/IPA

---

## 📊 Progreso del Proyecto

```
✅ Fase 1-5:   Auth, Grupos, Perfiles, RLS
✅ Fase 6:     Backend Invitaciones (JWT + RPC)
✅ Fase 7:     Frontend Invitaciones (UI + deep links)
✅ Fase 8:     Backend Vault Inteligente (8A++ completo)
🚧 Fase 9-10:  Frontend Vault (en desarrollo)
⏳ Fase 11:    Documentos de Grupo
⏳ Fase 12-13: Gastos, Chat, Itinerarios
⏳ Fase 14:    Upgrade a Seguridad Máxima (PRE-LAUNCH)
```

**Estado:** MVP al 75% - Backend sólido, frontend en progreso

---

## 🤝 Contribución

Este es un proyecto privado en desarrollo. Ver `PENDIENTES.md` para próximas tareas.

---

## 📄 Licencia

Privado - Todos los derechos reservados

---

**Última actualización:** Fase 8 completada - Vault Inteligente backend 100%
