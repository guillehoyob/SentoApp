# 📋 INSTRUCCIONES FASE 8 - DOCUMENTOS BACKEND

## 📁 ARCHIVOS QUE CREAREMOS:

```
C:\Users\ghoyo\Desktop\app_composer\
│
└─ supabase/
   └─ migrations/
      └─ 010_documents_schema.sql          ← SQL para ejecutar en Supabase
```

---

## 🚀 LO QUE VAMOS A CREAR:

### **1. Tablas en PostgreSQL:**
- `documents` → Metadata de documentos (título, tipo, dueño)
- `document_versions` → Versiones de archivos (path, tamaño, OCR data)

### **2. Supabase Storage:**
- Bucket `documents` → Almacenamiento de archivos (privado)

### **3. RLS Policies:**
- Solo miembros del grupo pueden ver documentos
- Documentos sensibles en viajes caducados: **solo el owner**

### **4. RPC Functions:**
- `upload_doc_metadata()` → Crear metadata de documento
- `add_doc_version()` → Añadir versión de archivo
- `get_group_documents()` → Obtener documentos con última versión

---

## 🗄️ **PASO 1: EJECUTAR MIGRACIÓN SQL** ⏱️ 5 minutos

### **¿QUÉ VAMOS A HACER?**
Crear las tablas, índices, políticas RLS y funciones RPC en Supabase.

### **ARCHIVO A USAR:**
```
📄 C:\Users\ghoyo\Desktop\app_composer\supabase\migrations\010_documents_schema.sql
```

---

### **PASO 1.1: Revisar el archivo SQL**

Este archivo creará:
1. **Tabla `documents`:**
   - Almacena metadata: título, tipo (sensible/otro), si está cifrado
   - FK a `groups` y `profiles` (owner)

2. **Tabla `document_versions`:**
   - Cada documento puede tener múltiples versiones
   - Almacena: storage_path, mime_type, tamaño, datos OCR

3. **Índices:**
   - `documents(group_id)` → Búsqueda rápida por grupo
   - `document_versions(document_id, created_at DESC)` → Última versión

4. **RLS Policies:**
   - **IMPORTANTE:** Lógica de caducidad para documentos sensibles
   - Si viaje caducado + documento sensible → solo owner puede ver

5. **RPC Functions:**
   - `upload_doc_metadata()` → Crea el documento
   - `add_doc_version()` → Añade versión
   - `get_group_documents()` → Lista documentos con lógica de caducidad

---

### **PASO 1.2: Ejecutar en Supabase**

1. Ve a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/sql/new

2. Abre el archivo: `supabase/migrations/010_documents_schema.sql`

3. **Copia TODO el contenido** (Ctrl+A, Ctrl+C)

4. **Pega** en el SQL Editor de Supabase

5. Haz clic en **"Run"**

---

### **PASO 1.3: VERIFICAR que funcionó** ✅

**Deberías ver:**
```
✓ Success. No rows returned
```

**Verificación extra:**

Ejecuta esta query:
```sql
SELECT tablename 
FROM pg_tables 
WHERE tablename IN ('documents', 'document_versions');
```

**Debe mostrar:**
```
tablename
-----------------
documents
document_versions
```

✅ **Si ves esto:** Las tablas existen.

---

## ☁️ **PASO 2: CREAR BUCKET EN SUPABASE STORAGE** ⏱️ 3 minutos

### **¿QUÉ VAMOS A HACER?**
Crear el almacenamiento para archivos (PDFs, imágenes).

---

### **PASO 2.1: Ir a Storage**

1. Ve a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/storage/buckets

2. Haz clic en **"New bucket"** (botón verde arriba a la derecha)

---

### **PASO 2.2: Configurar el bucket**

**Llena el formulario:**

- **Name:** `documents` (sin mayúsculas)
- **Public bucket:** ❌ **OFF** (debe estar privado)
- **File size limit:** `10 MB`
- **Allowed MIME types:** (dejar vacío por ahora, lo configuraremos con código)

**Haz clic en "Create bucket"**

---

### **PASO 2.3: Configurar políticas de acceso**

1. En la lista de buckets, haz clic en **`documents`**

2. Ve a la pestaña **"Policies"**

3. Haz clic en **"New policy"**

4. Selecciona **"For full customization"**

---

