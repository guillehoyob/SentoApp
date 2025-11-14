-- FIX: Corregir columnas en request_documents_from_group
CREATE OR REPLACE FUNCTION request_documents_from_group(
  p_group_id uuid,
  p_doc_types text[],
  p_user_ids uuid[] DEFAULT NULL,
  p_message text DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_target_users uuid[];
  v_user uuid;
  v_doc_type text;
  v_doc_id uuid;
  v_count int := 0;
BEGIN
  SELECT role INTO v_role FROM group_members
  WHERE group_id = p_group_id AND user_id = v_user_id;

  IF v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Solo owners/admins pueden solicitar documentos';
  END IF;

  IF p_user_ids IS NULL THEN
    SELECT array_agg(user_id) INTO v_target_users
    FROM group_members
    WHERE group_id = p_group_id AND user_id != v_user_id;
  ELSE
    v_target_users := p_user_ids;
  END IF;

  FOREACH v_user IN ARRAY v_target_users LOOP
    FOREACH v_doc_type IN ARRAY p_doc_types LOOP
      SELECT id INTO v_doc_id
      FROM user_documents
      WHERE owner_id = v_user AND type = v_doc_type
      LIMIT 1;

      IF v_doc_id IS NOT NULL THEN
        INSERT INTO document_access_requests (
          document_id, requested_by, group_id, note, status
        ) VALUES (
          v_doc_id, v_user_id, p_group_id, p_message, 'pending'
        );
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN json_build_object('success', true, 'requests_created', v_count);
END;$$;

GRANT EXECUTE ON FUNCTION request_documents_from_group TO authenticated;

-- FIX: get_group_requirements debe devolver doc_type (no document_type)
CREATE OR REPLACE FUNCTION get_group_requirements(p_group_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'doc_type', document_type,
        'is_required', is_required,
        'visibility', visibility
      )
    ), '[]'::json)
    FROM group_document_requirements
    WHERE group_id = p_group_id
  );
END;$$;

GRANT EXECUTE ON FUNCTION get_group_requirements TO authenticated;

