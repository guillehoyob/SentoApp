# PRÓXIMOS PASOS - DESARROLLO SENTO

## 🔥 PRIORIDAD ALTA (MVP Core)

### 1. Modal Onboarding Nuevos Miembros
**Cuándo:** Al unirse a grupo con requisitos
**Qué muestra:**
- Lista docs requeridos (obligatorios resaltados)
- Checkbox "He leído y acepto compartir estos documentos"
- Botón "Compartir y Unirme" / "Cancelar"

**Backend:** ✅ Ya existe
**UI:** ❌ Falta crear

---

### 2. Solicitudes desde Grupo
**Desde:** Pantalla grupo (para owners/admins)
**UI:**
- Botón "Solicitar Documentos"
- Modal:
  - Seleccionar usuarios (múltiples)
  - Seleccionar docs (múltiples)
  - Tipo permiso (manual/temporal/trip)
  - Enviar

**Backend:** ✅ Ya existe (`create_bulk_access_request`)
**UI:** ❌ Falta crear

---

### 3. Editar/Revocar Permisos Individuales
**Desde:** Vault → Expandir doc → Ver "Compartido en"
**UI actual:** Solo muestra lista
**Mejorar:**
- Cada grupo: botón editar/revocar
- Modal editar: cambiar fechas, tipo, whitelist
- Confirmar revocación

**Backend:** ⚠️ Falta `update_document_share` RPC
**UI:** ⚠️ Falta modal editar

---

### 4. Fix Bug: "Programado" sin fechas
**Problema:** Muestra "Programado" aunque no hay `starts_at`
**Fix:** Verificar lógica en:
- `ShareDocumentModal.tsx` (frontend)
- `get_my_documents` / `get_group_shared_documents` (backend)

---

## 📱 SIGUIENTE MILESTONE: APK

### Requisitos Pre-APK:
- [ ] Completar 4 prioridades altas
- [ ] Actualizar READMEs
- [ ] Eliminar archivos obsoletos
- [ ] Plan de pruebas actualizado

### Después de APK:
- Test multi-usuario (solicitudes, aprobaciones)
- Test permisos temporales (expiración)
- Test rate limiting
- Test deep links invitaciones

---

## 🎨 MEJORAS UX (Post-MVP)

### A. Indicadores Visuales
- Badge contador solicitudes pendientes (en vault header)
- Badge docs faltantes requisitos (en grupo)
- Indicador progreso cumplimiento requisitos

### B. Filtros & Búsqueda
- Filtrar logs por documento
- Filtrar logs por grupo
- Buscar documentos en vault
- Ordenar por tipo/fecha

### C. Bulk Actions
- Compartir múltiples docs a la vez
- Revocar múltiples permisos
- Ocultar múltiples docs

---

## 🔔 NOTIFICACIONES (Fase 2)

### Firebase Cloud Messaging
1. Push: Nueva solicitud acceso
2. Push: Solicitud aprobada/rechazada
3. Push: Documento compartido contigo
4. Push: Permiso por expirar (24h antes)
5. In-app: Nuevos miembros en grupo

---

## 📊 ORDEN RECOMENDADO

1. **HOY:** Modal onboarding + Solicitar desde grupo (UI)
2. **MAÑANA:** Editar/revocar permisos + Fix "Programado"
3. **LUEGO:** Actualizar docs + Limpiar archivos
4. **DESPUÉS:** Generar APK + Test multi-usuario
5. **FUTURO:** Notificaciones + Mejoras UX

---

**ESTADO ACTUAL:** 70% MVP Core → Falta 30% UI features avanzadas

