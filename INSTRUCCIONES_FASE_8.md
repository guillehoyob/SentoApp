# 📋 INSTRUCCIONES FASE 8 - VAULT PERSONAL (OPCIÓN B)

## 🎯 OBJETIVO:

Crear un sistema de **documentos personales con auditoría** donde:
- Cada usuario tiene su "vault" privado
- Sube docs sensibles UNA vez (pasaporte, DNI, etc.)
- Decide qué compartir con cada grupo
- Puede ocultar/mostrar en cualquier momento
- Sabe quién vio sus documentos y cuándo

---

## 📁 ARCHIVOS QUE CREAREMOS:

```
C:\Users\ghoyo\Desktop\app_composer\
│
└─ supabase/
   └─ migrations/
      └─ 010_vault_personal.sql          ← SQL para ejecutar en Supabase
```

---

## 🏗️ ARQUITECTURA:

### **3 Tablas principales:**

```
┌─────────────────────────────────────────┐
│ user_documents                           │
│ (Vault personal del usuario)            │
│                                          │
│ - id                                     │
│ - owner_id (quién lo subió)             │
│ - type (passport, id_card, insurance)   │
│ - title                                  │
│ - storage_path                           │
│ - encrypted (true/false)                 │
│ - mime_type                              │
│ - size_bytes                             │
└─────────────────────────────────────────┘
           │
           │ 1:N
           ↓
┌─────────────────────────────────────────┐
│ document_shares                          │
│ (Control de compartir)                   │
│                                          │
│ - id                                     │
│ - document_id                            │
│ - group_id                               │
│ - shared_by                              │
│ - is_visible (true/false)                │
│ - shared_at                              │
└─────────────────────────────────────────┘
           │
           │ 1:N
           ↓
┌─────────────────────────────────────────┐
│ document_access_logs                     │
│ (Auditoría de accesos)                   │
│                                          │
│ - id                                     │
│ - document_id                            │
│ - accessed_by (quién lo vio)            │
│ - group_id (desde dónde)                │
│ - action (view, share, hide, revoke)    │
│ - accessed_at                            │
└─────────────────────────────────────────┘
```

### **8 RPC Functions:**

1. `create_personal_document()` → Sube doc al vault
2. `share_document_with_group()` → Comparte con grupo
3. `hide_document_from_group()` → Oculta de un grupo
4. `get_my_documents()` → Tus docs + en qué grupos están
5. `get_group_shared_documents()` → Docs compartidos en grupo
6. `get_document_url()` → Genera URL + log de acceso
7. `get_document_access_logs()` → Historial de accesos
8. `revoke_all_shares()` → Oculta de TODOS los grupos

---

## 🚀 **PASO 1: EJECUTAR MIGRACIÓN SQL** ⏱️ 5 minutos

### **¿QUÉ VAMOS A HACER?**
Crear las tablas, índices, políticas RLS y funciones RPC en Supabase.

### **ARCHIVO A USAR:**
```
📄 C:\Users\ghoyo\Desktop\app_composer\supabase\migrations\010_vault_personal.sql
```

---

### **PASO 1.1: Revisar el archivo SQL**

Este archivo creará:

1. **Tabla `user_documents`:**
   - Vault personal del usuario
   - Cada doc es PRIVADO por defecto
   - Solo el owner puede verlo

2. **Tabla `document_shares`:**
   - Control de con quién compartir
   - Campo `is_visible` para ocultar/mostrar
   - UNIQUE(document_id, group_id) → Un doc se comparte 1 vez por grupo

3. **Tabla `document_access_logs`:**
   - Auditoría automática
   - Registra: quién, qué, cuándo, dónde
   - Acciones: view, share, hide, revoke

4. **RLS Policies:**
   - `user_documents`: Solo el owner ve sus docs
   - `document_shares`: Owner controla shares
   - `document_access_logs`: Owner ve sus logs

5. **RPC Functions:**
   - Todas validan permisos
   - Crean logs automáticamente
   - Retornan JSON con info completa

