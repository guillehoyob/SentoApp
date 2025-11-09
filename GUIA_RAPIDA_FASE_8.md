# ⚡ GUÍA RÁPIDA - FASE 8: VAULT PERSONAL

**Para la guía completa y detallada, abre:** `INSTRUCCIONES_FASE_8.md`

---

## 🎯 QUÉ VAMOS A CREAR:

### **Vault Personal:**
- Cada usuario tiene documentos privados (pasaporte, DNI, etc.)
- El usuario decide qué compartir y con quién
- Puede ocultar/mostrar en cualquier momento
- Auditoría completa: sabe quién vio sus docs

---

## 📋 CHECKLIST RÁPIDO:

### ✅ **PASO 1: SQL en Supabase** (5 min)

1. Abre archivo: `supabase/migrations/010_vault_personal.sql`
2. Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
3. Ve a: https://supabase.com/dashboard → SQL Editor
4. Pega y haz clic en **Run**
5. Verifica:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE tablename IN ('user_documents', 'document_shares', 'document_access_logs');
   ```
6. Debe aparecer: `user_documents`, `document_shares`, `document_access_logs`

**✅ Hecho:** Tablas, RLS y 8 RPC functions creadas.

---

### ✅ **PASO 2: Crear Bucket en Storage** (3 min)

1. Ve a: https://supabase.com/dashboard → Storage → Buckets

2. Clic en **"New bucket"**

3. **Name:** `documents`

4. **Public bucket:** ❌ OFF (privado)

5. **File size limit:** `10 MB`

6. **Create bucket**

**✅ Hecho:** Almacenamiento para archivos creado.

---

### ✅ **PASO 3: Configurar Políticas RLS en Storage** (5 min)

1. Clic en bucket `documents` → Pestaña **"Policies"**

2. **New policy** → **For full customization**

#### **Política 1: INSERT (Subir)**
- **Name:** `Usuarios pueden subir a su carpeta`
- **Operation:** INSERT
- **Definition:**
  ```sql
  (
    auth.uid()::text = (storage.foldername(name))[2]
  )
  ```

**Explicación:** `documents/personal/USER_ID/...` → Solo subes a tu carpeta.

---

#### **Política 2: SELECT (Descargar)**
- **Name:** `Ver docs propios o compartidos`
- **Operation:** SELECT
- **Definition:**
  ```sql
  (
    -- Es tu documento
    auth.uid()::text = (storage.foldername(name))[2]
    OR
    -- O está compartido contigo en algún grupo
    EXISTS (
      SELECT 1 
      FROM document_shares ds
      JOIN user_documents ud ON ud.id = ds.document_id
      JOIN group_members gm ON gm.group_id = ds.group_id
      WHERE ud.storage_path = name
        AND gm.user_id = auth.uid()
        AND ds.is_visible = true
    )
  )
  ```

**Explicación:** Ves tu doc O docs que otros compartieron contigo.

---

#### **Política 3: DELETE (Eliminar)**
- **Name:** `Solo dueños eliminan`
- **Operation:** DELETE
- **Definition:**
  ```sql
  (
    auth.uid()::text = (storage.foldername(name))[2]
  )
  ```

**Explicación:** Solo borras tus propios archivos.

---

**✅ Hecho:** Storage con seguridad completa.

---

## ✅ VERIFICACIÓN FINAL:

**Checklist:**
- [ ] Tablas `user_documents`, `document_shares`, `document_access_logs` existen
- [ ] 8 RPC functions creadas
- [ ] Bucket `documents` creado (privado)
- [ ] 3 políticas RLS en Storage configuradas

**Si marcaste todo:** 🎉 **FASE 8 COMPLETADA**

---

## 🆘 ERRORES COMUNES:

### ❌ "relation user_documents already exists"
**Solución:** Ya la ejecutaste antes. ¡Está bien! Continúa.

### ❌ "bucket documents already exists"  
**Solución:** Ya existe. Verifica que tenga las políticas.

### ❌ Error en política de Storage (SELECT)
**Solución:** 
- Copia la SQL **exactamente** como está
- Si falla, elimina la política y créala de nuevo
- Verifica que las tablas `user_documents`, `document_shares`, `group_members` existen

---

## 🎓 CONCEPTOS CLAVE:

### **Vault Personal**
```
Cada usuario tiene su "caja fuerte" privada:
  ├─ Pasaporte.pdf (privado por defecto)
  ├─ DNI.pdf (privado por defecto)
  └─ Seguro.pdf (privado por defecto)

Usuario decide compartir:
  └─ Pasaporte → Viaje a Japón ✓
      └─ María lo vio (2 veces)
      └─ Pedro lo vio (1 vez)
```

### **Auditoría**
```
Sabes exactamente:
  - Quién vio tu documento
  - Cuándo lo vio
  - En qué grupo lo vio
  - Cuántas veces lo vio
```

### **Control Total**
```
En cualquier momento:
  - Ocultar doc de un grupo
  - Ocultar doc de TODOS los grupos
  - Ver historial de accesos
  - Re-compartir cuando quieras
```

---

## 🔐 ARQUITECTURA:

```
┌─────────────────────────────────────────┐
│ USUARIO (Juan)                           │
│  └─ Mi Vault                             │
│     ├─ Pasaporte.pdf                     │
│     │  └─ Compartido en: 2 grupos        │
│     │     └─ Visto por: 5 personas       │
│     └─ DNI.pdf                           │
│        └─ Compartido en: 0 grupos        │
└─────────────────────────────────────────┘
           │
           │ Comparte con grupo
           ↓
┌─────────────────────────────────────────┐
│ GRUPO: Viaje a Japón                     │
│                                          │
│ Documentos compartidos:                  │
│  ├─ Juan: Pasaporte ✓                   │
│  │   └─ [Ver] [Auditoría: 3 accesos]    │
│  └─ María: DNI ✓                        │
│      └─ [Ver] [Auditoría: 1 acceso]     │
└─────────────────────────────────────────┘
```

---

## ⏭️ SIGUIENTE:

**Fase 9: Frontend del Vault**
- Servicio `documents.service.ts`
- Hooks `useDocuments` y `useDocumentUpload`
- Upload con progress bar
- Gestión de shares

**Fase 10: UI del Vault**
- Tab "Mi Vault" en perfil
- Tab "Documentos" en grupo
- Modal subir documento
- Modal auditoría

---

## 📘 DOCUMENTACIÓN COMPLETA:

👉 **Abre:** `INSTRUCCIONES_FASE_8.md`

Para explicaciones paso a paso, conceptos detallados, troubleshooting y diagramas.

---

**✅ Cuando termines, dime:** "Listo, completé la Fase 8"

**⏱️ Tiempo total:** ~15 minutos
