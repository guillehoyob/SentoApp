-- =====================================================
-- FIX: Corregir funciones get_my_documents y get_my_pending_requests
-- Problema: Uso incorrecto de json_agg causando error GROUP BY
-- =====================================================

-- Corregir get_my_documents
CREATE OR REPLACE FUNCTION get_my_documents()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(doc_data), '[]'::json)
    FROM (
      SELECT json_build_object(
        'id', ud.id,
        'owner_id', ud.owner_id,
        'type', ud.type,
        'title', ud.title,
        'storage_path', ud.storage_path,
        'encrypted', ud.encrypted,
        'mime_type', ud.mime_type,
        'size_bytes', ud.size_bytes,
        'created_at', ud.created_at,
        'shared_in', (
          SELECT COALESCE(json_agg(share_data), '[]'::json)
          FROM (
            SELECT json_build_object(
              'group_id', ds.group_id,
              'group_name', g.name,
              'is_visible', ds.is_visible,
              'share_type', ds.share_type,
              'expires_at', ds.expires_at,
              'shared_at', ds.shared_at
            ) as share_data
            FROM document_shares ds
            JOIN groups g ON g.id = ds.group_id
            WHERE ds.document_id = ud.id
          ) shares
        )
      ) as doc_data
      FROM user_documents ud
      WHERE ud.owner_id = v_user_id
      ORDER BY ud.created_at DESC
    ) documents
  );
END;
$$;

COMMENT ON FUNCTION get_my_documents() IS 'Obtiene todos los documentos del usuario autenticado con su información de shares';

-- Corregir get_my_pending_requests
CREATE OR REPLACE FUNCTION get_my_pending_requests()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(request_data), '[]'::json)
    FROM (
      SELECT json_build_object(
        'id', dar.id,
        'document', (
          SELECT json_build_object(
            'id', ud.id,
            'title', ud.title,
            'type', ud.type
          )
          FROM user_documents ud
          WHERE ud.id = dar.document_id
        ),
        'requester', (
          SELECT json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email
          )
          FROM profiles p
          WHERE p.id = dar.requested_by
        ),
        'group', (
          SELECT json_build_object(
            'id', g.id,
            'name', g.name
          )
          FROM groups g
          WHERE g.id = dar.group_id
        ),
        'requested_duration', dar.requested_duration,
        'note', dar.note,
        'created_at', dar.created_at
      ) as request_data
      FROM document_access_requests dar
      WHERE dar.document_id IN (
        SELECT id FROM user_documents WHERE owner_id = v_user_id
      )
      AND dar.status = 'pending'
      ORDER BY dar.created_at DESC
    ) requests
  );
END;
$$;

COMMENT ON FUNCTION get_my_pending_requests() IS 'Obtiene todas las solicitudes de acceso pendientes para los documentos del usuario autenticado';