---

### **PASO 1.2: Ejecutar en Supabase**

1. Ve a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/sql/new

2. Abre el archivo: `supabase/migrations/010_vault_personal.sql`

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
WHERE tablename IN ('user_documents', 'document_shares', 'document_access_logs');
```

**Debe mostrar:**
```
tablename
----------------------
user_documents
document_shares
document_access_logs
```

✅ **Si ves esto:** Las tablas existen.

---

**Verificar RPC functions:**

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'create_personal_document',
  'share_document_with_group',
  'hide_document_from_group',
  'get_my_documents',
  'get_group_shared_documents',
  'get_document_url',
  'get_document_access_logs',
  'revoke_all_shares'
);
```

**Debe mostrar las 8 funciones.**

✅ **Si ves las 8:** RPC functions creadas correctamente.

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
- **Allowed MIME types:** (dejar vacío por ahora)

**Haz clic en "Create bucket"**

---

### **PASO 2.3: VERIFICAR**

1. Deberías ver el bucket `documents` en la lista
2. El icono debe mostrar un candado 🔒 (privado)

✅ **Si ves esto:** Bucket creado correctamente.

---

## 🔒 **PASO 3: CONFIGURAR POLÍTICAS RLS EN STORAGE** ⏱️ 7 minutos

### **¿QUÉ VAMOS A HACER?**
Configurar seguridad: quién puede subir, ver y eliminar archivos.

---

### **PASO 3.1: Ir a políticas**

1. En la lista de buckets, haz clic en **`documents`**

2. Ve a la pestaña **"Policies"**

3. Haz clic en **"New policy"**

4. Selecciona **"For full customization"**

---

### **PASO 3.2: Política 1 - INSERT (Subir archivos)**

**Nombre:** `Usuarios pueden subir a su carpeta`

**Allowed operation:** `INSERT`

**Policy definition:**
```sql
(
  auth.uid()::text = (storage.foldername(name))[2]
)
```

**Explicación:**

```
Estructura del path: documents/personal/USER_ID/DOC_ID/file.pdf

storage.foldername(name) → ['documents', 'personal', 'USER_ID', 'DOC_ID']
                                [0]        [1]         [2]        [3]

(storage.foldername(name))[2] → 'USER_ID'

auth.uid()::text → ID del usuario autenticado

Si coinciden → Puede subir ✓
```

**Haz clic en "Save policy"**

---

### **PASO 3.3: Política 2 - SELECT (Descargar archivos)**

**Nombre:** `Ver docs propios o compartidos`

**Allowed operation:** `SELECT`

**Policy definition:**
```sql
(
  auth.uid()::text = (storage.foldername(name))[2]
  OR
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

**Explicación:**

```
Puedes descargar un archivo si:

1. Es tu documento (auth.uid() = dueño de la carpeta)
   O
2. Alguien lo compartió contigo:
   - El documento está compartido en un grupo (document_shares)
   - Tú eres miembro de ese grupo (group_members)
   - El documento está visible (is_visible = true)
```

**Haz clic en "Save policy"**

---

### **PASO 3.4: Política 3 - DELETE (Eliminar archivos)**

**Nombre:** `Solo dueños eliminan`

**Allowed operation:** `DELETE`

**Policy definition:**
```sql
(
  auth.uid()::text = (storage.foldername(name))[2]
)
```

**Explicación:**

```
Solo puedes eliminar archivos de tu propia carpeta.
```

**Haz clic en "Save policy"**

---

### **PASO 3.5: VERIFICAR Storage**

1. Ve a: Storage > documents

2. Pestaña "Policies" debe mostrar **3 políticas**:
   - INSERT: Usuarios pueden subir a su carpeta
   - SELECT: Ver docs propios o compartidos
   - DELETE: Solo dueños eliminan

✅ **Si ves las 3:** Storage configurado correctamente.

---

## ✅ **PASO 4: VERIFICACIÓN FINAL** ⏱️ 2 minutos

### **Checklist:**

- [ ] **✅ Tablas creadas**
  - Ejecuta:
    ```sql
    SELECT tablename FROM pg_tables 
    WHERE tablename IN ('user_documents', 'document_shares', 'document_access_logs');
    ```
  - Debe mostrar las 3 tablas

- [ ] **✅ RPC functions creadas**
  - Ejecuta:
    ```sql
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_name LIKE '%document%';
    ```
  - Debe mostrar las 8 funciones

- [ ] **✅ Bucket creado**
  - Ve a Storage
  - Bucket `documents` existe
  - Es privado (icono de candado 🔒)
  - Tiene 3 políticas configuradas

**Si marcaste los 3:** ✅ **¡FASE 8 COMPLETADA!** 🎉

---

## 🎓 **CONCEPTOS QUE APRENDISTE:**

### **1. Vault Personal**

```
Cada usuario tiene su "caja fuerte" privada:

