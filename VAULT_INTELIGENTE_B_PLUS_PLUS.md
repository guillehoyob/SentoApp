# 🧠 VAULT INTELIGENTE (B++) - Sistema Completo

## 🎯 TU VISIÓN (CORRECTA):

**Problema identificado:**
- ❌ B+ es demasiado rígido (solo 7 días fijos)
- ❌ No considera el contexto del viaje
- ❌ No hay forma de solicitar acceso
- ❌ No se adapta a diferentes necesidades

**Tu solución (B++):**
- ✅ Permisos flexibles según contexto
- ✅ Ligado a fechas del viaje
- ✅ Sistema de solicitudes/aprobaciones
- ✅ Configuración granular por documento

---

## 📋 TIPOS DE PERMISOS (5):

### **1. PERMANENTE** (`permanent`)

```
Ejemplo: DNI, Seguro médico

Usuario: "Quiero que mi DNI esté siempre visible"
Sistema: ✓ Visible mientras estés en el grupo
         ✓ No caduca nunca
         ✓ Solo oculto si lo haces manualmente

Configuración:
  share_type: 'permanent'
  expires_at: NULL
  auto_activate: true
  activate_on_trip_start: false
```

**Uso típico:**
- DNI
- Seguro médico
- Licencia de conducir
- Documentos que siempre serán necesarios

---

### **2. LIGADO AL VIAJE** (`trip_linked`)

```
Ejemplo: Pasaporte

Usuario: "Mi pasaporte debe estar visible solo durante el viaje"
Sistema: ✓ Se activa automáticamente en start_date
         ✓ Se oculta automáticamente en end_date
         ✓ No requiere acción manual

Configuración:
  share_type: 'trip_linked'
  expires_at: NULL (se calcula del grupo)
  auto_activate: true
  activate_on_trip_start: true

Lógica:
  IF group.type == 'trip':
    visible = now() >= group.start_date AND now() <= group.end_date
  ELSE:
    visible = true (en grupos no viajes, actúa como permanente)
```

**Uso típico:**
- Pasaporte
- Visas
- Boletos de avión
- Documentos específicos del viaje

---

### **3. TEMPORAL** (`temporary`)

```
Ejemplo: Recibo temporal

Usuario: "Quiero compartir esto solo por 3 días"
Sistema: ✓ Visible durante X días desde que se comparte
         ✓ Expira después de X días
         ✓ Se puede renovar con solicitud

Configuración:
  share_type: 'temporary'
  expires_at: now() + X days
  auto_activate: true
  activate_on_trip_start: false

Timeline:
  Día 0: Usuario comparte (expires_at = ahora + 3 días)
  Día 1-2: Visible ✓
  Día 3: Expira automáticamente
  Día 4+: Oculto (se puede solicitar renovación)
```

**Uso típico:**
- Recibos temporales
- Documentos puntuales
- Info que solo necesitan por poco tiempo

---

### **4. MANUAL** (`manual`)

```
Ejemplo: Documento personal

Usuario: "Lo comparto ahora, lo oculto cuando yo decida"
Sistema: ✓ Visible desde que se comparte
         ✓ No caduca automáticamente
         ✓ Solo se oculta con acción manual del dueño

Configuración:
  share_type: 'manual'
  expires_at: NULL
  auto_activate: true
  activate_on_trip_start: false

Control total del usuario:
  - Usuario decide cuándo ocultarlo
  - No hay caducidad automática
  - Puede reactivar cuando quiera
```

**Uso típico:**
- Documentos personales
- Info que puede necesitarse en cualquier momento
- Control total del usuario

---

### **5. PROGRAMADO** (`scheduled`)

```
Ejemplo: Reserva de hotel

Usuario: "Visible desde 1 semana antes hasta 1 día después del viaje"
Sistema: ✓ Se activa automáticamente en activate_at
         ✓ Se oculta automáticamente en expires_at
         ✓ Usuario define ambas fechas

Configuración:
  share_type: 'scheduled'
  activate_at: '2025-06-15'
  expires_at: '2025-06-30'
  auto_activate: true

Timeline:
  Antes del 15/06: Oculto
  15/06 - 30/06: Visible ✓
  Después del 30/06: Oculto
```

