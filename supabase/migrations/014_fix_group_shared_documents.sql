-- ===================================================================
-- MIGRACIÓN 014: FIX GET_GROUP_SHARED_DOCUMENTS
-- ===================================================================
-- Propósito: Arreglar error de GROUP BY en get_group_shared_documents
-- Error: column "ds.shared_at" must appear in the GROUP BY clause
-- ===================================================================

-- Reescribir función para evitar problemas de agregación
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

  -- Construir resultado sin problemas de GROUP BY
  -- Cada fila ya es un documento único, no necesitamos agrupar
  RETURN (
    SELECT COALESCE(json_agg(doc_info ORDER BY doc_info->>'shared_at' DESC), '[]'::json)
    FROM (
      SELECT json_build_object(
        'id', ud.id,
        'type', ud.type,
        'title', ud.title,
        'mime_type', ud.mime_type,
        'size_bytes', ud.size_bytes,
        'owner', (
          SELECT json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email
          )
          FROM profiles p
          WHERE p.id = ud.owner_id
        ),
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

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Función get_group_shared_documents actualizada correctamente';
END $$;

-- =====================================================
-- COMENTARIO
-- =====================================================

COMMENT ON FUNCTION get_group_shared_documents IS 'Obtener documentos compartidos en grupo (FIXED: GROUP BY error)';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