Usuario Juan:
  └─ Mi Vault (privado)
     ├─ Pasaporte.pdf
     ├─ DNI.pdf
     └─ Seguro médico.pdf

Por defecto: NADIE más puede verlos
```

### **2. Compartir con Control Granular**

```
Juan decide compartir su pasaporte:

Pasaporte.pdf
  ├─ Compartido en: Viaje a Japón ✓
  ├─ Compartido en: Viaje a Francia ✓
  └─ NO compartido en: Grupo de amigos ✗

Juan puede:
  - Ocultar de "Viaje a Japón" → is_visible = false
  - Re-mostrar cuando quiera → is_visible = true
  - Revocar de TODOS los grupos
```

### **3. Auditoría Completa**

```
Juan ve quién accedió a su pasaporte:

Pasaporte.pdf
  └─ Historial de accesos:
     ├─ María vio desde "Viaje a Japón" (hace 2 horas)
     ├─ Pedro vio desde "Viaje a Japón" (hace 1 día)
     ├─ Sophie vio desde "Viaje a Francia" (hace 1 semana)
     └─ Juan lo compartió en "Viaje a Japón" (hace 2 días)

Acciones registradas:
  - 'view' → Alguien vio el documento
  - 'share' → Juan lo compartió con un grupo
  - 'hide' → Juan lo ocultó de un grupo
  - 'revoke' → Juan lo revocó de todos los grupos
```

### **4. RLS en Storage**

```
Políticas de seguridad para archivos:

INSERT → ¿Quién puede subir?
  → Solo a tu propia carpeta: documents/personal/TU_ID/

SELECT → ¿Quién puede descargar?
  → Tus docs O docs que otros compartieron contigo

DELETE → ¿Quién puede eliminar?
  → Solo tus propios archivos
```

### **5. storage.foldername()**

```
Función de Supabase Storage para extraer partes del path:

Path: documents/personal/abc-123/doc-456/passport.pdf

storage.foldername(name)
→ Retorna: ['documents', 'personal', 'abc-123', 'doc-456']

(storage.foldername(name))[0] → 'documents' (bucket)
(storage.foldername(name))[1] → 'personal' (tipo)
(storage.foldername(name))[2] → 'abc-123' (user_id)
(storage.foldername(name))[3] → 'doc-456' (document_id)
```

### **6. UNIQUE Constraint**

```
document_shares tiene: UNIQUE(document_id, group_id)

Esto significa:
  - Un documento se comparte 1 vez por grupo
  - No puedes compartir el mismo doc 2 veces en el mismo grupo
  - Si intentas compartir de nuevo, se actualiza (ON CONFLICT)

Ejemplo:
  1. Comparto pasaporte en "Viaje a Japón" → INSERT
  2. Comparto pasaporte en "Viaje a Japón" de nuevo → UPDATE
     (No crea duplicado, actualiza is_visible = true)
```

### **7. SECURITY DEFINER**

```
Las RPC functions tienen: SECURITY DEFINER

Esto significa:
  - Se ejecutan con permisos de "superusuario"
  - Pueden bypasear RLS policies
  - Nosotros controlamos la seguridad en el código SQL

