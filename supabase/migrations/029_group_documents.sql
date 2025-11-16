-- =====================================================
-- DOCUMENTOS DE GRUPO
-- Documentos creados dentro del grupo (no personales)
-- =====================================================

-- 1. Tabla principal de documentos de grupo
CREATE TABLE IF NOT EXISTS group_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'itinerary',      -- Itinerario
    'booking',        -- Reserva
    'ticket',         -- Boleto/Entrada
    'insurance',      -- Seguro grupal
    'contract',       -- Contrato
    'invoice',        -- Factura
    'receipt',        -- Recibo
    'map',            -- Mapa
    'guide',          -- Guía
    'emergency',      -- Emergencia/Contactos
    'other'           -- Otro
  )),
  
  description text,
  tagged_users jsonb DEFAULT '[]'::jsonb, -- Array de user_ids: ["uuid1", "uuid2"]
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Archivos asociados a documentos de grupo
CREATE TABLE IF NOT EXISTS group_document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_document_id uuid NOT NULL REFERENCES group_documents(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_group_docs_group ON group_documents(group_id);
CREATE INDEX IF NOT EXISTS idx_group_docs_uploader ON group_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_group_doc_files_doc ON group_document_files(group_document_id);

-- 4. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_group_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_documents_timestamp
BEFORE UPDATE ON group_documents
FOR EACH ROW
EXECUTE FUNCTION update_group_document_timestamp();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE group_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_document_files ENABLE ROW LEVEL SECURITY;

-- Solo miembros del grupo pueden ver documentos de grupo
CREATE POLICY group_documents_select ON group_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_documents.group_id
    AND (
      g.owner_id = auth.uid()
      OR EXISTS(
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = g.id AND gm.user_id = auth.uid()
      )
    )
  )
);

-- Solo miembros pueden crear documentos
CREATE POLICY group_documents_insert ON group_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_documents.group_id
    AND (
      g.owner_id = auth.uid()
      OR EXISTS(
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = g.id AND gm.user_id = auth.uid()
      )
    )
  )
);

-- Solo el que subió o el owner pueden actualizar
CREATE POLICY group_documents_update ON group_documents
FOR UPDATE
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_documents.group_id AND g.owner_id = auth.uid()
  )
);

-- Solo el que subió o el owner pueden eliminar
CREATE POLICY group_documents_delete ON group_documents
FOR DELETE
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_documents.group_id AND g.owner_id = auth.uid()
  )
);

-- Archivos: solo miembros del grupo pueden ver
CREATE POLICY group_document_files_select ON group_document_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_documents gd
    JOIN groups g ON g.id = gd.group_id
    WHERE gd.id = group_document_files.group_document_id
    AND (
      g.owner_id = auth.uid()
      OR EXISTS(
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = g.id AND gm.user_id = auth.uid()
      )
    )
  )
);

-- =====================================================
-- RPCs
-- =====================================================

-- Obtener documentos de un grupo
CREATE OR REPLACE FUNCTION get_group_documents(p_group_id uuid)
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

  -- Verificar que es miembro
  IF NOT EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = p_group_id
    AND (
      g.owner_id = v_user_id
      OR EXISTS(SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id)
    )
  ) THEN
    RAISE EXCEPTION 'No eres miembro de este grupo';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(doc_data ORDER BY gd.created_at DESC), '[]'::json)
    FROM (
      SELECT json_build_object(
        'id', gd.id,
        'group_id', gd.group_id,
        'title', gd.title,
        'type', gd.type,
        'description', gd.description,
        'tagged_users', gd.tagged_users,
        'created_at', gd.created_at,
        'updated_at', gd.updated_at,
        'uploader', json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'email', p.email
        ),
        'files', (
          SELECT COALESCE(json_agg(file_data ORDER BY (file_data->>'uploaded_at')), '[]'::json)
          FROM (
            SELECT json_build_object(
              'id', gdf.id,
              'storage_path', gdf.storage_path,
              'file_name', gdf.file_name,
              'mime_type', gdf.mime_type,
              'size_bytes', gdf.size_bytes,
              'uploaded_at', gdf.uploaded_at
            ) as file_data
            FROM group_document_files gdf
            WHERE gdf.group_document_id = gd.id
          ) files_subquery
        )
      ) as doc_data
      FROM group_documents gd
      JOIN profiles p ON p.id = gd.uploaded_by
      WHERE gd.group_id = p_group_id
    ) docs
  );