#### **Política 1: INSERT (Subir archivos)**

**Nombre:** `Miembros pueden subir documentos`

**Allowed operation:** `INSERT`

**Policy definition:**
```sql
(
  auth.uid() IN (
    SELECT user_id 
    FROM group_members 
    WHERE group_id = (storage.foldername(name))[1]::uuid
  )
)
```

**Explicación:** Solo los miembros del grupo pueden subir archivos a su carpeta.

**Haz clic en "Save policy"**

---

#### **Política 2: SELECT (Descargar archivos)**

**Nombre:** `Miembros pueden ver documentos`

**Allowed operation:** `SELECT`

**Policy definition:**
```sql
(
  auth.uid() IN (
    SELECT user_id 
    FROM group_members 
    WHERE group_id = (storage.foldername(name))[1]::uuid
  )
)
```

**Explicación:** Solo los miembros del grupo pueden descargar archivos de su carpeta.

**Haz clic en "Save policy"**

---

#### **Política 3: DELETE (Eliminar archivos)**

**Nombre:** `Solo dueños pueden eliminar`

**Allowed operation:** `DELETE`

**Policy definition:**
```sql
(
  auth.uid() = (
    SELECT owner_id 
    FROM documents 
    WHERE id = (storage.foldername(name))[2]::uuid
  )
)
```

**Explicación:** Solo el owner del documento puede eliminarlo.

**Haz clic en "Save policy"**

---

### **PASO 2.4: VERIFICAR Storage**

1. Ve a: Storage > documents

2. Deberías ver el bucket vacío

3. Pestaña "Policies" debe mostrar las 3 políticas

✅ **Si ves esto:** Storage configurado correctamente.

---

## ✅ **PASO 3: VERIFICACIÓN FINAL** ⏱️ 2 minutos

### **Checklist:**

- [ ] **✅ Tablas creadas**
  - Ejecuta: `SELECT tablename FROM pg_tables WHERE tablename IN ('documents', 'document_versions');`
  - Debe mostrar ambas tablas

- [ ] **✅ RPC functions creadas**
  - Ejecuta:
    ```sql
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_name IN (
      'upload_doc_metadata',
      'add_doc_version',
      'get_group_documents'
    );
    ```
  - Debe mostrar las 3 funciones

- [ ] **✅ Bucket creado**
  - Ve a Storage
  - Bucket `documents` existe
  - Es privado (no public)
  - Tiene 3 políticas configuradas

**Si marcaste los 3:** ✅ **¡FASE 8 COMPLETADA!** 🎉

---

## 🎓 **CONCEPTOS QUE APRENDISTE:**

### **Storage Buckets**
Almacenamiento de archivos en Supabase:
```
Bucket = Carpeta raíz para archivos
  ├─ Puede ser público o privado
  ├─ Tiene límites de tamaño
  ├─ Tiene políticas RLS propias
  └─ Estructura de carpetas: bucket/folder1/folder2/file.pdf
```

### **RLS en Storage**
Políticas de seguridad para archivos:
```
- INSERT → ¿Quién puede subir?
- SELECT → ¿Quién puede descargar?
- UPDATE → ¿Quién puede modificar?
- DELETE → ¿Quién puede eliminar?
```

### **Document Versions**
Sistema de versionado:
```
Un documento puede tener múltiples versiones:
  Documento: "Pasaporte Juan"
    ├─ Versión 1: pasaporte-v1.pdf (2024-01-01)
    ├─ Versión 2: pasaporte-v2.pdf (2024-03-15)
    └─ Versión 3: pasaporte-v3.pdf (2024-06-20)

Siempre mostramos la última versión (ORDER BY created_at DESC LIMIT 1)
```

### **Lógica de Caducidad**
Privacidad automática cuando el viaje termina:
```
Si type === 'trip' && end_date < now() && document.type === 'sensitive':
  → Solo el OWNER del grupo puede ver el documento
  → Los miembros NO pueden acceder (privacidad)

Si type === 'group':
  → Todos los miembros siempre pueden ver (sin caducidad)

Si document.type === 'other':
  → Todos los miembros siempre pueden ver
```