**Uso típico:**
- Reservas de hotel
- Boletos de eventos
- Documentos con validez específica

---

## 🔄 SISTEMA DE SOLICITUDES:

### **FLUJO COMPLETO:**

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: DOCUMENTO OCULTO/EXPIRADO                            │
└─────────────────────────────────────────────────────────────┘

María ve en "Documentos del grupo":
  👤 Juan: 📄 Pasaporte
  └─ 🔒 Oculto (expiró hace 2 días)
     └─ [Solicitar acceso]


┌─────────────────────────────────────────────────────────────┐
│ PASO 2: MARÍA SOLICITA ACCESO                                │
└─────────────────────────────────────────────────────────────┘

María pulsa "Solicitar acceso"
  │
  └─ Modal:
     ├─ ¿Por cuánto tiempo?
     │  ├─ ○ 24 horas
     │  ├─ ○ 3 días
     │  ├─ ○ 7 días
     │  ├─ ○ Hasta fin del viaje
     │  ├─ ● Permanente
     │  └─ ○ Personalizado (elegir fechas)
     │
     ├─ Nota (opcional):
     │  └─ "Necesito hacer la reserva del hotel"
     │
     └─ [Enviar solicitud]

INSERT INTO document_access_requests:
  - document_id
  - requested_by: MARIA_ID
  - requested_duration: 'permanent'
  - note: "Necesito hacer la reserva del hotel"
  - status: 'pending'


┌─────────────────────────────────────────────────────────────┐
│ PASO 3: JUAN RECIBE NOTIFICACIÓN                             │
└─────────────────────────────────────────────────────────────┘

Juan ve notificación:
  🔔 María solicita ver tu Pasaporte
     └─ [Ver solicitud]

Juan abre solicitud:
  ┌──────────────────────────────────────┐
  │ Solicitud de acceso                   │
  ├──────────────────────────────────────┤
  │ María quiere ver: Pasaporte           │
  │ Duración solicitada: Permanente       │
  │ Nota: "Necesito hacer la reserva..."  │
  │ Solicitado: hace 5 minutos            │
  ├──────────────────────────────────────┤
  │ ¿Aprobar esta solicitud?              │
  │                                       │
  │ Opciones:                             │
  │ ○ Aprobar como solicitó (permanente)  │
  │ ● Aprobar por tiempo limitado:        │
  │   └─ [3 días ▼]                       │
  │ ○ Aprobar hasta fin del viaje         │
  │                                       │
  │ ¿Para quién?                          │
  │ ● Solo para María                     │
  │ ○ Para todo el grupo                  │
  │                                       │
  │ [Rechazar] [Aprobar]                  │
  └──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│ PASO 4: JUAN APRUEBA CON CONDICIONES                         │
└─────────────────────────────────────────────────────────────┘

Juan elige:
  ✓ Aprobar por 3 días
  ✓ Solo para María

Sistema ejecuta:
  1. UPDATE document_access_requests:
     - status: 'approved'
     - approved_at: now()
     - approved_duration: '3 days'
     
  2. IF "Para todo el grupo":
       UPDATE document_shares:
         - is_visible = true
         - share_type = 'temporary'
         - expires_at = now() + 3 days
     ELSE IF "Solo para María":
       INSERT INTO document_individual_shares:
         - document_id
         - shared_with: MARIA_ID
         - expires_at: now() + 3 days
         
  3. INSERT INTO document_access_logs:
     - action: 'request_approved'
     - metadata: {approved_for: 'Maria', duration: '3 days'}
     
  4. Enviar notificación a María


┌─────────────────────────────────────────────────────────────┐
│ PASO 5: MARÍA RECIBE ACCESO                                  │
└─────────────────────────────────────────────────────────────┘

María ve notificación:
  ✅ Juan aprobó tu solicitud
     └─ Puedes ver Pasaporte por 3 días

María ahora ve en "Documentos del grupo":
  👤 Juan: 📄 Pasaporte
  └─ ✅ Visible (expira en 3 días)
     └─ [Ver documento]


┌─────────────────────────────────────────────────────────────┐
│ PASO 6: AUDITORÍA COMPLETA                                   │
└─────────────────────────────────────────────────────────────┘

