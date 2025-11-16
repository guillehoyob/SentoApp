-- ===================================================
-- FIX: delete_personal_document para documentos sin storage_path
-- ===================================================
-- Ahora los documentos pueden no tener storage_path (archivos en document_files)
-- ===================================================

CREATE OR REPLACE FUNCTION delete_personal_document(p_document_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_doc_exists boolean;
  v_shares_deleted int;
  v_requests_deleted int;
  v_file_record record;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que el documento existe y es del usuario
  SELECT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id AND owner_id = v_user_id
  ) INTO v_doc_exists;

  IF NOT v_doc_exists THEN
    RAISE EXCEPTION 'Documento no encontrado o no tienes permisos';
  END IF;

  -- 1. Eliminar archivos de Storage (desde document_files)
  FOR v_file_record IN 
    SELECT storage_path FROM document_files WHERE document_id = p_document_id
  LOOP
    -- Nota: No podemos eliminar de Storage desde PL/pgSQL directamente
    -- Los archivos se deben eliminar desde el cliente con supabase.storage.from('documents').remove()
    -- O configurar Storage para cascade delete
    NULL;
  END LOOP;

  -- 2. Eliminar registros de document_files
  DELETE FROM document_files WHERE document_id = p_document_id;

  -- 3. Eliminar shares
  DELETE FROM document_shares WHERE document_id = p_document_id;
  GET DIAGNOSTICS v_shares_deleted = ROW_COUNT;

  -- 4. Eliminar requests
  DELETE FROM document_access_requests WHERE document_id = p_document_id;
  GET DIAGNOSTICS v_requests_deleted = ROW_COUNT;

  -- 5. Eliminar logs
  DELETE FROM document_access_logs WHERE document_id = p_document_id;

  -- 6. Finalmente eliminar el documento
  DELETE FROM user_documents WHERE id = p_document_id;

  RETURN json_build_object(
    'success', true,
    'shares_deleted', v_shares_deleted,
    'requests_deleted', v_requests_deleted
  );
END;
$$;