END;
$$;

-- Crear documento de grupo
CREATE OR REPLACE FUNCTION create_group_document(
  p_group_id uuid,
  p_title text,
  p_type text,
  p_description text,
  p_tagged_users jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_doc_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que es miembro
  IF NOT EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = p_group_id
    AND (
      g.owner_id = v_user_id
      OR EXISTS(SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_user_id)
    )
  ) THEN
    RAISE EXCEPTION 'No eres miembro de este grupo';
  END IF;

  INSERT INTO group_documents (group_id, uploaded_by, title, type, description, tagged_users)
  VALUES (p_group_id, v_user_id, p_title, p_type, p_description, p_tagged_users)
  RETURNING id INTO v_doc_id;

  RETURN v_doc_id;
END;
$$;

-- Añadir archivo a documento de grupo
CREATE OR REPLACE FUNCTION add_group_document_file(
  p_group_document_id uuid,
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
  INSERT INTO group_document_files (group_document_id, storage_path, file_name, mime_type, size_bytes)
  VALUES (p_group_document_id, p_storage_path, p_file_name, p_mime_type, p_size_bytes);
END;
$$;

-- Actualizar documento de grupo
CREATE OR REPLACE FUNCTION update_group_document(
  p_doc_id uuid,
  p_title text,
  p_description text,
  p_tagged_users jsonb
)
RETURNS void
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

  -- Verificar permisos
  IF NOT EXISTS (
    SELECT 1 FROM group_documents gd
    WHERE gd.id = p_doc_id
    AND (
      gd.uploaded_by = v_user_id
      OR EXISTS(SELECT 1 FROM groups WHERE id = gd.group_id AND owner_id = v_user_id)
    )
  ) THEN
    RAISE EXCEPTION 'No tienes permisos';
  END IF;

  UPDATE group_documents
  SET title = p_title,
      description = p_description,
      tagged_users = p_tagged_users
  WHERE id = p_doc_id;
END;
$$;

-- Eliminar documento de grupo
CREATE OR REPLACE FUNCTION delete_group_document(p_doc_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_storage_paths text[];
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar permisos
  IF NOT EXISTS (
    SELECT 1 FROM group_documents gd
    WHERE gd.id = p_doc_id
    AND (
      gd.uploaded_by = v_user_id
      OR EXISTS(SELECT 1 FROM groups WHERE id = gd.group_id AND owner_id = v_user_id)
    )
  ) THEN
    RAISE EXCEPTION 'No tienes permisos';
  END IF;

  -- Obtener paths de archivos
  SELECT array_agg(storage_path) INTO v_storage_paths
  FROM group_document_files
  WHERE group_document_id = p_doc_id;

  -- Eliminar archivos y documento
  DELETE FROM group_document_files WHERE group_document_id = p_doc_id;
  DELETE FROM group_documents WHERE id = p_doc_id;

  RETURN json_build_object(
    'success', true,
    'storage_paths', v_storage_paths
  );
END;
$$;

-- Eliminar archivo individual
CREATE OR REPLACE FUNCTION delete_group_document_file(p_file_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_storage_path text;
BEGIN
  SELECT storage_path INTO v_storage_path
  FROM group_document_files
  WHERE id = p_file_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archivo no encontrado';
  END IF;
  
  DELETE FROM group_document_files WHERE id = p_file_id;
  
  RETURN v_storage_path;
END;
$$;

COMMENT ON TABLE group_documents IS 'Documentos creados dentro del grupo (no documentos personales)';
COMMENT ON TABLE group_document_files IS 'Archivos asociados a documentos de grupo';

