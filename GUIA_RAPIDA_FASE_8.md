# ⚡ GUÍA RÁPIDA - FASE 8: DOCUMENTOS BACKEND

**Para la guía completa y detallada, abre:** `INSTRUCCIONES_FASE_8.md`

---

## 📋 CHECKLIST RÁPIDO:

### ✅ **PASO 1: SQL en Supabase** (5 min)

1. Abre archivo: `supabase/migrations/010_documents_schema.sql`
2. Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
3. Ve a: https://supabase.com/dashboard → SQL Editor
4. Pega y haz clic en **Run**
5. Verifica:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE tablename IN ('documents', 'document_versions');
   ```
6. Debe aparecer: `documents` y `document_versions`

**✅ Hecho:** Tablas, RLS y RPC functions creadas.

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

#### **Política 1: INSERT**
- **Name:** `Miembros pueden subir documentos`
- **Operation:** INSERT
- **Definition:**
  ```sql
  (
    auth.uid() IN (
      SELECT user_id 
      FROM group_members 
      WHERE group_id = (storage.foldername(name))[1]::uuid
    )
  )
  ```

#### **Política 2: SELECT**
- **Name:** `Miembros pueden ver documentos`
- **Operation:** SELECT
- **Definition:**
  ```sql
  (
    auth.uid() IN (
      SELECT user_id 
      FROM group_members 
      WHERE group_id = (storage.foldername(name))[1]::uuid
    )
  )
  ```

#### **Política 3: DELETE**
- **Name:** `Solo dueños pueden eliminar`
- **Operation:** DELETE
- **Definition:**
  ```sql
  (
    auth.uid() = (
      SELECT owner_id 
      FROM documents 
      WHERE id = (storage.foldername(name))[2]::uuid
    )
  )
  ```

**✅ Hecho:** Storage con políticas de seguridad.

---

## ✅ VERIFICACIÓN FINAL:

**Checklist:**
- [ ] Tablas `documents` y `document_versions` existen
- [ ] 3 RPC functions creadas (`upload_doc_metadata`, `add_doc_version`, `get_group_documents`)
- [ ] Bucket `documents` creado (privado)
- [ ] 3 políticas RLS en Storage configuradas

**Si marcaste todo:** 🎉 **FASE 8 COMPLETADA**

---

## 🆘 ERRORES COMUNES:

### ❌ "relation documents already exists"
**Solución:** Ya la ejecutaste antes. ¡Está bien! Continúa.

### ❌ "bucket documents already exists"  
**Solución:** Ya existe. Verifica que tenga las políticas.

### ❌ Error en política de Storage
**Solución:** 
- Verifica que las tablas `documents` y `group_members` existan
- Copia la SQL exactamente como está

---

## 📚 CONCEPTOS CLAVE:

### **Storage Bucket**
```
Almacenamiento de archivos en Supabase
- Privado → Solo con políticas RLS
- 10MB max por archivo
- Estructura: documents/group_id/doc_id/file.pdf
```

### **RLS en Storage**
```
INSERT  → ¿Quién puede subir?
SELECT  → ¿Quién puede descargar?
DELETE  → ¿Quién puede eliminar?
```

### **Lógica de Caducidad**
```
Si viaje caducado + documento sensible:
  → Solo OWNER puede ver
  → Miembros NO (privacidad automática)
```

---

## ⏭️ SIGUIENTE:

**Fase 9: Servicio de Documentos (Frontend)**
- `documents.service.ts` para upload/download
- Hooks `useDocuments` y `useDocumentUpload`
- Progress tracking en uploads

---

## 📘 DOCUMENTACIÓN COMPLETA:

👉 **Abre:** `INSTRUCCIONES_FASE_8.md`

Para explicaciones detalladas, troubleshooting completo y diagramas de flujo.

---

**✅ Cuando termines, dime:** "Listo, completé la Fase 8"

