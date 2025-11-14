-- FIX: Permitir group_id NULL en logs (para cuando owner ve su doc)
-- FIX: hide_document_from_group debe verificar owner, no shared_by

-- Permitir NULL en group_id para document_access_logs
ALTER TABLE document_access_logs 
ALTER COLUMN group_id DROP NOT NULL;

-- FIX: hide debe verificar que eres OWNER del documento
CREATE OR REPLACE FUNCTION hide_document_from_group(
  p_document_id uuid,
  p_group_id uuid
)
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

  -- Verificar que es owner del documento
  IF NOT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id AND owner_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Solo el dueño puede ocultar el documento';
  END IF;

  -- Actualizar share
  UPDATE document_shares
  SET is_visible = false, updated_at = now()
  WHERE document_id = p_document_id
    AND group_id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe un share para este grupo';
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- Reescribir get_document_url para manejar NULL group_id
CREATE OR REPLACE FUNCTION get_document_url(
  p_document_id uuid,
  p_group_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_storage_path text;
  v_is_owner boolean := false;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar si es owner
  SELECT (owner_id = v_user_id), storage_path 
  INTO v_is_owner, v_storage_path
  FROM user_documents
  WHERE id = p_document_id;

  IF v_storage_path IS NULL THEN
    RAISE EXCEPTION 'Documento no encontrado';
  END IF;

  -- Si es owner, permitir acceso siempre
  IF v_is_owner THEN
    INSERT INTO document_access_logs (document_id, accessed_by, group_id, action, success)
    VALUES (p_document_id, v_user_id, p_group_id, 'view', true);
    
    RETURN v_storage_path;
  END IF;

  -- Si no es owner, verificar permisos en el grupo
  IF p_group_id IS NULL THEN
    RAISE EXCEPTION 'No tienes permisos para acceder a este documento';
  END IF;

  -- Verificar share de grupo
  IF EXISTS(
    SELECT 1 FROM document_shares
    WHERE document_id = p_document_id
      AND group_id = p_group_id
      AND is_visible = true
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    INSERT INTO document_access_logs (document_id, accessed_by, group_id, action, success)
    VALUES (p_document_id, v_user_id, p_group_id, 'view', true);
    
    RETURN v_storage_path;
  END IF;

  RAISE EXCEPTION 'No tienes permisos para acceder a este documento';
END;
$$;

-- FIX: show también debe verificar owner
CREATE OR REPLACE FUNCTION show_document_in_group(
  p_document_id uuid,
  p_group_id uuid
)
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

  -- Verificar que es owner
  IF NOT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id AND owner_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Solo el dueño puede modificar visibilidad';
  END IF;

  -- Actualizar share
  UPDATE document_shares
  SET is_visible = true, updated_at = now()
  WHERE document_id = p_document_id
    AND group_id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe un share para este grupo';
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

COMMENT ON FUNCTION get_document_url IS 'Ver documento (FIX: NULL group_id para owners)';
COMMENT ON FUNCTION hide_document_from_group IS 'Ocultar (FIX: verifica owner correctamente)';
COMMENT ON FUNCTION show_document_in_group IS 'Mostrar (FIX: verifica owner correctamente)';

