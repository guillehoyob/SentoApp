-- =====================================================
-- FASE 8: ESQUEMA DE DOCUMENTOS
-- =====================================================
-- Esta migración crea:
-- 1. Tablas para documentos y versiones
-- 2. RLS policies con lógica de caducidad
-- 3. Índices para búsquedas rápidas
-- 4. RPC functions para CRUD de documentos
-- =====================================================

-- =====================================================
-- TABLA: documents
-- =====================================================
-- Almacena metadata de documentos subidos a grupos
-- Cada documento puede tener múltiples versiones
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('sensitive', 'other')),
  title text NOT NULL,
  encrypted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: document_versions
-- =====================================================
-- Almacena las versiones de cada documento
-- Permite historial de cambios y actualizaciones
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  ocr_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Búsqueda rápida de documentos por grupo
CREATE INDEX IF NOT EXISTS documents_group_id_idx 
ON documents(group_id);

-- Búsqueda rápida de última versión de documento
CREATE INDEX IF NOT EXISTS document_versions_document_id_created_at_idx 
ON document_versions(document_id, created_at DESC);

-- Búsqueda rápida por tipo de documento
CREATE INDEX IF NOT EXISTS documents_type_idx 
ON documents(type);

-- =====================================================
-- RLS: HABILITAR
-- =====================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICY: documents - SELECT
-- =====================================================
-- Los usuarios pueden ver documentos si:
-- 1. Son miembros del grupo
-- 2. SI es documento sensible Y el viaje caducó:
--    - Solo si son el owner del grupo
CREATE POLICY "Ver documentos del grupo"
ON documents
FOR SELECT
TO authenticated
USING (
  -- El usuario es miembro del grupo
  auth.uid() IN (
    SELECT user_id 
    FROM group_members 
    WHERE group_id = documents.group_id
  )
  AND
  (
    -- Si el documento NO es sensible, puede verlo
    documents.type = 'other'
    OR
    -- Si el documento es sensible, verificar caducidad
    (
      documents.type = 'sensitive'
      AND
      (
        -- Grupo tipo 'group' (sin caducidad)
        (
          SELECT g.type 
          FROM groups g 
          WHERE g.id = documents.group_id
        ) = 'group'
        OR
        -- Grupo tipo 'trip' NO caducado
        (
          SELECT g.type 
          FROM groups g 
          WHERE g.id = documents.group_id
        ) = 'trip'
        AND
        (
          SELECT g.end_date 
          FROM groups g 
          WHERE g.id = documents.group_id
        ) >= now()
        OR
        -- Grupo tipo 'trip' caducado pero el usuario es owner
        (
          SELECT g.type 
          FROM groups g 
          WHERE g.id = documents.group_id
        ) = 'trip'
        AND
        (
          SELECT g.end_date 
          FROM groups g 
          WHERE g.id = documents.group_id
        ) < now()
        AND
        auth.uid() = (
          SELECT g.owner_id 
          FROM groups g 
          WHERE g.id = documents.group_id
        )
      )
    )
  )
);

-- =====================================================
-- RLS POLICY: documents - INSERT
-- =====================================================
-- Los usuarios pueden crear documentos si son miembros del grupo
CREATE POLICY "Crear documentos en grupo"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id 
    FROM group_members 
    WHERE group_id = documents.group_id
  )
);

-- =====================================================
-- RLS POLICY: documents - UPDATE
-- =====================================================
-- Solo el owner del documento puede actualizarlo
CREATE POLICY "Actualizar propios documentos"
ON documents
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- RLS POLICY: documents - DELETE
-- =====================================================
-- Solo el owner del documento puede eliminarlo
CREATE POLICY "Eliminar propios documentos"
ON documents
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- =====================================================
-- RLS POLICY: document_versions - SELECT
-- =====================================================
-- Los usuarios pueden ver versiones si pueden ver el documento
CREATE POLICY "Ver versiones de documentos"
ON document_versions
FOR SELECT
TO authenticated
USING (
  document_id IN (
    SELECT id 
    FROM documents 
    WHERE 
      -- Usuario es miembro del grupo
      auth.uid() IN (
        SELECT user_id 
        FROM group_members 
        WHERE group_id = documents.group_id
      )
  )
);

