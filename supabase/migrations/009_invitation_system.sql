-- =====================================================
-- FASE 6: SISTEMA DE INVITACIONES
-- =====================================================
-- Esta migración crea la función RPC para unirse a grupos
-- usando tokens JWT de invitación
-- =====================================================

-- FUNCIÓN: join_group
-- Permite a un usuario unirse a un grupo con un token de invitación
-- El token JWT contiene: {aud: group_id, exp: timestamp}
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
BEGIN
  -- 1. Verificar que el usuario está autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado'
      USING HINT = 'Debes iniciar sesión para unirte a un grupo',
            ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  -- 2. Verificar que el grupo existe
  SELECT * INTO v_group_record
  FROM groups
  WHERE id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Grupo no encontrado'
      USING HINT = 'El grupo no existe o fue eliminado',
            ERRCODE = '42704'; -- undefined_object
  END IF;

  -- 3. Verificar si el usuario ya es miembro
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = v_user_id
  ) INTO v_is_member;

  IF v_is_member THEN
    RAISE EXCEPTION 'Ya eres miembro de este grupo'
      USING HINT = 'No puedes unirte dos veces al mismo grupo',
            ERRCODE = '23505'; -- unique_violation (409 Conflict)
  END IF;

  -- 4. DECODIFICAR Y VALIDAR EL TOKEN JWT
  -- IMPORTANTE: Esta es una validación básica
  -- En producción, deberías usar una extensión como pg_jwt
  -- Por ahora, asumimos que el token viene pre-validado desde la Edge Function
  
  -- Extraer el payload del JWT (formato: header.payload.signature)
  -- Por simplicidad, confiamos en que la Edge Function ya validó la firma
  BEGIN
    -- Decodificar el payload Base64URL del JWT
    -- Formato JWT: xxxxx.yyyyy.zzzzz (header.payload.signature)
    v_token_payload := convert_from(
      decode(
        -- Extraer la parte del payload (segunda parte del JWT)
        split_part(p_invite_token, '.', 2),
        'base64'
      ),
      'utf8'
    )::json;

    -- Extraer datos del payload
    v_token_group_id := v_token_payload->>'aud';
    v_token_exp := (v_token_payload->>'exp')::bigint;

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Token de invitación inválido'
      USING HINT = 'El token no tiene el formato correcto',
            ERRCODE = '22023'; -- invalid_parameter_value (403 Forbidden)
  END;

  -- 5. Verificar que el token es para este grupo
  IF v_token_group_id != p_group_id::text THEN
    RAISE EXCEPTION 'Token no válido para este grupo'
      USING HINT = 'Este token de invitación es para otro grupo',
            ERRCODE = '22023'; -- invalid_parameter_value (403 Forbidden)
  END IF;

  -- 6. Verificar que el token no ha expirado
  v_current_time := extract(epoch from now())::bigint;
  
  IF v_token_exp < v_current_time THEN
    RAISE EXCEPTION 'Token de invitación expirado'
      USING HINT = 'Solicita un nuevo link de invitación',
            ERRCODE = '22023'; -- invalid_parameter_value (403 Forbidden)
  END IF;

  -- 7. TODO CORRECTO: Añadir al usuario como miembro
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (p_group_id, v_user_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- 8. Retornar el grupo completo con sus miembros
  RETURN (
    SELECT json_build_object(
      'id', g.id,
      'owner_id', g.owner_id,
      'name', g.name,
      'type', g.type,
      'start_date', g.start_date,
      'end_date', g.end_date,
      'destination', g.destination,
      'notes', g.notes,
      'created_at', g.created_at,
      'owner', json_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name
      ),
      'members', (
        SELECT json_agg(
          json_build_object(
            'user_id', gm.user_id,
            'role', gm.role,
            'joined_at', gm.joined_at,
            'profile', json_build_object(
              'email', prof.email,
              'full_name', prof.full_name
            )
          )
        )
        FROM group_members gm
        JOIN profiles prof ON gm.user_id = prof.id
        WHERE gm.group_id = g.id
      )
    )
    FROM groups g
    JOIN profiles p ON g.owner_id = p.id
    WHERE g.id = p_group_id
  );

END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION join_group TO authenticated;

-- =====================================================
-- COMENTARIOS EXPLICATIVOS:
-- =====================================================
-- 1. SECURITY DEFINER: La función se ejecuta con los
--    permisos del owner (bypass RLS temporalmente)
--    Esto permite insertar en group_members sin problemas
--
-- 2. VALIDACIÓN JWT: Por simplicidad, decodificamos solo
--    el payload. En producción real, usar extensión pg_jwt
--    para verificar la firma criptográfica
--
-- 3. ERRCODE: Usamos códigos SQL específicos que luego
--    mapearemos a HTTP status codes en el cliente:
--    - 42501 = 401 Unauthorized
--    - 42704 = 404 Not Found  
--    - 23505 = 409 Conflict
--    - 22023 = 403 Forbidden
--
-- 4. ON CONFLICT DO NOTHING: Evita errores si por alguna
--    razón se intenta insertar dos veces (idempotencia)
-- =====================================================