Juan ve en su auditoría:
  📋 Historial de Pasaporte:
     ├─ María solicitó acceso (hace 10 min)
     │  └─ Duración: Permanente
     │  └─ Nota: "Necesito hacer la reserva..."
     ├─ Juan aprobó solicitud (hace 5 min)
     │  └─ Aprobado por: 3 días
     │  └─ Solo para: María
     └─ María vio el documento (hace 2 min)
        └─ IP: 192.168.1.100
        └─ Device: iPhone 13
```

---

## 🔧 NUEVA ARQUITECTURA (B++):

### **Tablas SQL:**

```sql
-- 1. user_documents (sin cambios)
-- 2. document_shares (ACTUALIZADA)
CREATE TABLE document_shares (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES user_documents(id),
  group_id uuid REFERENCES groups(id),
  shared_by uuid REFERENCES profiles(id),
  
  -- ⭐ NUEVO: Tipo de permiso
  share_type text CHECK (share_type IN (
    'permanent',
    'trip_linked',
    'temporary',
    'manual',
    'scheduled'
  )),
  
  is_visible boolean DEFAULT true,
  expires_at timestamptz,
  
  -- ⭐ NUEVO: Para tipo 'scheduled'
  activate_at timestamptz,
  
  -- ⭐ NUEVO: Activación automática
  auto_activate_on_trip_start boolean DEFAULT false,
  
  shared_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(document_id, group_id)
);

-- 3. document_individual_shares (NUEVA)
-- Para aprobar solicitudes solo para una persona
CREATE TABLE document_individual_shares (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES user_documents(id),
  group_id uuid REFERENCES groups(id),
  shared_with uuid REFERENCES profiles(id),
  shared_by uuid REFERENCES profiles(id),
  share_type text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, group_id, shared_with)
);

-- 4. document_access_requests (NUEVA)
-- Sistema de solicitudes
CREATE TABLE document_access_requests (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES user_documents(id),
  group_id uuid REFERENCES groups(id),
  requested_by uuid REFERENCES profiles(id),
  requested_duration text, -- '24h', '3d', '7d', 'permanent', 'trip_end'
  note text,
  status text CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_duration text,
  approved_for text, -- 'requester_only', 'whole_group'
  rejected_reason text,
  created_at timestamptz DEFAULT now()
);

-- 5. document_access_logs (ACTUALIZADA)
-- Añadir action 'request_sent', 'request_approved', 'request_rejected'

-- 6. document_rate_limits (sin cambios)
```

### **Nuevas RPC Functions:**

```sql
1. request_document_access(doc_id, group_id, duration, note)
   → Crea solicitud
   → Notifica al dueño
   
2. approve_access_request(request_id, approved_duration, approved_for)
   → Actualiza request status
   → Crea share (grupal o individual)
   → Notifica al solicitante
   
3. reject_access_request(request_id, reason)
   → Actualiza request status
   → Notifica al solicitante
   
4. get_my_pending_requests()
   → Lista de solicitudes pendientes para el usuario
   
5. get_document_requests(doc_id)
   → Historial de solicitudes de un documento
   
6. check_document_visibility(doc_id, user_id, group_id)
   → Verifica si un documento es visible según:
     - share_type
     - Fechas del grupo
     - Shares individuales
     - Expiración
