# 🔐 ¿QUÉ ES B+ (VAULT SEGURO)?

## 🎯 DECISIÓN TOMADA:

Implementamos **B+ (Vault Seguro)** = MVP serio con compliance GDPR básico

**¿Por qué B+ y no C+++?**
- ✅ Suficiente para desarrollo y beta testers
- ✅ 6-7 días vs 15-20 días
- ✅ Bajo riesgo de bugs
- ✅ Escalable a C+++ antes del launch

---

## 📊 B vs B+ vs C+++:

| Característica | B | B+ ⭐ | C+++ |
|---|---|---|---|
| Vault personal | ✓ | ✓ | ✓ |
| Control de shares | ✓ | ✓ | ✓ |
| Auditoría básica | ✓ | ✗ | ✗ |
| **Auditoría mejorada** | ✗ | ✓ | ✓ |
| **Permisos temporales** | ✗ | ✓ | ✓ |
| **Rate limiting** | ✗ | ✓ | ✓ |
| **Metadata (IP, user agent)** | ✗ | ✓ | ✓ |
| **Log intentos fallidos** | ✗ | ✓ | ✓ |
| Encriptación E2E | ✗ | ✗ | ✓ |
| Marcas de agua | ✗ | ✗ | ✓ |
| Proxy de descargas | ✗ | ✗ | ✓ |
| Geofencing | ✗ | ✗ | ✓ |

---

## ⭐ MEJORAS B+ vs B:

### **1. Permisos Temporales** (expires_at)

```sql
-- Usuario comparte su pasaporte por 7 días
share_document_with_group(doc_id, group_id, expires_in_days: 7)

-- Después de 7 días:
- El documento deja de ser visible automáticamente
- Intentos de acceso se loguean como 'expired'
- El usuario puede renovar cuando quiera
```

**Uso:**
```
Viaje a Japón (10 días):
  └─ Comparto mi pasaporte por 15 días
     → Después del viaje, expira automáticamente
     → No necesito recordar revocarlo manualmente
```

---

### **2. Rate Limiting** (10 accesos/minuto)

```sql
-- Anti-spam y anti-scraping
check_rate_limit(user_id)

-- Si el usuario hace > 10 accesos en 1 minuto:
- Se bloquea temporalmente
- Se loguea como 'rate_limited'
- Después de 1 minuto, puede acceder de nuevo
```

**Protege contra:**
- Bots que intentan descargar todos los docs
- Usuarios maliciosos que hacen scraping
- Ataques de fuerza bruta

---

### **3. Auditoría Mejorada**

```sql
-- ANTES (B):
document_access_logs:
  - action: 'view'
  - accessed_at: timestamp

-- AHORA (B+):
document_access_logs:
  - action: 'view' | 'denied'
  - success: true | false  ← NUEVO
  - error_reason: 'expired' | 'rate_limited' | 'not_member' ← NUEVO
  - metadata: {ip, user_agent, referer} ← NUEVO
  - accessed_at: timestamp
```

**Qué significa:**

```
Juan ve su auditoría:
  ✓ María vio tu pasaporte (éxito)
     └─ IP: 192.168.1.100
     └─ Device: iPhone 13
  ✗ Pedro intentó ver tu pasaporte (denegado)
     └─ Razón: Permiso expirado
     └─ IP: 83.45.12.34
  ✗ Bot intentó acceder (denegado)
     └─ Razón: Rate limited
     └─ IP: 123.45.67.89
```

---

### **4. Log de Intentos Fallidos**

```
ANTES (B):
  - Solo se loguean accesos exitosos
  - No sabes quién intentó acceder y falló

AHORA (B+):
  - Se loguean TODOS los intentos
  - Sabes quién intentó acceder y por qué falló
  - Útil para detectar accesos maliciosos
```

**Compliance GDPR:**
- ✅ Transparencia: El usuario sabe quién intenta acceder
- ✅ Auditoría: Historial completo de accesos
- ✅ Control: El usuario decide qué compartir
- ✅ Derecho al olvido: Puede revocar en cualquier momento