¿Por qué?
  - Para hacer queries complejas (JOINs múltiples)
  - Para crear logs automáticamente
  - Para validar permisos custom

⚠️ IMPORTANTE: SIEMPRE validar auth.uid() al inicio
```

---

## 🔍 **FLUJO COMPLETO DE UN DOCUMENTO:**

### **ESCENARIO: Juan sube su pasaporte y lo comparte**

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: JUAN SUBE SU PASAPORTE                               │
└─────────────────────────────────────────────────────────────┘

Juan selecciona passport.pdf (2.5 MB)
  │
  ├─ App genera path: documents/personal/JUAN_ID/DOC_ID/passport.pdf
  │
  ├─ App sube archivo a Storage
  │  └─ RLS verifica: ¿Juan sube a su carpeta? ✓
  │
  ├─ App llama RPC: create_personal_document()
  │  └─ INSERT INTO user_documents
  │     ├─ owner_id: JUAN_ID
  │     ├─ type: 'passport'
  │     ├─ title: 'Mi Pasaporte'
  │     ├─ storage_path: documents/personal/JUAN_ID/DOC_ID/passport.pdf
  │     ├─ encrypted: false
  │     ├─ mime_type: 'application/pdf'
  │     └─ size_bytes: 2621440
  │
  └─ ✅ Pasaporte subido y guardado en el vault


┌─────────────────────────────────────────────────────────────┐
│ PASO 2: JUAN COMPARTE CON "VIAJE A JAPÓN"                    │
└─────────────────────────────────────────────────────────────┘

Juan pulsa "Compartir con grupo"
  │
  ├─ App llama RPC: share_document_with_group(doc_id, group_id)
  │  │
  │  ├─ Verifica: ¿Juan es dueño del documento? ✓
  │  ├─ Verifica: ¿Juan es miembro del grupo? ✓
  │  │
  │  ├─ INSERT INTO document_shares
  │  │  ├─ document_id: DOC_ID
  │  │  ├─ group_id: JAPON_ID
  │  │  ├─ shared_by: JUAN_ID
  │  │  └─ is_visible: true
  │  │
  │  └─ INSERT INTO document_access_logs
  │     ├─ action: 'share'
  │     ├─ accessed_by: JUAN_ID
  │     └─ group_id: JAPON_ID
  │
  └─ ✅ Pasaporte compartido con el grupo


┌─────────────────────────────────────────────────────────────┐
│ PASO 3: MARÍA VE EL PASAPORTE DE JUAN                        │
└─────────────────────────────────────────────────────────────┘

María abre "Viaje a Japón" → Tab "Documentos"
  │
  ├─ App llama RPC: get_group_shared_documents(JAPON_ID)
  │  │
  │  ├─ Verifica: ¿María es miembro del grupo? ✓
  │  │
  │  └─ SELECT documents WHERE:
  │     - group_id = JAPON_ID
  │     - is_visible = true
  │     │
  │     └─ Retorna: [Pasaporte de Juan, DNI de Pedro, ...]
  │
  ├─ María pulsa "Ver pasaporte"
  │
  ├─ App llama RPC: get_document_url(DOC_ID, JAPON_ID)
  │  │
  │  ├─ Verifica: ¿María es miembro del grupo? ✓
  │  ├─ Verifica: ¿Documento está compartido y visible? ✓
  │  │
  │  ├─ INSERT INTO document_access_logs
  │  │  ├─ action: 'view'
  │  │  ├─ accessed_by: MARIA_ID
  │  │  └─ group_id: JAPON_ID
  │  │
  │  └─ Retorna: storage_path
  │
  ├─ App genera signed URL con Storage
  │
  └─ María ve el pasaporte ✅


┌─────────────────────────────────────────────────────────────┐
│ PASO 4: JUAN REVISA QUIÉN VIO SU PASAPORTE                   │
└─────────────────────────────────────────────────────────────┘

Juan abre "Mi Vault" → Pulsa en "Pasaporte"
  │
  ├─ App llama RPC: get_document_access_logs(DOC_ID)
  │  │
  │  ├─ Verifica: ¿Juan es dueño del documento? ✓
  │  │
  │  └─ SELECT * FROM document_access_logs WHERE document_id = DOC_ID
  │     ORDER BY accessed_at DESC
  │
  └─ Juan ve:
     ├─ María vio desde "Viaje a Japón" (hace 5 min) ← NUEVO
     ├─ Juan compartió en "Viaje a Japón" (hace 1 hora)
     └─ Juan subió el documento (hace 2 horas)


┌─────────────────────────────────────────────────────────────┐
│ PASO 5: JUAN OCULTA SU PASAPORTE DEL GRUPO                   │
└─────────────────────────────────────────────────────────────┘

Juan decide ocultar su pasaporte
  │
  ├─ App llama RPC: hide_document_from_group(DOC_ID, JAPON_ID)
  │  │
  │  ├─ Verifica: ¿Juan es dueño del documento? ✓
  │  │
  │  ├─ UPDATE document_shares
  │  │  SET is_visible = false
  │  │  WHERE document_id = DOC_ID AND group_id = JAPON_ID
  │  │
  │  └─ INSERT INTO document_access_logs
  │     ├─ action: 'hide'
  │     └─ accessed_by: JUAN_ID
  │
  └─ ✅ Pasaporte ocultado

Ahora:
  - Juan sigue teniendo el documento en su vault
  - María YA NO ve el pasaporte en "Viaje a Japón"
  - Juan puede re-compartir cuando quiera (is_visible = true)
```

