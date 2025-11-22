-- EJECUTAR EN SUPABASE SQL EDITOR
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
  v_payload_b64 text;
  v_padding text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT * INTO v_group_record FROM groups WHERE id = p_group_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Grupo no encontrado';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id
  ) INTO v_is_member;
  IF v_is_member THEN
    RAISE EXCEPTION 'Ya eres miembro de este grupo' USING ERRCODE = '23505';
  END IF;

  -- Decodificar JWT
  BEGIN
    v_parts := regexp_split_to_array(p_invite_token, '\.');
    IF array_length(v_parts, 1) != 3 THEN
      RAISE EXCEPTION 'Token debe tener 3 partes';
    END IF;
    
    v_payload_b64 := v_parts[2];
    v_payload_b64 := replace(replace(v_payload_b64, '-', '+'), '_', '/');
    
    -- Añadir padding correcto
    CASE length(v_payload_b64) % 4
      WHEN 2 THEN v_payload_b64 := v_payload_b64 || '==';
      WHEN 3 THEN v_payload_b64 := v_payload_b64 || '=';
      ELSE NULL;
    END CASE;
    
    v_token_payload := convert_from(decode(v_payload_b64, 'base64'), 'utf8')::json;
    v_token_group_id := v_token_payload->>'aud';
    v_token_exp := (v_token_payload->>'exp')::bigint;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error decodificando: %', SQLERRM USING ERRCODE = '22023';
  END;

  IF v_token_group_id != p_group_id::text THEN
    RAISE EXCEPTION 'Token no válido' USING ERRCODE = '22023';
  END IF;

  v_current_time := extract(epoch from now())::bigint;
  IF v_token_exp < v_current_time THEN
    RAISE EXCEPTION 'Token expirado' USING ERRCODE = '22023';
  END IF;

  INSERT INTO group_members (group_id, user_id, role) VALUES (p_group_id, v_user_id, 'member');

  RETURN (
    SELECT json_build_object(
      'id', g.id, 'name', g.name, 'type', g.type,
      'start_date', g.start_date, 'end_date', g.end_date,
      'destination', g.destination, 'notes', g.notes,
      'created_at', g.created_at, 'owner_id', g.owner_id
    )
    FROM groups g WHERE g.id = p_group_id
  );
END;
$$;

