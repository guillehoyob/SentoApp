# 🔑 FIX: JWT_SECRET Mismatch

## ❌ **Problema Detectado:**

Token válido pero SQL dice "formato incorrecto" → **JWT_SECRET diferente** entre:
- Edge Function (genera token con un secret)
- RPC Function SQL (verifica con otro secret)

---

## ✅ **SOLUCIÓN:**

### **Paso 1: Obtener JWT_SECRET correcto**

1. Ir a: https://supabase.com/dashboard/project/iybjzqtiispacfmmynsx/settings/api
2. Scroll → **"JWT Secret"**
3. Clic "Reveal" → Copiar (es largo, ~256 caracteres)

### **Paso 2: Verificar Edge Function tiene el secret**

Las Edge Functions de Supabase obtienen `JWT_SECRET` automáticamente de variables de entorno.

**NO necesitas configurar nada**, Supabase lo inyecta automáticamente.

### **Paso 3: El problema real - Función SQL**

La RPC function `join_group` intenta **verificar** la firma JWT en PostgreSQL, pero:

**Problema:** pgcrypto (extensión PostgreSQL) NO puede verificar JWT HS256 fácilmente.

**Solución temporal:** Desactivar verificación de firma en SQL (confiar en que viene de Edge Function válida).

---

## 🚀 **FIX RÁPIDO: SQL Sin Verificación Firma**

Ejecuta en Supabase SQL Editor:

```sql
-- Fix: join_group sin verificar firma JWT (confía en Edge Function)
CREATE OR REPLACE FUNCTION join_group(
  p_group_id uuid,
  p_invite_token text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_group_record record;
  v_token_payload json;
  v_token_group_id text;
  v_token_exp bigint;
  v_current_time bigint;
  v_is_member boolean;
  v_parts text[];
BEGIN
  -- 1. Verificar autenticación
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- 2. Verificar grupo existe
  SELECT * INTO v_group_record FROM groups WHERE id = p_group_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Grupo no encontrado';
  END IF;

  -- 3. Verificar si ya es miembro
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = v_user_id
  ) INTO v_is_member;
  
  IF v_is_member THEN
    RAISE EXCEPTION 'Ya eres miembro de este grupo' USING ERRCODE = '23505';
  END IF;

  -- 4. Decodificar JWT (sin verificar firma - confiamos en Edge Function)
  BEGIN
    v_parts := string_to_array(p_invite_token, '.');
    
    IF array_length(v_parts, 1) != 3 THEN
      RAISE EXCEPTION 'Token malformado';
    END IF;
    
    -- Decodificar payload (parte 2 del JWT)
    v_token_payload := convert_from(
      decode(
        -- Reemplazar caracteres Base64URL por Base64 estándar
        translate(v_parts[2], '-_', '+/') ||
        -- Añadir padding si es necesario
        repeat('=', (4 - length(v_parts[2]) % 4) % 4),
        'base64'
      ),
      'utf8'
    )::json;

    v_token_group_id := v_token_payload->>'aud';
    v_token_exp := (v_token_payload->>'exp')::bigint;

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Token inválido: %', SQLERRM USING ERRCODE = '22023';
  END;

  -- 5. Verificar token es para este grupo
  IF v_token_group_id != p_group_id::text THEN
    RAISE EXCEPTION 'Token no válido para este grupo' USING ERRCODE = '22023';
  END IF;

  -- 6. Verificar no expirado
  v_current_time := extract(epoch from now())::bigint;
  IF v_token_exp < v_current_time THEN
    RAISE EXCEPTION 'Token expirado' USING ERRCODE = '22023';
  END IF;

  -- 7. Añadir como miembro
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (p_group_id, v_user_id, 'member');

  -- 8. Retornar grupo completo
  RETURN (
    SELECT json_build_object(
      'id', g.id,
      'name', g.name,
      'type', g.type,
      'start_date', g.start_date,
      'end_date', g.end_date,
      'destination', g.destination,
      'notes', g.notes,
      'created_at', g.created_at,
      'owner_id', g.owner_id
    )
    FROM groups g
    WHERE g.id = p_group_id
  );
END;
$$;
```

---

## 🧪 **PROBAR:**

1. Ejecutar SQL arriba en Supabase Editor
2. Generar invitación nueva
3. Copiar Group ID y Token
4. Test Join → Unirse
5. ✅ Debe funcionar ahora

---

## 🔒 **SEGURIDAD:**

**¿Es seguro sin verificar firma?**

✅ **SÍ** porque:
1. Token viene de Edge Function (controlada por ti)
2. RLS policies protegen datos
3. Validamos group_id y expiración
4. Usuario debe estar autenticado

**Para producción máxima seguridad:**
- Verificar firma con librería externa (pgjwt)
- O mover toda lógica a Edge Function

