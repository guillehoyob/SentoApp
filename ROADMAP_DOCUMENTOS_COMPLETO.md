# 📋 ROADMAP COMPLETO - SISTEMA DE DOCUMENTOS

## 🎯 VISIÓN GENERAL:

```
┌─────────────────────────────────────────────────────────────┐
│ 2 SISTEMAS SEPARADOS                                         │
└─────────────────────────────────────────────────────────────┘

1. DOCUMENTOS PERSONALES (Vault del usuario)
   ├─ Privado por defecto
   ├─ Usuario controla qué compartir
   ├─ Sistema complejo de permisos
   └─ Fases: 8A (MVP) → 8B (Avanzado) → 8C (E2E)

2. DOCUMENTOS DEL GRUPO/VIAJE
   ├─ Colaborativo (todos ven)
   ├─ Cualquiera puede subir
   ├─ Sistema simple
   └─ Fase: 11 (Futuro)
```

---

## 🚀 FASE 8A: VAULT INTELIGENTE (MVP) ⏱️ 7-8 días

### **OBJETIVO:**
Sistema funcional para grupos pequeños-medianos (2-15 personas)

### **FEATURES:**

#### **1. Permisos Flexibles (5 tipos)**
- [x] Permanente (siempre visible)
- [x] Ligado al viaje (start_date → end_date)
- [x] Temporal (X días personalizados)
- [x] Manual (hasta que el dueño oculte)
- [x] Programado (desde fecha X hasta Y)

#### **2. Sistema de Solicitudes (1:1)**
- [x] Solicitar acceso a documento oculto/expirado
- [x] Aprobar/Rechazar con condiciones
- [x] Notificaciones de solicitudes
- [x] Historial en auditoría

#### **3. Seguridad & Compliance**
- [x] Rate limiting (10 accesos/minuto)
- [x] Auditoría completa (éxitos + fallos)
- [x] Metadata (IP, user agent)
- [x] Log de intentos fallidos
- [x] RLS robusto

#### **4. Shares**
- [x] Compartir con grupo completo
- [x] Activación automática según contexto del viaje
- [x] Expiración automática

### **ARQUITECTURA:**

**Tablas (6):**
1. `user_documents`
2. `document_shares` (con share_type)
3. `document_access_logs` (con metadata)
4. `document_access_requests`
5. `document_rate_limits`
6. `document_individual_shares`

**RPC Functions (15):**
- Todas las funciones base de B++

### **LIMITACIONES MVP:**
❌ No solicitudes masivas (solo 1:1)
❌ No whitelist (permisos pre-aprobados)
❌ No dashboard de solicitudes avanzado
❌ No docs de grupo

### **SUFICIENTE PARA:**
✅ Desarrollo y testing
✅ Beta con grupos pequeños (2-10 personas)
✅ Demostrar concepto a inversores
✅ Validar UX básico

---

## ⚡ FASE 8B: FEATURES AVANZADAS ⏱️ 2-3 días

### **OBJETIVO:**
Escalar a grupos grandes (15-50 personas) y viajes corporativos

### **FEATURES:**

#### **1. Solicitudes Masivas**

**Problema que resuelve:**
```
Organizador necesita pasaportes de 15 personas
❌ Actualmente: 15 solicitudes individuales (tedioso)
✅ Con 8B: 1 solicitud masiva a todos
```

**Implementación:**
```sql
CREATE TABLE bulk_access_requests (
  id uuid PRIMARY KEY,
  group_id uuid,
  requested_by uuid,
  document_type text, -- 'passport', 'id_card', etc.
  requested_from uuid[], -- Array de user_ids
  requested_duration text,
  note text,
  approved_count integer DEFAULT 0,
  rejected_count integer DEFAULT 0,
  pending_count integer,
  created_at timestamptz
);
```

**UI/UX:**
```
Organizador ve:
  📊 10 personas tienen Pasaporte oculto
     └─ [Solicitar a todos] ← NUEVO

Dashboard de solicitud masiva:
  📋 Solicitud #123: Pasaporte
     ├─ 7/10 aprobaron ✓
     ├─ 2/10 pendientes ⏳
     └─ 1/10 rechazó ✗
```

**Nuevas RPC Functions:**
- `request_document_from_multiple()` - Solicitar a N personas
- `get_bulk_request_status()` - Estado de solicitud masiva
- `cancel_bulk_request()` - Cancelar solicitud masiva

---

#### **2. Permisos Pre-aprobados (Whitelist)**

**Problema que resuelve:**
```
Usuario quiere que solo organizadores vean su DNI
❌ Actualmente: Aprobar solicitud cada vez
✅ Con 8B: Whitelist automática
```

**Implementación:**
```sql
ALTER TABLE document_shares 
ADD COLUMN allowed_users uuid[];
ADD COLUMN denied_users uuid[];

-- Lógica:
IF allowed_users IS NOT NULL:
  visible = current_user IN allowed_users
ELSE IF denied_users IS NOT NULL:
  visible = current_user NOT IN denied_users
ELSE:
  visible = is_visible
```

