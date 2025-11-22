-- FIX: Función get_my_document_access_logs
CREATE OR REPLACE FUNCTION get_my_document_access_logs(p_limit integer DEFAULT 50)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT 
        dal.id,
        ud.title as document_title,
        ud.type as document_type,
        p.full_name as accessed_by_name,
        dal.accessed_at,
        g.name as group_name,
        dal.success
      FROM document_access_logs dal
      JOIN user_documents ud ON dal.document_id = ud.id
      LEFT JOIN profiles p ON dal.accessed_by = p.id
      LEFT JOIN groups g ON dal.group_id = g.id
      WHERE ud.owner_id = auth.uid()
      ORDER BY dal.accessed_at DESC
      LIMIT p_limit
    ) t
  );
END;$$;

GRANT EXECUTE ON FUNCTION get_my_document_access_logs TO authenticated;

-- FIX: Función para editar permisos (compartir)
CREATE OR REPLACE FUNCTION update_document_share(
  p_share_id uuid,
  p_permission_type text DEFAULT NULL,
  p_expires_at timestamp with time zone DEFAULT NULL,
  p_starts_at timestamp with time zone DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_share record;
BEGIN
  -- Verificar que el usuario es el owner del documento
  SELECT ds.*, ud.owner_id INTO v_share
  FROM document_shares ds
  JOIN user_documents ud ON ds.document_id = ud.id
  WHERE ds.id = p_share_id;

  IF v_share.owner_id != auth.uid() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Actualizar
  UPDATE document_shares
  SET 
    permission_type = COALESCE(p_permission_type, permission_type),
    expires_at = CASE 
      WHEN p_expires_at IS NOT NULL THEN p_expires_at
      WHEN p_permission_type = 'manual' THEN NULL
      ELSE expires_at
    END,
    starts_at = COALESCE(p_starts_at, starts_at),
    updated_at = now()
  WHERE id = p_share_id;

  RETURN json_build_object('success', true);
END;$$;

GRANT EXECUTE ON FUNCTION update_document_share TO authenticated;

-- FIX: Función para eliminar share (revocar permiso)
CREATE OR REPLACE FUNCTION delete_document_share(p_share_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Verificar que el usuario es el owner
  SELECT ud.owner_id INTO v_owner_id
  FROM document_shares ds
  JOIN user_documents ud ON ds.document_id = ud.id
  WHERE ds.id = p_share_id;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  DELETE FROM document_shares WHERE id = p_share_id;

  RETURN json_build_object('success', true);
END;$$;

GRANT EXECUTE ON FUNCTION delete_document_share TO authenticated;

-- Nueva función: Solicitar múltiples documentos a múltiples usuarios desde grupo
CREATE OR REPLACE FUNCTION request_documents_from_group(
  p_group_id uuid,
  p_doc_types text[], -- ['passport', 'id_card']
  p_user_ids uuid[] DEFAULT NULL, -- NULL = todos los miembros
  p_message text DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_target_users uuid[];
  v_user uuid;
  v_doc_type text;
  v_request_id uuid;
  v_count int := 0;
BEGIN
  -- Verificar rol (owner/admin)
  SELECT role INTO v_role FROM group_members
  WHERE group_id = p_group_id AND user_id = v_user_id;

  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Solo owners/admins pueden solicitar documentos';
  END IF;

  -- Determinar usuarios target
  IF p_user_ids IS NULL THEN
    SELECT array_agg(user_id) INTO v_target_users
    FROM group_members
    WHERE group_id = p_group_id AND user_id != v_user_id;
  ELSE
    v_target_users := p_user_ids;
  END IF;

  -- Crear solicitudes individuales para cada combinación user+doctype
  FOREACH v_user IN ARRAY v_target_users LOOP
    FOREACH v_doc_type IN ARRAY p_doc_types LOOP
      -- Buscar documento del usuario
      SELECT id INTO v_request_id
      FROM user_documents
      WHERE owner_id = v_user AND type = v_doc_type
      LIMIT 1;

      IF v_request_id IS NOT NULL THEN
        INSERT INTO document_access_requests (
          document_id, requester_id, group_id, message, status
        ) VALUES (
          v_request_id, v_user_id, p_group_id, p_message, 'pending'
        );
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN json_build_object('success', true, 'requests_created', v_count);
END;$$;

GRANT EXECUTE ON FUNCTION request_documents_from_group TO authenticated;

