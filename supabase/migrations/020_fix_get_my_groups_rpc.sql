-- =====================================================
-- FIX: RPC para obtener TODOS los grupos del usuario
-- (owned + member) sin problemas de RLS
-- =====================================================

CREATE OR REPLACE FUNCTION get_my_groups_complete()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener TODOS los grupos donde el usuario es owner O miembro
  SELECT json_agg(
    json_build_object(
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
      'my_role', COALESCE(gm.role, 'owner')
    )
  )
  INTO v_result
  FROM groups g
  LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = v_user_id
  WHERE g.owner_id = v_user_id
     OR EXISTS(
       SELECT 1 FROM group_members
       WHERE group_id = g.id AND user_id = v_user_id
     )
  ORDER BY g.created_at DESC;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