**UI/UX:**
```
Configurar documento:
  ┌────────────────────────────────┐
  │ Visibilidad en "Viaje a Japón" │
  ├────────────────────────────────┤
  │ ○ Visible para todos           │
  │ ● Visible solo para:           │
  │   ├─ ☑ María (Organizadora)    │
  │   ├─ ☑ Pedro (Co-org)          │
  │   └─ ☐ Sophie                  │
  └────────────────────────────────┘
```

**Nuevas RPC Functions:**
- `set_document_whitelist()` - Configurar whitelist
- `add_to_whitelist()` - Añadir persona
- `remove_from_whitelist()` - Quitar persona

---

#### **3. Dashboard de Solicitudes Avanzado**

**Features:**
- Ver todas las solicitudes pendientes
- Aprobar/Rechazar en batch
- Filtrar por tipo de documento
- Estadísticas de aprobación

**UI/UX:**
```
📋 Mis Solicitudes (3 pendientes)
   
   Recibidas:
   ├─ María: Pasaporte (hace 2h) ⏳
   │  └─ [Aprobar] [Rechazar]
   ├─ Pedro: DNI (hace 1d) ⏳
   │  └─ [Aprobar] [Rechazar]
   └─ Sophie: Seguro (hace 3d) ⏳
      └─ [Aprobar] [Rechazar]
   
   Enviadas:
   ├─ Pasaporte de Juan: Aprobada ✓
   └─ DNI de María: Pendiente ⏳
```

---

#### **4. Solicitar por Tipo de Documento**

**Problema que resuelve:**
```
Organizador necesita DNI de TODOS
❌ Actualmente: Buscar quién tiene DNI oculto
✅ Con 8B: "Solicitar DNI a todos los que lo tienen"
```

**UI/UX:**
```
Vista: Documentos del grupo

[Solicitar documentos ▼]
  ├─ Pasaporte a todos
  ├─ DNI a todos
  ├─ Seguro médico a todos
  └─ Licencia de conducir a todos

Al seleccionar "Pasaporte a todos":
  Sistema busca:
    - Usuarios que tienen pasaporte en su vault
    - Que NO lo tienen compartido en este grupo
  
  Resultado: 10 personas encontradas
  └─ Envía solicitud masiva a las 10
```

---

### **CUANDO IMPLEMENTAR 8B:**

✅ **Implementar cuando:**
- Grupos con 15+ personas
- Viajes corporativos
- Feedback de beta testers pidiendo estas features
- Después de validar 8A con usuarios reales

❌ **NO implementar si:**
- Aún no validaste 8A
- Grupos son pequeños (< 10 personas)
- No tienes usuarios reales todavía

---

## 📁 FASE 11: DOCUMENTOS DE GRUPO ⏱️ 2 días

### **OBJETIVO:**
Sistema simple para documentos colaborativos

### **DIFERENCIAS con Vault Personal:**

| Aspecto | Vault Personal | Docs de Grupo |
|---|---|---|
| **Privacidad** | Privado por defecto | Público en el grupo |
| **Control** | Usuario individual | Cualquier miembro |
| **Permisos** | Complejos (5 tipos) | Simple (visible/no) |
| **Ubicación** | Perfil del usuario | Dentro del grupo |
| **Ejemplos** | Pasaporte, DNI | Reservas, itinerarios |

### **FEATURES:**

#### **1. Subida Colaborativa**
- Cualquier miembro puede subir docs
- Todos los miembros los ven automáticamente
- Sin permisos complejos

#### **2. Categorías**
- Reservas (hoteles, vuelos)
- Tickets (eventos, tours)
- Itinerarios
- Recibos
- Otros

#### **3. Versionado Simple**
- Actualizar documento existente
- Ver historial de versiones
- Descargar versión anterior

### **ARQUITECTURA:**

**Tabla simple:**
```sql
CREATE TABLE group_documents (
  id uuid PRIMARY KEY,
  group_id uuid REFERENCES groups(id),
  uploaded_by uuid REFERENCES profiles(id),
  category text, -- 'booking', 'ticket', 'itinerary', 'receipt', 'other'
  title text,
  storage_path text,
  mime_type text,
  size_bytes integer,
  version integer DEFAULT 1,
  created_at timestamptz
);
```

**Sin RLS complejo:**
```sql
-- Si eres miembro del grupo, ves todos los docs
CREATE POLICY "Miembros ven docs del grupo"
ON group_documents
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM group_members WHERE group_id = group_documents.group_id
  )
);
```

### **UI/UX:**

