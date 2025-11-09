# ⚡ GUÍA RÁPIDA - FASE 8A++ (Sistema Completo)

**Tiempo total:** 30-40 minutos

**Para la guía completa con explicaciones:** `INSTRUCCIONES_FASE_8_COMPLETO.md`

---

## ✅ PRE-REQUISITOS:

Antes de empezar, verifica:
- [ ] Tienes acceso a: https://supabase.com/dashboard
- [ ] Project ID: `iybjzqtiispacfmmynsx`
- [ ] Migraciones anteriores ejecutadas (001-010)

---

## 📋 PASO 1: ACTUALIZAR TABLA `group_members` ⏱️ 2 min

### **¿Qué hace?**
Añade la columna `role` para diferenciar Owner/Admin/Member

### **Acción:**

1. Ve a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/sql/new

2. Ejecuta esta query:

```sql
-- Añadir columna role a group_members
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'member' 
CHECK (role IN ('owner', 'admin', 'member'));

-- Actualizar roles existentes
-- El creador del grupo es owner
UPDATE group_members gm
SET role = 'owner'
WHERE gm.user_id IN (
  SELECT g.owner_id 
  FROM groups g 
  WHERE g.id = gm.group_id
);
```

3. Haz clic en **"Run"**

### **✅ VALIDACIÓN:**

Ejecuta:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'group_members' AND column_name = 'role';
```

**Debes ver:**
```
column_name | data_type
------------+-----------
role        | text
```

**Reporta:** "✅ PASO 1 completado: Columna role añadida"

---

## 📋 PASO 2: EJECUTAR MIGRACIÓN COMPLETA ⏱️ 5 min

### **¿Qué hace?**
Crea 8 tablas + 20+ RPC functions para todo el sistema

### **Acción:**

1. Abre el archivo: `supabase/migrations/011_vault_inteligente_completo.sql`

2. Copia **TODO** el contenido (Ctrl+A, Ctrl+C)

3. Ve a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/sql/new

4. Pega el contenido (Ctrl+V)

5. Haz clic en **"Run"**

6. **Espera 10-15 segundos** (es una migración grande)

### **✅ VALIDACIÓN 1: Tablas creadas**

Ejecuta:
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%document%'
ORDER BY tablename;
```

**Debes ver 8 tablas:**
```
bulk_access_requests
document_access_logs
document_access_requests
document_individual_shares
document_rate_limits
document_shares
group_document_requirements
user_documents
```

### **✅ VALIDACIÓN 2: RPC Functions creadas**

Ejecuta:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name LIKE '%document%'
ORDER BY routine_name;
```

**Debes ver 20+ funciones** (incluyen):
- `approve_access_request`
- `check_rate_limit`
- `create_personal_document`
- `get_bulk_request_status`
- `get_group_requirements`
- `get_missing_documents_summary`
- `promote_to_admin`
- ... (y más)

**Reporta:** "✅ PASO 2 completado: X tablas y Y funciones creadas"

---

## 📋 PASO 3: CREAR BUCKET EN STORAGE ⏱️ 3 min

### **¿Qué hace?**
Crea el almacenamiento para los archivos PDF/imágenes

### **Acción:**

1. Ve a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/storage/buckets

2. Haz clic en **"New bucket"** (botón verde)

3. Configuración:
   - **Name:** `documents` (sin mayúsculas)
   - **Public bucket:** ❌ **OFF** (debe estar privado)
   - **File size limit:** `10 MB`
   - **Allowed MIME types:** (dejar vacío)

4. Haz clic en **"Create bucket"**

### **✅ VALIDACIÓN:**

**Debes ver en la lista:**
- Bucket `documents` con icono de candado 🔒 (privado)
- 0 objects, 0 B

**Reporta:** "✅ PASO 3 completado: Bucket documents creado (privado)"

---

## 📋 PASO 4: CONFIGURAR RLS EN STORAGE ⏱️ 10 min

### **¿Qué hace?**
Configura seguridad: quién puede subir/ver/eliminar archivos

### **Acción:**

1. En la lista de buckets, haz clic en **`documents`**

2. Ve a la pestaña **"Policies"**

3. Haz clic en **"New policy"**

4. Selecciona **"For full customization"**

---

### **POLÍTICA 1: INSERT (Subir archivos)**

**Name:** `Usuarios suben a su carpeta`

**Allowed operation:** `INSERT`

**Policy definition:**
```sql
(
  auth.uid()::text = (storage.foldername(name))[2]
)
```

**Haz clic en "Save policy"**

---

### **POLÍTICA 2: SELECT (Descargar archivos)**

**Name:** `Ver docs propios o compartidos`

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
      AND (
        ds.is_visible = true
        OR
        gm.role IN ('owner', 'admin')
      )
      AND (ds.expires_at IS NULL OR ds.expires_at > now())
  )
  OR
  EXISTS (
    SELECT 1
    FROM document_individual_shares dis
    JOIN user_documents ud ON ud.id = dis.document_id
    WHERE ud.storage_path = name
      AND dis.shared_with = auth.uid()
      AND (dis.expires_at IS NULL OR dis.expires_at > now())
  )
)
```

**Haz clic en "Save policy"**

---

### **POLÍTICA 3: DELETE (Eliminar archivos)**