```

---

## 📅 LÓGICA DE VISIBILIDAD:

### **ALGORITMO:**

```typescript
function isDocumentVisible(
  document: Document,
  share: DocumentShare,
  group: Group,
  userId: string
): boolean {
  
  // 1. Verificar si hay share individual (prioridad máxima)
  const individualShare = getIndividualShare(document.id, group.id, userId);
  if (individualShare) {
    if (individualShare.expires_at && individualShare.expires_at < now()) {
      return false; // Expirado
    }
    return true; // Share individual activo
  }
  
  // 2. Verificar share del grupo
  if (!share.is_visible) {
    return false; // Oculto manualmente
  }
  
  // 3. Verificar según share_type
  switch (share.share_type) {
    
    case 'permanent':
      return true; // Siempre visible
    
    case 'trip_linked':
      if (group.type === 'trip') {
        const now = new Date();
        const start = new Date(group.start_date);
        const end = new Date(group.end_date);
        return now >= start && now <= end;
      } else {
        return true; // En grupos permanentes, actúa como 'permanent'
      }
    
    case 'temporary':
      if (share.expires_at && share.expires_at < now()) {
        return false; // Expirado
      }
      return true;
    
    case 'manual':
      return true; // Visible hasta que el dueño lo oculte
    
    case 'scheduled':
      const now = new Date();
      if (share.activate_at && now < share.activate_at) {
        return false; // Aún no activado
      }
      if (share.expires_at && now > share.expires_at) {
        return false; // Ya expirado
      }
      return true;
  }
}
```

---

## 🎯 CASOS DE USO:

### **Caso 1: Viaje a Japón (10 días)**

```
Configuración de Juan:
  
  📄 Pasaporte
  └─ Tipo: trip_linked
     └─ Se activa: 15/06 (start_date)
     └─ Se oculta: 25/06 (end_date)
  
  📄 DNI
  └─ Tipo: permanent
     └─ Siempre visible
  
  📄 Seguro médico
  └─ Tipo: permanent
     └─ Siempre visible
  
  📄 Tarjeta crédito
  └─ Tipo: temporary (3 días)
     └─ Para hacer una reserva puntual

Timeline:
  14/06: Pasaporte oculto (viaje no empezó)
  15/06: Pasaporte visible ✓ (viaje empezó)
  16/06: María hace reserva de hotel
         └─ Necesita pasaporte de Juan
         └─ Ya visible ✓
  18/06: Tarjeta crédito expira (3 días)
         └─ Pedro necesita el número
         └─ Solicita acceso por 1 día
         └─ Juan aprueba ✓
  25/06: Viaje termina
         └─ Pasaporte se oculta automáticamente
         └─ DNI sigue visible (permanent)
```

### **Caso 2: Grupo de Amigos (permanente)**

```
Configuración de María:
  
  📄 DNI
  └─ Tipo: permanent
     └─ Siempre visible
  
  📄 Licencia conducir
  └─ Tipo: manual
     └─ Lo oculta cuando quiera

Timeline:
  01/01: Crea grupo "Amigos"
  05/01: Comparte DNI (permanent)
  10/01: Comparte licencia (manual)
  15/02: Alguien necesita su DNI
         └─ Visible ✓
  20/02: Ya no quiere compartir licencia
         └─ Lo oculta manualmente
  25/02: Pedro necesita su licencia
         └─ Solicita acceso
         └─ María aprueba por 24h ✓
```

---

## ⏱️ TIEMPO DE IMPLEMENTACIÓN:

**B++ vs B+ vs C+++:**

| Componente | B+ | B++ | C+++ |
|---|---|---|---|
| Permisos básicos | ✓ | ✓ | ✓ |
| Permisos flexibles | ✗ | ✓ | ✓ |
| Sistema solicitudes | ✗ | ✓ | ✓ |
| Rate limiting | ✓ | ✓ | ✓ |
| Auditoría mejorada | ✓ | ✓ | ✓ |
| Encriptación E2E | ✗ | ✗ | ✓ |
| Marcas de agua | ✗ | ✗ | ✓ |
| **Tiempo total** | **6 días** | **7-8 días** | **18-20 días** |

---

## 💬 RESUMEN:

**B++ añade a B+:**
1. ✅ 5 tipos de permisos (vs 1 simple)
2. ✅ Lógica inteligente según tipo de grupo
3. ✅ Sistema completo de solicitudes/aprobaciones
4. ✅ Shares individuales (no solo grupales)
5. ✅ Activación automática según fechas del viaje

**Tiempo extra:** +1-2 días (7-8 días total)

**¿Vale la pena?** SÍ. Es la diferencia entre un sistema genérico y uno diseñado específicamente para viajes/grupos.

---

## 🚀 PRÓXIMOS PASOS:

1. **Actualizar migración SQL** (010_vault_inteligente.sql)
2. **Actualizar guías** (GUIA_RAPIDA_FASE_8.md, INSTRUCCIONES_FASE_8.md)
3. **Ejecutar en Supabase** (30 min)
4. **Implementar frontend** (Fase 9-10)

**¿Procedemos con B++? 🎯**

