-- ===================================================================
-- MIGRACIÓN 015: FIX GET_DOCUMENT_URL
-- ===================================================================
-- Propósito: Arreglar error "operator does not exist: record ->> unknown"
-- Error: v_rate_check es de tipo RECORD, no JSON
-- ===================================================================

-- Reescribir función con tipo de dato correcto
CREATE OR REPLACE FUNCTION get_document_url(
  p_document_id uuid,
  p_group_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_storage_path text;
  v_can_access boolean := false;
  v_rate_check json; -- CAMBIO: de record a json
  v_is_owner boolean := false;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    INSERT INTO document_access_logs (
      document_id, accessed_by, group_id, action, success, error_reason
    )
    VALUES (
      p_document_id, NULL, p_group_id, 'denied', false, 'Usuario no autenticado'
    );
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar si es el owner del documento (siempre tiene acceso)
  SELECT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id AND owner_id = v_user_id
  ) INTO v_is_owner;

  -- Si es owner, permitir acceso directo (para ver desde vault propio)
  IF v_is_owner THEN
    v_can_access := true;
  ELSE
    -- Rate limiting (solo para no-owners)
    SELECT check_rate_limit(v_user_id) INTO v_rate_check;

    IF NOT (v_rate_check->>'allowed')::boolean THEN
      INSERT INTO document_access_logs (
        document_id, accessed_by, group_id, action, success, error_reason
      )
      VALUES (
        p_document_id, v_user_id, p_group_id, 'denied', false, 'Rate limit exceeded'
      );
      RAISE EXCEPTION 'Rate limit exceeded';
    END IF;

    -- Obtener rol
    SELECT role INTO v_user_role
    FROM group_members
    WHERE group_id = p_group_id AND user_id = v_user_id;

    -- Verificar acceso
    IF v_user_role IN ('owner', 'admin') THEN
      v_can_access := true;
    ELSE
      -- Verificar share de grupo
      SELECT EXISTS(
        SELECT 1 FROM document_shares
        WHERE document_id = p_document_id
          AND group_id = p_group_id
          AND is_visible = true
          AND (expires_at IS NULL OR expires_at > now())
      ) INTO v_can_access;

      -- Si no, verificar share individual
      IF NOT v_can_access THEN
        SELECT EXISTS(
          SELECT 1 FROM document_individual_shares
          WHERE document_id = p_document_id
            AND group_id = p_group_id
            AND shared_with = v_user_id
            AND (expires_at IS NULL OR expires_at > now())
        ) INTO v_can_access;
      END IF;
    END IF;
  END IF;

  IF NOT v_can_access THEN
    INSERT INTO document_access_logs (
      document_id, accessed_by, group_id, action, success, error_reason
    )
    VALUES (
      p_document_id, v_user_id, p_group_id, 'denied', false, 'No tiene permisos'
    );
    RAISE EXCEPTION 'No tiene permisos para acceder a este documento';
  END IF;

  -- Obtener storage_path
  SELECT storage_path INTO v_storage_path
  FROM user_documents
  WHERE id = p_document_id;

  IF v_storage_path IS NULL THEN
    RAISE EXCEPTION 'Documento no encontrado';
  END IF;

  -- Log éxito
  INSERT INTO document_access_logs (
    document_id, accessed_by, group_id, action, success
  )
  VALUES (
    p_document_id, v_user_id, p_group_id, 'view', true
  );

  -- Retornar storage_path (el cliente generará la signed URL)
  RETURN v_storage_path;
END;
$$;

-- =====================================================
-- AÑADIR FUNCIÓN PARA MOSTRAR DE NUEVO (UNHIDE)
-- =====================================================

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

  -- Verificar que es owner del documento
  IF NOT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id AND owner_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Solo el dueño puede modificar visibilidad';
  END IF;

  -- Actualizar share a visible
  UPDATE document_shares
  SET is_visible = true
  WHERE document_id = p_document_id
    AND group_id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe un share para este grupo';
  END IF;

  RETURN json_build_object('success', true, 'message', 'Documento visible de nuevo');
END;
$$;

-- =====================================================
-- AÑADIR FUNCIÓN PARA ELIMINAR DOCUMENTO COMPLETAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION delete_personal_document(p_document_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_storage_path text;
  v_shares_deleted int;
  v_requests_deleted int;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que es owner
  SELECT storage_path INTO v_storage_path
  FROM user_documents
  WHERE id = p_document_id AND owner_id = v_user_id;

  IF v_storage_path IS NULL THEN
    RAISE EXCEPTION 'Documento no encontrado o no tienes permisos';
  END IF;

  -- Eliminar shares individuales
  DELETE FROM document_individual_shares
  WHERE document_id = p_document_id;

  -- Eliminar shares de grupo
  DELETE FROM document_shares
  WHERE document_id = p_document_id;
  GET DIAGNOSTICS v_shares_deleted = ROW_COUNT;

  -- Eliminar solicitudes
  DELETE FROM document_access_requests
  WHERE document_id = p_document_id;
  GET DIAGNOSTICS v_requests_deleted = ROW_COUNT;

  -- Eliminar logs (opcional, mejor mantenerlos para auditoría)
  -- DELETE FROM document_access_logs WHERE document_id = p_document_id;

  -- Eliminar documento
  DELETE FROM user_documents
  WHERE id = p_document_id;

  -- NOTA: El archivo en Storage debe eliminarse desde el cliente
  -- usando supabase.storage.from('documents').remove([storage_path])

  RETURN json_build_object(
    'success', true,
    'storage_path', v_storage_path,
    'shares_deleted', v_shares_deleted,
    'requests_deleted', v_requests_deleted
  );
END;
$$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Función get_document_url actualizada (fix rate_check type)';
  RAISE NOTICE '✅ Función show_document_in_group creada';
  RAISE NOTICE '✅ Función delete_personal_document creada';
END $$;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION get_document_url IS 'Obtener storage_path con rate limit y logging (FIXED: json type)';
COMMENT ON FUNCTION show_document_in_group IS 'Mostrar documento oculto de nuevo en un grupo';
COMMENT ON FUNCTION delete_personal_document IS 'Eliminar documento completamente (shares, requests, BD)';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

