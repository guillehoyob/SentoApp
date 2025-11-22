-- =====================================================
-- FIX: Permitir a miembros ver detalles del grupo
-- =====================================================

CREATE OR REPLACE FUNCTION get_group_by_id_for_member(p_group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_member boolean;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar si el usuario es owner o miembro
  SELECT EXISTS(
    SELECT 1 FROM groups WHERE id = p_group_id AND owner_id = v_user_id
  ) OR EXISTS(
    SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'No tienes acceso a este grupo';
  END IF;

  -- Obtener grupo completo
  SELECT json_build_object(
    'id', g.id,
    'name', g.name,
    'type', g.type,
    'start_date', g.start_date,
    'end_date', g.end_date,
    'destination', g.destination,
    'notes', g.notes,
    'created_at', g.created_at,
    'owner_id', g.owner_id,
    'is_owner', g.owner_id = v_user_id,
    'owner', json_build_object(
      'id', p.id,
      'email', p.email,
      'full_name', p.full_name
    ),
    'members', (
      SELECT json_agg(
        json_build_object(
          'group_id', gm.group_id,
          'user_id', gm.user_id,
          'role', gm.role,
          'joined_at', gm.joined_at,
          'user', json_build_object(
            'id', pm.id,
            'email', pm.email,
            'full_name', pm.full_name
          )
        )
      )
      FROM group_members gm
      JOIN profiles pm ON pm.id = gm.user_id
      WHERE gm.group_id = g.id
    )
  )
  INTO v_result
  FROM groups g
  JOIN profiles p ON p.id = g.owner_id
  WHERE g.id = p_group_id;

  RETURN v_result;
END;
$$;