---

## 🐛 TROUBLESHOOTING:

### Error: "relation user_documents already exists"
**Causa:** Ya ejecutaste la migración antes  
**Solución:** La tabla ya existe. ¡Está bien! Continúa.

### Error: "bucket documents already exists"
**Causa:** Ya creaste el bucket antes  
**Solución:** El bucket ya existe. Verifica que tenga las políticas configuradas.

### Error en RLS policies de Storage (SELECT)
**Causa:** Sintaxis incorrecta o tablas no existen  
**Solución:** 
1. Verifica que las tablas `user_documents`, `document_shares`, `group_members` existen
2. Copia la política exactamente como está escrita
3. Si falla, elimina la política y créala de nuevo
4. Verifica que no haya espacios extra o saltos de línea

### Error: "function create_personal_document does not exist"
**Causa:** La migración SQL no se ejecutó completamente  
**Solución:**
1. Ve a SQL Editor
2. Ejecuta la query de verificación:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name LIKE '%document%';
   ```
3. Si no aparecen las 8 funciones, re-ejecuta la migración completa

### No puedo subir archivos al bucket
**Causa:** Falta la política INSERT en Storage  
**Solución:** Verifica que existe la política "Usuarios pueden subir a su carpeta"

---

## 📚 **DIFERENCIAS CON ENFOQUE ANTERIOR:**

### **ANTES (Fase 8 original):**
```
documents
  ├─ Documentos del grupo
  ├─ Todos los miembros ven
  └─ Caducidad automática
```

### **AHORA (Vault Personal):**
```
user_documents (Vault personal)
  ├─ Documentos del usuario
  ├─ Privado por defecto
  ├─ Usuario decide qué compartir
  └─ Control manual + auditoría
```

### **VENTAJAS:**
- ✅ No duplicas docs (subes 1 vez, compartes N veces)
- ✅ Control total (ocultas cuando quieras)
- ✅ Auditoría (sabes quién vio qué)
- ✅ Privacidad (por defecto privado)

---

## ⏭️ SIGUIENTE PASO:

Cuando completes la Fase 8, estarás listo para la **Fase 9: Servicio de Documentos (Frontend)** donde:
- Crearemos `documents.service.ts` para upload/download
- Hooks `useDocuments` y `useDocumentUpload`
- Manejo de progress en uploads
- Gestión de shares y auditoría

**¡Avísame cuando termines para continuar! 🚀**
