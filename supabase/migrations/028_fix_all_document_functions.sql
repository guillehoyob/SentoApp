-- =====================================================
-- FIX COMPLETO: Todas las funciones de documentos
-- =====================================================

-- 1. Asegurar que document_files existe
CREATE TABLE IF NOT EXISTS document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_files_doc ON document_files(document_id);

-- 2. RPCs para document_files
-- Drop existing functions if they have different signatures
DROP FUNCTION IF EXISTS add_document_file(uuid,text,text,text,integer);
DROP FUNCTION IF EXISTS delete_document_file(uuid);
DROP FUNCTION IF EXISTS update_document_file_name(uuid,text);

CREATE OR REPLACE FUNCTION add_document_file(
  p_document_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_size_bytes integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO document_files (document_id, storage_path, file_name, mime_type, size_bytes)
  VALUES (p_document_id, p_storage_path, p_file_name, p_mime_type, p_size_bytes);
END;
$$;

CREATE OR REPLACE FUNCTION delete_document_file(p_file_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_storage_path text;
BEGIN
  SELECT storage_path INTO v_storage_path
  FROM document_files
  WHERE id = p_file_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archivo no encontrado';
  END IF;
  
  DELETE FROM document_files WHERE id = p_file_id;
  
  RETURN v_storage_path;
END;
$$;

CREATE OR REPLACE FUNCTION update_document_file_name(
  p_file_id uuid,
  p_new_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE document_files
  SET file_name = p_new_name
  WHERE id = p_file_id;
END;
$$;

-- 3. ACTUALIZAR get_my_documents con fields y files
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

-- 4. ACTUALIZAR get_group_shared_documents con fields y files
CREATE OR REPLACE FUNCTION get_group_shared_documents(p_group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener rol del usuario
  SELECT role INTO v_user_role
  FROM group_members
  WHERE group_id = p_group_id AND user_id = v_user_id;

  RETURN (
    SELECT COALESCE(json_agg(doc_info ORDER BY doc_info->>'shared_at' DESC), '[]'::json)
    FROM (
      SELECT json_build_object(
        'id', ud.id,
        'type', ud.type,
        'title', ud.title,
        'mime_type', ud.mime_type,
        'size_bytes', ud.size_bytes,
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
        'owner_name', p.full_name,
        'share_type', ds.share_type,
        'is_visible', ds.is_visible,
        'expires_at', ds.expires_at,
        'shared_at', ds.shared_at,
        'can_access', (
          v_user_role IN ('owner', 'admin')
          OR
          (ds.is_visible AND (ds.expires_at IS NULL OR ds.expires_at > now()))
        )
      ) as doc_info
      FROM document_shares ds
      JOIN user_documents ud ON ud.id = ds.document_id
      JOIN profiles p ON p.id = ud.owner_id
      WHERE ds.group_id = p_group_id
        AND (
          v_user_role IN ('owner', 'admin')
          OR
          (ds.is_visible AND (ds.expires_at IS NULL OR ds.expires_at > now()))
        )
    ) subquery
  );
END;
$$;

COMMENT ON FUNCTION get_my_documents() IS 'Obtiene mis documentos con fields, files y shares';
COMMENT ON FUNCTION get_group_shared_documents IS 'Obtiene documentos de grupo con fields y files';

