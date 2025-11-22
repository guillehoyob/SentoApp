-- =====================================================
-- CREAR TABLA: document_files
-- =====================================================
-- Permite múltiples archivos por documento

CREATE TABLE IF NOT EXISTS document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_document_files_doc ON document_files(document_id);

-- RPC: Añadir archivo a documento
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

-- RPC: Eliminar archivo
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

-- RPC: Actualizar nombre de archivo
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

COMMENT ON TABLE document_files IS 'Múltiples archivos por documento';

