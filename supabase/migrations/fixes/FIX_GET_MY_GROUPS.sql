-- EJECUTAR INMEDIATAMENTE
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

  -- Obtener grupos owned + member (sin GROUP BY)
  SELECT json_agg(result_row)
  INTO v_result
  FROM (
    SELECT DISTINCT ON (g.id)
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
        'is_owner', (g.owner_id = v_user_id),
        'my_role', CASE 
          WHEN g.owner_id = v_user_id THEN 'owner'
          ELSE COALESCE((SELECT role FROM group_members WHERE group_id = g.id AND user_id = v_user_id LIMIT 1), 'member')
        END
      ) as result_row
    FROM groups g
    WHERE g.owner_id = v_user_id
       OR EXISTS(
         SELECT 1 FROM group_members gm
         WHERE gm.group_id = g.id AND gm.user_id = v_user_id
       )
    ORDER BY g.id, g.created_at DESC
  ) subquery;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