```
Vista: Grupo "Viaje a Japón"

Tabs:
  ├─ Información
  ├─ Miembros
  ├─ [Documentos Personales] ← 8A/8B
  └─ [Documentos del Grupo] ← Fase 11

Documentos del Grupo:
  📁 Reservas (3)
     ├─ Hotel Tokyo.pdf (María, hace 2d)
     ├─ Vuelo Madrid-Tokyo.pdf (Juan, hace 5d)
     └─ JR Pass.pdf (Pedro, hace 1w)
  
  📁 Tickets (2)
     ├─ Torre Tokyo.pdf (Sophie, hace 3d)
     └─ Museo Ghibli.pdf (María, hace 4d)
  
  [+ Subir documento]
```

---

## 🔐 FASE 14: SEGURIDAD MÁXIMA (C+++) ⏱️ 2-3 semanas

### **OBJETIVO:**
Encriptación E2E y compliance GDPR completo

**Features:**
- Encriptación E2E (Web Crypto API)
- Marcas de agua en PDFs
- Proxy de descargas
- Geofencing
- Auditoría inmutable
- Legal compliance completo

**Cuando:** PRE-LANZAMIENTO PÚBLICO

---

## 📅 TIMELINE RECOMENDADO:

```
┌─────────────────────────────────────────────────────────────┐
│ SEMANAS 1-2: FASE 8A (MVP)                                   │
│ ✅ Vault inteligente base                                    │
│ ✅ 5 tipos de permisos                                       │
│ ✅ Solicitudes 1:1                                           │
│ ✅ Frontend básico                                           │
└─────────────────────────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│ SEMANAS 3-6: OTRAS FEATURES                                  │
│ - Gastos compartidos                                         │
│ - Chat de grupo                                              │
│ - Notificaciones                                             │
│ - Beta testing                                               │
└─────────────────────────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│ SEMANA 7: FASE 8B (Si es necesario)                         │
│ ✅ Solicitudes masivas                                       │
│ ✅ Whitelist                                                 │
│ ✅ Dashboard avanzado                                        │
│ (Solo si beta testers lo piden)                             │
└─────────────────────────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│ SEMANA 8: FASE 11                                            │
│ ✅ Documentos de grupo                                       │
│ ✅ Sistema colaborativo simple                               │
└─────────────────────────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────┐
│ SEMANAS 9-11: FASE 14 (PRE-LAUNCH)                          │
│ ✅ Encriptación E2E                                          │
│ ✅ Compliance GDPR completo                                  │
│ ✅ Legal review                                              │
└─────────────────────────────────────────────────────────────┘
           │
           ↓
     🚀 LANZAMIENTO PÚBLICO
```

---

## 💬 RESUMEN EJECUTIVO:

### **AHORA (Semanas 1-2):**
**FASE 8A: B++ MVP**
- Sistema completo para grupos pequeños-medianos
- 5 tipos de permisos + solicitudes 1:1
- Suficiente para validar concepto

### **DESPUÉS (Cuando sea necesario):**
**FASE 8B: Features Avanzadas**
- Solicitudes masivas
- Whitelist
- Dashboard avanzado
- Solo si beta testers lo piden o grupos son grandes

**FASE 11: Docs de Grupo**
- Sistema simple y separado
- Colaborativo (todos ven)

**FASE 14: Seguridad Máxima**
- E2E encryption
- GDPR completo
- PRE-LANZAMIENTO

---

## 🎯 DECISIÓN RECOMENDADA:

### **IMPLEMENTAR AHORA: FASE 8A (B++ MVP)**

**Razones:**
1. ✅ Es un sistema completo y funcional
2. ✅ Cubre 80% de los casos de uso
3. ✅ 7-8 días (razonable)
4. ✅ Validable con beta testers
5. ✅ Features avanzadas (8B) se añaden fácil después

**NO implementar ahora: Fase 8B**

**Razones:**
1. ❌ Añade complejidad innecesaria para MVP
2. ❌ No sabes si lo necesitas (aún no tienes usuarios)
3. ❌ Puedes añadirlo en 2-3 días cuando lo pidas
4. ❌ Mejor validar 8A primero

---

## 📝 QUÉ REGISTRAR:

### **EN PENDIENTES.md:**
- [x] Fase 8A (MVP) - Para implementar ahora
- [x] Fase 8B (Avanzado) - Registrado para futuro
- [x] Fase 11 (Docs grupo) - Registrado para futuro
- [x] Fase 14 (E2E) - Registrado para PRE-LAUNCH

### **EN DOCUMENTACIÓN:**
- [x] `VAULT_INTELIGENTE_B_PLUS_PLUS.md` - Diseño completo 8A
- [x] `ROADMAP_DOCUMENTOS_COMPLETO.md` - Este documento
- [ ] Actualizar `INSTRUCCIONES_FASE_8.md` - Pasos para 8A
- [ ] Actualizar `GUIA_RAPIDA_FASE_8.md` - Quick start 8A

---

## ✅ PRÓXIMO PASO:

**Dime:**
- "Vamos con 8A (MVP), implementa todo ahora" ✓
- "Registra 8B y 11 pero implementa 8A" ✓
- "Necesito ajustar algo de 8A: [explica]" 🔧

**¿Procedemos? 🚀**