### **storage.foldername()**
Función de Supabase Storage:
```sql
-- Si el path es: documents/abc-123/def-456/file.pdf

storage.foldername(name)
→ Retorna: ['documents', 'abc-123', 'def-456']

(storage.foldername(name))[1]
→ Retorna: 'documents' (bucket name)

(storage.foldername(name))[2]
→ Retorna: 'abc-123' (group_id)

(storage.foldername(name))[3]
→ Retorna: 'def-456' (document_id)
```

---

## 🐛 TROUBLESHOOTING:

### Error: "relation documents already exists"
**Causa:** Ya ejecutaste la migración antes  
**Solución:** La tabla ya existe. ¡Está bien! Continúa.

### Error: "bucket documents already exists"
**Causa:** Ya creaste el bucket antes  
**Solución:** El bucket ya existe. Verifica que tenga las políticas configuradas.

### Error en RLS policies
**Causa:** Sintaxis incorrecta o función no existe  
**Solución:** 
1. Verifica que las tablas `documents` y `group_members` existen
2. Copia la política exactamente como está escrita
3. Si falla, elimina la política y créala de nuevo

### No puedo crear políticas en Storage
**Causa:** El bucket debe existir primero  
**Solución:** Crea el bucket antes de las políticas

---

## 📚 **EXPLICACIÓN: ¿CÓMO FUNCIONA TODO JUNTO?**

### **FLUJO COMPLETO DE UN DOCUMENTO:**

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: USUARIO SUBE DOCUMENTO                               │
└─────────────────────────────────────────────────────────────┘

Usuario selecciona archivo (PDF/imagen)
  │
  ├─ App llama: uploadDocument()
  │               │
  │               ├─ 1. Llamar RPC: upload_doc_metadata()
  │               │     │
  │               │     ├─ Verifica: ¿Es miembro del grupo? ✓
  │               │     ├─ INSERT INTO documents
  │               │     └─ RETURN document_id
  │               │
  │               ├─ 2. Subir archivo a Storage
  │               │     │
  │               │     ├─ Path: documents/GROUP_ID/DOC_ID/timestamp.pdf
  │               │     ├─ RLS verifica: ¿Es miembro? ✓
  │               │     └─ Archivo guardado en bucket
  │               │
  │               ├─ 3. Llamar RPC: add_doc_version()
  │               │     │
  │               │     ├─ INSERT INTO document_versions
  │               │     └─ Guarda: storage_path, mime_type, size
  │               │
  │               └─ 4. Retornar documento completo
  │
  └─ ✅ Documento subido exitosamente


┌─────────────────────────────────────────────────────────────┐
│ PASO 2: USUARIO VE LISTA DE DOCUMENTOS                       │
└─────────────────────────────────────────────────────────────┘

Usuario abre tab "Documentos"
  │
  ├─ App llama: getGroupDocuments(groupId)
  │               │
  │               └─ Llamar RPC: get_group_documents()
  │                     │
  │                     ├─ SELECT documents WHERE group_id = X
  │                     ├─ JOIN última versión
  │                     ├─ Aplicar lógica de caducidad:
  │                     │   * Si viaje caducado + doc sensible:
  │                     │     - Es owner? → Mostrar ✓
  │                     │     - No es owner? → Ocultar ✗
  │                     └─ RETURN lista de documentos
  │
  └─ ✅ Lista mostrada (algunos pueden estar ocultos)


┌─────────────────────────────────────────────────────────────┐
│ PASO 3: USUARIO DESCARGA DOCUMENTO                           │
└─────────────────────────────────────────────────────────────┘

Usuario pulsa documento
  │
  ├─ App llama: getDocumentUrl(storage_path)
  │               │
  │               └─ storage.from('documents').createSignedUrl()
  │                     │
  │                     ├─ RLS verifica: ¿Es miembro? ✓
  │                     ├─ Genera URL temporal (60 min)
  │                     └─ RETURN signed_url
  │
  ├─ App abre URL en navegador/visor
  │
  └─ ✅ Usuario ve/descarga el archivo
```

---

## ⏭️ SIGUIENTE PASO:

Cuando completes la Fase 8, estarás listo para la **Fase 9: Servicio de Documentos (Frontend)** donde:
- Crearemos `documents.service.ts` para upload/download
- Hooks `useDocuments` y `useDocumentUpload`
- Manejo de progress en uploads
- Validación de tipos y tamaños

**¡Avísame cuando termines para continuar! 🚀**