---

## 🚀 ROADMAP:

```
┌─────────────────────────────────────────┐
│ AHORA: B+ (Vault Seguro)                │
│ ✅ Suficiente para desarrollo           │
│ ✅ Suficiente para beta testers         │
│ ✅ GDPR básico cumplido                 │
└─────────────────────────────────────────┘
           │
           │ Semanas 1-2
           ↓
┌─────────────────────────────────────────┐
│ Frontend (Fase 9-10)                     │
│ - UI del vault                           │
│ - Upload de documentos                   │
│ - Gestión de shares                      │
│ - Visualización de auditoría            │
└─────────────────────────────────────────┘
           │
           │ Semanas 3-6
           ↓
┌─────────────────────────────────────────┐
│ Otras Features (Fase 11-13)             │
│ - Gastos compartidos                     │
│ - Chat de grupo                          │
│ - Notificaciones                         │
└─────────────────────────────────────────┘
           │
           │ Semanas 7-9 (PRE-LAUNCH)
           ↓
┌─────────────────────────────────────────┐
│ UPGRADE a C+++ (Seguridad Máxima)      │
│ ✅ Encriptación E2E                     │
│ ✅ Marcas de agua                       │
│ ✅ Proxy de descargas                   │
│ ✅ Geofencing                           │
│ ✅ GDPR completo                        │
│ ✅ Legal review                         │
└─────────────────────────────────────────┘
           │
           │ Semana 10+
           ↓
┌─────────────────────────────────────────┐
│ 🚀 LANZAMIENTO PÚBLICO                  │
└─────────────────────────────────────────┘
```

---

## ✅ ESTADO ACTUAL:

### **Backend (B+):**
- [x] Tablas creadas (4)
- [x] RPC functions (9)
- [x] RLS policies
- [x] Rate limiting
- [x] Permisos temporales
- [x] Auditoría mejorada
- [x] Metadata de accesos

### **Próximo paso:**
1. Ejecutar migración SQL (15 min)
2. Configurar Storage (10 min)
3. ✅ Backend completo

---

## 🎓 CONCEPTOS CLAVE:

### **Permisos Temporales:**
```
Escenario: Viaje de 7 días

Antes del viaje:
  └─ Comparto pasaporte (expires_in: 10 días)

Durante el viaje:
  └─ Todos pueden ver mi pasaporte ✓

Después del viaje:
  └─ El permiso expira automáticamente
  └─ Nadie puede acceder (excepto yo)
```

### **Rate Limiting:**
```
Usuario normal:
  └─ Accede 3-4 veces/hora → OK ✓

Bot malicioso:
  └─ Intenta 100 accesos/minuto → BLOQUEADO ✗
  └─ Se loguea cada intento fallido
```

### **Auditoría Mejorada:**
```
Transparencia total:
  ├─ Quién accedió (éxito)
  ├─ Quién intentó acceder (fallo)
  ├─ Desde dónde (IP)
  ├─ Con qué device (user agent)
  └─ Cuándo (timestamp)
```

---

## 🔒 ¿ES SUFICIENTE PARA GDPR?

### **SÍ para:**
- ✅ Desarrollo
- ✅ Beta testing
- ✅ Demos a inversores
- ✅ MVP inicial

### **NO para:**
- ❌ Lanzamiento público europeo (requiere C+++)
- ❌ Marketing de "máxima seguridad" (requiere C+++)
- ❌ Handling de datos extra-sensibles (médicos, legales) (requiere C+++)

---

## 📝 RESUMEN:

**B+ es el punto dulce:**
- Suficiente seguridad para empezar
- Rápido de implementar (6-7 días)
- Escalable a C+++ cuando sea necesario
- Balance perfecto para MVP serio

**Siguiente paso:**
👉 Abre `GUIA_RAPIDA_FASE_8.md` y sigue los 3 pasos