**Name:** `Solo dueños eliminan`

**Allowed operation:** `DELETE`

**Policy definition:**
```sql
(
  auth.uid()::text = (storage.foldername(name))[2]
)
```

**Haz clic en "Save policy"**

---

### **✅ VALIDACIÓN:**

En la pestaña "Policies" debes ver:

```
✓ Usuarios suben a su carpeta (INSERT)
✓ Ver docs propios o compartidos (SELECT)
✓ Solo dueños eliminan (DELETE)
```

**Reporta:** "✅ PASO 4 completado: 3 políticas RLS configuradas"

---

## 📋 PASO 5: TESTING BÁSICO ⏱️ 10 min

### **¿Qué hace?**
Verifica que todo funciona correctamente

### **TEST 1: Verificar roles**

Ejecuta:
```sql
SELECT 
  g.name as group_name,
  p.email as user_email,
  gm.role
FROM group_members gm
JOIN groups g ON g.id = gm.group_id
JOIN profiles p ON p.id = gm.user_id
ORDER BY g.name, gm.role;
```

**Debes ver:**
- Tus grupos existentes
- Tu email con role 'owner' en grupos que creaste

---

### **TEST 2: Verificar pre-requisitos (vacío por ahora)**

Ejecuta:
```sql
SELECT * FROM group_document_requirements LIMIT 10;
```

**Debes ver:**
- 0 rows (tabla vacía, es correcto)

---

### **TEST 3: Probar crear requisito**

```sql
-- Reemplaza 'YOUR_GROUP_ID' con un ID real de tus grupos
SELECT set_group_requirements(
  'YOUR_GROUP_ID'::uuid,
  '[
    {"type": "passport", "required": true, "visibility": "admins_only"},
    {"type": "insurance", "required": true, "visibility": "admins_only"}
  ]'::jsonb
);
```

**Debe retornar:** (sin error)

Verifica que se creó:
```sql
SELECT * FROM group_document_requirements 
WHERE group_id = 'YOUR_GROUP_ID';
```

**Debes ver:**
- 2 filas (passport, insurance)

---

### **TEST 4: Verificar rate limiting**

Ejecuta:
```sql
SELECT * FROM document_rate_limits LIMIT 10;
```

**Debes ver:**
- 0 rows (tabla vacía, es correcto)

---

### **TEST 5: Verificar auditoría**

Ejecuta:
```sql
SELECT * FROM document_access_logs LIMIT 10;
```

**Debes ver:**
- 0 rows (tabla vacía, es correcto)

---

### **✅ VALIDACIÓN FINAL:**

Ejecuta este query de verificación completa:
```sql
SELECT 
  'Tablas' as tipo, 
  COUNT(*) as cuenta
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%document%'

UNION ALL

SELECT 
  'RPC Functions' as tipo, 
  COUNT(*) as cuenta
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name LIKE '%document%'

UNION ALL

SELECT 
  'Storage Policies' as tipo,
  COUNT(*) as cuenta
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%document%'
  OR policyname LIKE '%Usuarios%'
  OR policyname LIKE '%dueños%';
```

**Debes ver:**
```
tipo             | cuenta
-----------------+--------
Tablas           | 8
RPC Functions    | 20+
Storage Policies | 3
```

**Reporta:** "✅ PASO 5 completado: Todos los tests pasaron"

---

## 🎉 ¡BACKEND COMPLETO!

**Has creado:**
- ✅ 8 tablas SQL
- ✅ 20+ RPC functions
- ✅ Sistema de roles (Owner/Admin/Member)
- ✅ Pre-requisitos de grupo
- ✅ Solicitudes masivas
- ✅ Permisos flexibles (5 tipos)
- ✅ Rate limiting + auditoría
- ✅ Storage con RLS robusto

**Tiempo total:** ~30-40 minutos

---

## 🚀 PRÓXIMOS PASOS:

### **Ahora:**
1. Reporta: "✅ Backend completo, todas las validaciones pasaron"
2. Commit y push de los cambios

### **Después (Fase 9-10):**
- Frontend del Vault (10-11 días)
- UI de roles y pre-requisitos
- Sistema de solicitudes
- Dashboard de documentos

---

## 🆘 SI HAY ERRORES:

### **Error en PASO 1:**
- Verifica que la migración 004 (groups) se ejecutó correctamente
- Query: `SELECT * FROM groups LIMIT 1;`

### **Error en PASO 2:**
- NO ejecutes parcialmente
- Si falla, copia el mensaje de error completo
- Reporta: "❌ Error en PASO 2: [mensaje]"

### **Error en PASO 3:**
- Verifica que no existe ya un bucket "documents"
- Si existe, úsalo (no crear duplicado)

### **Error en PASO 4:**
- Copia la SQL exactamente como está
- NO modifiques espacios o saltos de línea
- Si falla, reporta qué política falló

---

## 📚 DOCUMENTOS DE REFERENCIA:

- `INSTRUCCIONES_FASE_8_COMPLETO.md` - Explicaciones detalladas
- `RESUMEN_EJECUTIVO_8A_PLUS_PLUS.md` - Overview completo
- `DECISION_FINAL_8A_PLUS_PLUS.md` - Por qué estas decisiones

---

**✅ Reporta tu progreso en cada paso**

**🚀 ¡Empecemos!**

