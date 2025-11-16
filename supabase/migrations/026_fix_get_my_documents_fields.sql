-- =====================================================
-- FIX: Añadir fields y files a get_my_documents
-- =====================================================

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
        'fields', COALESCE(ud.fields, '{}'::jsonb),
        'files', (
          SELECT COALESCE(json_agg(file_data), '[]'::json)
          FROM (
            SELECT json_build_object(
              'id', df.id,
              'storage_path', df.storage_path,
              'file_name', df.file_name,
              'mime_type', df.mime_type,
              'size_bytes', df.size_bytes,
              'created_at', df.created_at
            ) as file_data
            FROM document_files df
            WHERE df.document_id = ud.id
            ORDER BY df.created_at ASC
          ) doc_files
        ),
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

COMMENT ON FUNCTION get_my_documents() IS 'Obtiene todos los documentos del usuario con fields, files y shares';