-- =====================================================
-- RLS POLICY: document_versions - INSERT
-- =====================================================
-- Solo el owner del documento puede añadir versiones
CREATE POLICY "Añadir versiones a propios documentos"
ON document_versions
FOR INSERT
TO authenticated
WITH CHECK (
  document_id IN (
    SELECT id 
    FROM documents 
    WHERE owner_id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICY: document_versions - DELETE
-- =====================================================
-- Solo el owner del documento puede eliminar versiones
CREATE POLICY "Eliminar versiones de propios documentos"
ON document_versions
FOR DELETE
TO authenticated
USING (
  document_id IN (
    SELECT id 
    FROM documents 
    WHERE owner_id = auth.uid()
  )
);

-- =====================================================
-- RPC FUNCTION: upload_doc_metadata
-- =====================================================
-- Crea la metadata de un nuevo documento
-- Verifica que el usuario sea miembro del grupo
CREATE OR REPLACE FUNCTION upload_doc_metadata(
  p_group_id uuid,
  p_title text,
  p_type text,
  p_encrypted boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_document_id uuid;
  v_is_member boolean;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que el usuario es miembro del grupo
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'No eres miembro de este grupo';
  END IF;

  -- Crear el documento
  INSERT INTO documents (
    group_id,
    owner_id,
    type,
    title,
    encrypted
  )
  VALUES (
    p_group_id,
    v_user_id,
    p_type,
    p_title,
    p_encrypted
  )
  RETURNING id INTO v_document_id;

  -- Retornar el documento
  RETURN (
    SELECT json_build_object(
      'id', d.id,
      'group_id', d.group_id,
      'owner_id', d.owner_id,
      'type', d.type,
      'title', d.title,
      'encrypted', d.encrypted,
      'created_at', d.created_at
    )
    FROM documents d
    WHERE d.id = v_document_id
  );
END;
$$;

-- =====================================================
-- RPC FUNCTION: add_doc_version
-- =====================================================
-- Añade una nueva versión a un documento existente
-- Solo el owner del documento puede añadir versiones
CREATE OR REPLACE FUNCTION add_doc_version(
  p_document_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_size_bytes integer,
  p_ocr_data jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_version_id uuid;
  v_is_owner boolean;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que el usuario es owner del documento
  SELECT EXISTS(
    SELECT 1 FROM documents
    WHERE id = p_document_id
      AND owner_id = v_user_id
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'No eres el dueño de este documento';
  END IF;

  -- Crear la versión
  INSERT INTO document_versions (
    document_id,
    storage_path,
    mime_type,
    size_bytes,
    ocr_data
  )
  VALUES (
    p_document_id,
    p_storage_path,
    p_mime_type,
    p_size_bytes,
    p_ocr_data
  )
  RETURNING id INTO v_version_id;

  -- Retornar la versión
  RETURN (
    SELECT json_build_object(
      'id', dv.id,
      'document_id', dv.document_id,
      'storage_path', dv.storage_path,
      'mime_type', dv.mime_type,
      'size_bytes', dv.size_bytes,
      'ocr_data', dv.ocr_data,
      'created_at', dv.created_at
    )
    FROM document_versions dv
    WHERE dv.id = v_version_id
  );
END;
$$;

-- =====================================================
-- RPC FUNCTION: get_group_documents
-- =====================================================
-- Obtiene todos los documentos de un grupo con su última versión
-- Aplica lógica de caducidad para documentos sensibles
CREATE OR REPLACE FUNCTION get_group_documents(p_group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_member boolean;
  v_is_owner boolean;
  v_group_type text;
  v_group_end_date date;
  v_is_expired boolean;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que el usuario es miembro del grupo
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'No eres miembro de este grupo';
  END IF;

  -- Obtener info del grupo
  SELECT g.type, g.end_date, g.owner_id = v_user_id
  INTO v_group_type, v_group_end_date, v_is_owner
  FROM groups g
  WHERE g.id = p_group_id;

  -- Verificar si el grupo está caducado
  v_is_expired := (v_group_type = 'trip' AND v_group_end_date < CURRENT_DATE);

  -- Retornar documentos con última versión
  -- Filtra documentos sensibles si el viaje caducó y no es owner
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', d.id,
        'group_id', d.group_id,
        'owner_id', d.owner_id,
        'type', d.type,
        'title', d.title,
        'encrypted', d.encrypted,
        'created_at', d.created_at,
        'latest_version', (
          SELECT json_build_object(
            'id', dv.id,
            'storage_path', dv.storage_path,
            'mime_type', dv.mime_type,
            'size_bytes', dv.size_bytes,
            'ocr_data', dv.ocr_data,
            'created_at', dv.created_at
          )
          FROM document_versions dv
          WHERE dv.document_id = d.id
          ORDER BY dv.created_at DESC
          LIMIT 1
        ),
        'owner', (
          SELECT json_build_object(
            'id', p.id,
            'email', p.email,
            'full_name', p.full_name
          )
          FROM profiles p
          WHERE p.id = d.owner_id
        )
      )
    )
    FROM documents d
    WHERE d.group_id = p_group_id
      AND (
        -- Documentos no sensibles: siempre visibles
        d.type = 'other'
        OR
        -- Documentos sensibles: solo si no está caducado o es owner
        (
          d.type = 'sensitive'
          AND
          (NOT v_is_expired OR v_is_owner)
        )
      )
  );
END;
$$;

-- =====================================================
-- PERMISOS
-- =====================================================

GRANT EXECUTE ON FUNCTION upload_doc_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION add_doc_version TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_documents TO authenticated;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE documents IS 'Almacena metadata de documentos subidos por usuarios a grupos';
COMMENT ON TABLE document_versions IS 'Historial de versiones de cada documento';
COMMENT ON FUNCTION upload_doc_metadata IS 'Crea metadata de un nuevo documento en un grupo';
COMMENT ON FUNCTION add_doc_version IS 'Añade una nueva versión a un documento existente';
COMMENT ON FUNCTION get_group_documents IS 'Obtiene documentos de un grupo con lógica de caducidad';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

