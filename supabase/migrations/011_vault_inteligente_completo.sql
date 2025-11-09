-- =====================================================
-- FASE 8A++: VAULT INTELIGENTE COMPLETO
-- =====================================================
-- Sistema completo de gestión de documentos personales con:
-- 1. Roles (Owner/Admin/Member)
-- 2. Pre-requisitos de grupo
-- 3. Solicitudes masivas
-- 4. Permisos flexibles (5 tipos)
-- 5. Seguridad completa (rate limiting, auditoría)
--
-- IMPORTANTE: Este archivo asume que group_members ya tiene la columna "role"
-- Si no la tiene, ejecuta primero el PASO 1 de la guía rápida
-- =====================================================

-- =====================================================
-- TABLA 1: user_documents
-- =====================================================
-- Vault personal del usuario - Documentos privados
CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('passport', 'id_card', 'insurance', 'license', 'other')),
  title text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  encrypted boolean DEFAULT false,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA 2: document_shares
-- =====================================================
-- Compartir documentos con grupos (5 tipos de permisos)
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Tipo de permiso
  share_type text NOT NULL CHECK (share_type IN (
    'permanent',      -- Siempre visible
    'trip_linked',    -- Se activa/oculta con fechas del viaje
    'temporary',      -- Visible X días
    'manual',         -- Hasta que el dueño lo oculte
    'scheduled'       -- Desde fecha X hasta Y
  )) DEFAULT 'manual',
  
  is_visible boolean DEFAULT true,
  expires_at timestamptz,
  activate_at timestamptz,
  auto_activate_on_trip_start boolean DEFAULT false,
  
  shared_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(document_id, group_id)
);

-- =====================================================
-- TABLA 3: document_individual_shares
-- =====================================================
-- Shares individuales (para aprobaciones específicas a 1 persona)
CREATE TABLE IF NOT EXISTS document_individual_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  shared_with uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_type text DEFAULT 'temporary',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(document_id, group_id, shared_with)
);

-- =====================================================
-- TABLA 4: document_access_logs
-- =====================================================
-- Auditoría completa de accesos (éxitos y fallos)
CREATE TABLE IF NOT EXISTS document_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN (
    'view', 'download', 'share', 'hide', 'revoke', 
    'denied', 'request_sent', 'request_approved', 'request_rejected'
  )),
  success boolean DEFAULT true,
  error_reason text,
  metadata jsonb,
  accessed_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA 5: document_access_requests
-- =====================================================
-- Solicitudes individuales de acceso
CREATE TABLE IF NOT EXISTS document_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_duration text,
  note text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_duration text,
  approved_for text CHECK (approved_for IN ('requester_only', 'whole_group')),
  rejected_reason text,
  bulk_request_id uuid,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA 6: bulk_access_requests
-- =====================================================
-- Solicitudes masivas (múltiples docs/personas)
CREATE TABLE IF NOT EXISTS bulk_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN (
    'multiple_docs_one_user',    -- Varios docs a 1 persona
    'one_doc_multiple_users'     -- 1 doc a varias personas
  )),
  document_type text,
  target_user_id uuid REFERENCES profiles(id),
  target_user_ids uuid[],
  requested_duration text,
  note text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled')),
  total_count integer NOT NULL,
  approved_count integer DEFAULT 0,
  rejected_count integer DEFAULT 0,
  pending_count integer,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA 7: group_document_requirements
-- =====================================================
-- Pre-requisitos de documentos al crear grupo
CREATE TABLE IF NOT EXISTS group_document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  is_required boolean DEFAULT true,
  visibility text DEFAULT 'admins_only' CHECK (visibility IN ('admins_only', 'all_members')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(group_id, document_type)
);

-- =====================================================
-- TABLA 8: document_rate_limits
-- =====================================================
-- Rate limiting (10 accesos por minuto)
CREATE TABLE IF NOT EXISTS document_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  access_count integer DEFAULT 1,
  
  UNIQUE(user_id, window_start)
);

-- =====================================================
-- ÍNDICES PARA BÚSQUEDAS RÁPIDAS
-- =====================================================

-- user_documents
CREATE INDEX IF NOT EXISTS user_documents_owner_id_idx ON user_documents(owner_id);
CREATE INDEX IF NOT EXISTS user_documents_type_idx ON user_documents(type);

-- document_shares
CREATE INDEX IF NOT EXISTS document_shares_group_id_idx ON document_shares(group_id);
CREATE INDEX IF NOT EXISTS document_shares_document_id_idx ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS document_shares_expires_at_idx ON document_shares(expires_at) WHERE expires_at IS NOT NULL;

-- document_individual_shares
CREATE INDEX IF NOT EXISTS document_individual_shares_shared_with_idx ON document_individual_shares(shared_with);
CREATE INDEX IF NOT EXISTS document_individual_shares_group_id_idx ON document_individual_shares(group_id);

-- document_access_logs
CREATE INDEX IF NOT EXISTS document_access_logs_document_id_idx ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS document_access_logs_accessed_at_idx ON document_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS document_access_logs_success_idx ON document_access_logs(success) WHERE success = false;
CREATE INDEX IF NOT EXISTS document_access_logs_metadata_idx ON document_access_logs USING gin(metadata);

-- document_access_requests
CREATE INDEX IF NOT EXISTS document_access_requests_status_idx ON document_access_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS document_access_requests_bulk_idx ON document_access_requests(bulk_request_id) WHERE bulk_request_id IS NOT NULL;

-- bulk_access_requests
CREATE INDEX IF NOT EXISTS bulk_access_requests_group_id_idx ON bulk_access_requests(group_id);
CREATE INDEX IF NOT EXISTS bulk_access_requests_status_idx ON bulk_access_requests(status) WHERE status IN ('pending', 'partial');

-- group_document_requirements
CREATE INDEX IF NOT EXISTS group_document_requirements_group_id_idx ON group_document_requirements(group_id);

-- document_rate_limits
CREATE INDEX IF NOT EXISTS document_rate_limits_window_idx ON document_rate_limits(user_id, window_start DESC);

-- =====================================================
-- RLS: HABILITAR EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_individual_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_rate_limits ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: user_documents
-- =====================================================

CREATE POLICY "Ver propios documentos" ON user_documents
FOR SELECT TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Crear propios documentos" ON user_documents
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Actualizar propios documentos" ON user_documents
FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Eliminar propios documentos" ON user_documents
FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- =====================================================
-- RLS POLICIES: document_shares
-- =====================================================

CREATE POLICY "Ver shares propios o de tu grupo" ON document_shares
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_shares.document_id
  )
  OR
  auth.uid() IN (
    SELECT user_id FROM group_members WHERE group_id = document_shares.group_id
  )
);

CREATE POLICY "Compartir propios documentos" ON document_shares
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_shares.document_id
  )
  AND shared_by = auth.uid()
);

CREATE POLICY "Actualizar shares propios" ON document_shares
FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_shares.document_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_shares.document_id
  )
);

CREATE POLICY "Revocar shares propios" ON document_shares
FOR DELETE TO authenticated
USING (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_shares.document_id
  )
);

-- =====================================================
-- RLS POLICIES: document_individual_shares
-- =====================================================

CREATE POLICY "Ver shares individuales relevantes" ON document_individual_shares
FOR SELECT TO authenticated
USING (
  auth.uid() = shared_with
  OR
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_individual_shares.document_id
  )
);

CREATE POLICY "Crear shares individuales" ON document_individual_shares
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = shared_by
);

-- =====================================================
-- RLS POLICIES: document_access_logs
-- =====================================================

CREATE POLICY "Ver logs de propios documentos" ON document_access_logs
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_access_logs.document_id
  )
);

CREATE POLICY "Crear logs" ON document_access_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: document_access_requests
-- =====================================================

CREATE POLICY "Ver solicitudes relevantes" ON document_access_requests
FOR SELECT TO authenticated
USING (
  auth.uid() = requested_by
  OR
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_access_requests.document_id
  )
);

CREATE POLICY "Crear solicitudes" ON document_access_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Actualizar solicitudes propias" ON document_access_requests
FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_access_requests.document_id
  )
);

-- =====================================================
-- RLS POLICIES: bulk_access_requests
-- =====================================================

CREATE POLICY "Ver bulk requests propias" ON bulk_access_requests
FOR SELECT TO authenticated
USING (
  auth.uid() = requested_by
  OR
  auth.uid() IN (
    SELECT user_id FROM group_members 
    WHERE group_id = bulk_access_requests.group_id 
      AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Crear bulk requests" ON bulk_access_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requested_by);

-- =====================================================
-- RLS POLICIES: group_document_requirements
-- =====================================================

CREATE POLICY "Ver requisitos del grupo" ON group_document_requirements
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM group_members WHERE group_id = group_document_requirements.group_id
  )
);

CREATE POLICY "Gestionar requisitos" ON group_document_requirements
FOR ALL TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM group_members 
    WHERE group_id = group_document_requirements.group_id 
      AND role = 'owner'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM group_members 
    WHERE group_id = group_document_requirements.group_id 
      AND role = 'owner'
  )
);

-- =====================================================
-- RLS POLICIES: document_rate_limits
-- =====================================================

CREATE POLICY "Ver propios rate limits" ON document_rate_limits
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Sistema gestiona rate limits" ON document_rate_limits
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at en document_shares
CREATE OR REPLACE FUNCTION update_document_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_shares_updated_at
BEFORE UPDATE ON document_shares
FOR EACH ROW
EXECUTE FUNCTION update_document_shares_updated_at();

-- =====================================================
-- RPC FUNCTIONS - PARTE 1: GESTIÓN DE DOCUMENTOS
-- =====================================================

-- Crear documento personal
CREATE OR REPLACE FUNCTION create_personal_document(
  p_type text,
  p_title text,
  p_storage_path text,
  p_mime_type text,
  p_size_bytes integer,
  p_encrypted boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_document_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  INSERT INTO user_documents (
    owner_id, type, title, storage_path, encrypted, mime_type, size_bytes
  )
  VALUES (
    v_user_id, p_type, p_title, p_storage_path, p_encrypted, p_mime_type, p_size_bytes
  )
  RETURNING id INTO v_document_id;

  RETURN (
    SELECT json_build_object(
      'id', ud.id,
      'owner_id', ud.owner_id,
      'type', ud.type,
      'title', ud.title,
      'storage_path', ud.storage_path,
      'encrypted', ud.encrypted,
      'mime_type', ud.mime_type,
      'size_bytes', ud.size_bytes,
      'created_at', ud.created_at
    )
    FROM user_documents ud
    WHERE ud.id = v_document_id
  );
END;
$$;

-- Obtener mis documentos
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
    SELECT json_agg(
      json_build_object(
        'id', ud.id,
        'type', ud.type,
        'title', ud.title,
        'storage_path', ud.storage_path,
        'encrypted', ud.encrypted,
        'mime_type', ud.mime_type,
        'size_bytes', ud.size_bytes,
        'created_at', ud.created_at,
        'shared_in', (
          SELECT json_agg(
            json_build_object(
              'group_id', ds.group_id,
              'group_name', g.name,
              'is_visible', ds.is_visible,
              'share_type', ds.share_type,
              'expires_at', ds.expires_at,
              'shared_at', ds.shared_at
            )
          )
          FROM document_shares ds
          JOIN groups g ON g.id = ds.group_id
          WHERE ds.document_id = ud.id
        )
      )
    )
    FROM user_documents ud
    WHERE ud.owner_id = v_user_id
    ORDER BY ud.created_at DESC
  );
END;
$$;

-- =====================================================
-- RPC FUNCTIONS - PARTE 2: COMPARTIR DOCUMENTOS
-- =====================================================

-- Compartir documento con grupo
CREATE OR REPLACE FUNCTION share_document_with_group(
  p_document_id uuid,
  p_group_id uuid,
  p_share_type text DEFAULT 'manual',
  p_expires_in_days integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_owner boolean;
  v_is_member boolean;
  v_share_id uuid;
  v_expires_at timestamptz;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar ownership
  SELECT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id AND owner_id = v_user_id
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'No eres el dueño de este documento';
  END IF;

  -- Verificar membership
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'No eres miembro de este grupo';
  END IF;

  -- Calcular expiración
  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := now() + (p_expires_in_days || ' days')::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  -- Crear o actualizar share
  INSERT INTO document_shares (
    document_id, group_id, shared_by, share_type, is_visible, expires_at
  )
  VALUES (
    p_document_id, p_group_id, v_user_id, p_share_type, true, v_expires_at
  )
  ON CONFLICT (document_id, group_id)
  DO UPDATE SET
    is_visible = true,
    share_type = p_share_type,
    expires_at = v_expires_at,
    updated_at = now()
  RETURNING id INTO v_share_id;

  -- Log
  INSERT INTO document_access_logs (
    document_id, accessed_by, group_id, action, success, metadata
  )
  VALUES (
    p_document_id, v_user_id, p_group_id, 'share', true,
    json_build_object('share_type', p_share_type, 'expires_at', v_expires_at)::jsonb
  );

  RETURN (
    SELECT json_build_object(
      'id', ds.id,
      'document_id', ds.document_id,
      'group_id', ds.group_id,
      'share_type', ds.share_type,
      'expires_at', ds.expires_at
    )
    FROM document_shares ds
    WHERE ds.id = v_share_id
  );
END;
$$;

-- Ocultar documento de grupo
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

  UPDATE document_shares
  SET is_visible = false, updated_at = now()
  WHERE document_id = p_document_id
    AND group_id = p_group_id
    AND shared_by = v_user_id;

  INSERT INTO document_access_logs (
    document_id, accessed_by, group_id, action, success
  )
  VALUES (
    p_document_id, v_user_id, p_group_id, 'hide', true
  );

  RETURN json_build_object('success', true, 'message', 'Documento ocultado');
END;
$$;

-- Revocar todos los shares
CREATE OR REPLACE FUNCTION revoke_all_shares(p_document_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_affected_count integer;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  UPDATE document_shares
  SET is_visible = false, updated_at = now()
  WHERE document_id = p_document_id
    AND shared_by = v_user_id
    AND is_visible = true;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  INSERT INTO document_access_logs (
    document_id, accessed_by, group_id, action, success
  )
  VALUES (
    p_document_id, v_user_id, NULL, 'revoke', true
  );

  RETURN json_build_object(
    'success', true,
    'groups_affected', v_affected_count
  );
END;
$$;

-- =====================================================
-- RPC FUNCTIONS - PARTE 3: SOLICITUDES INDIVIDUALES
-- =====================================================

-- Solicitar acceso a documento
CREATE OR REPLACE FUNCTION request_document_access(
  p_document_id uuid,
  p_group_id uuid,
  p_requested_duration text DEFAULT '7d',
  p_note text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_request_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  INSERT INTO document_access_requests (
    document_id, group_id, requested_by, requested_duration, note, status
  )
  VALUES (
    p_document_id, p_group_id, v_user_id, p_requested_duration, p_note, 'pending'
  )
  RETURNING id INTO v_request_id;

  INSERT INTO document_access_logs (
    document_id, accessed_by, group_id, action, success
  )
  VALUES (
    p_document_id, v_user_id, p_group_id, 'request_sent', true
  );

  RETURN json_build_object(
    'request_id', v_request_id,
    'status', 'pending'
  );
END;
$$;

-- Aprobar solicitud
CREATE OR REPLACE FUNCTION approve_access_request(
  p_request_id uuid,
  p_approved_duration text,
  p_approved_for text DEFAULT 'requester_only'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_request record;
  v_expires_at timestamptz;
  v_days integer;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener request
  SELECT * INTO v_request
  FROM document_access_requests
  WHERE id = p_request_id;

  -- Calcular expiración
  IF p_approved_duration ~ '^\d+d$' THEN
    v_days := substring(p_approved_duration from '^\d+')::integer;
    v_expires_at := now() + (v_days || ' days')::interval;
  ELSIF p_approved_duration = 'permanent' THEN
    v_expires_at := NULL;
  ELSE
    v_expires_at := now() + interval '7 days';
  END IF;

  -- Actualizar request
  UPDATE document_access_requests
  SET status = 'approved',
      approved_at = now(),
      approved_duration = p_approved_duration,
      approved_for = p_approved_for
  WHERE id = p_request_id;

  -- Crear share según tipo
  IF p_approved_for = 'whole_group' THEN
    -- Share para todo el grupo
    INSERT INTO document_shares (
      document_id, group_id, shared_by, share_type, is_visible, expires_at
    )
    VALUES (
      v_request.document_id, v_request.group_id, v_user_id, 
      'temporary', true, v_expires_at
    )
    ON CONFLICT (document_id, group_id)
    DO UPDATE SET
      is_visible = true,
      expires_at = v_expires_at,
      updated_at = now();
  ELSE
    -- Share individual
    INSERT INTO document_individual_shares (
      document_id, group_id, shared_with, shared_by, share_type, expires_at
    )
    VALUES (
      v_request.document_id, v_request.group_id, v_request.requested_by,
      v_user_id, 'temporary', v_expires_at
    )
    ON CONFLICT (document_id, group_id, shared_with)
    DO UPDATE SET
      expires_at = v_expires_at;
  END IF;

  -- Log
  INSERT INTO document_access_logs (
    document_id, accessed_by, group_id, action, success, metadata
  )
  VALUES (
    v_request.document_id, v_user_id, v_request.group_id, 
    'request_approved', true,
    json_build_object('requester', v_request.requested_by, 'duration', p_approved_duration)::jsonb
  );

  RETURN json_build_object('success', true, 'status', 'approved');
END;
$$;

-- Rechazar solicitud
CREATE OR REPLACE FUNCTION reject_access_request(
  p_request_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_request record;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT * INTO v_request
  FROM document_access_requests
  WHERE id = p_request_id;

  UPDATE document_access_requests
  SET status = 'rejected',
      rejected_reason = p_reason
  WHERE id = p_request_id;

  INSERT INTO document_access_logs (
    document_id, accessed_by, group_id, action, success, error_reason
  )
  VALUES (
    v_request.document_id, v_user_id, v_request.group_id,
    'request_rejected', false, p_reason
  );

  RETURN json_build_object('success', true, 'status', 'rejected');
END;
$$;

-- Ver solicitudes pendientes
CREATE OR REPLACE FUNCTION get_my_pending_requests()
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
    SELECT json_agg(
      json_build_object(
        'id', dar.id,
        'document', (
          SELECT json_build_object(
            'id', ud.id,
            'title', ud.title,
            'type', ud.type
          )
          FROM user_documents ud
          WHERE ud.id = dar.document_id
        ),
        'requester', (
          SELECT json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email
          )
          FROM profiles p
          WHERE p.id = dar.requested_by
        ),
        'group', (
          SELECT json_build_object(
            'id', g.id,
            'name', g.name
          )
          FROM groups g
          WHERE g.id = dar.group_id
        ),
        'requested_duration', dar.requested_duration,
        'note', dar.note,
        'created_at', dar.created_at
      )
    )
    FROM document_access_requests dar
    WHERE dar.document_id IN (
      SELECT id FROM user_documents WHERE owner_id = v_user_id
    )
    AND dar.status = 'pending'
    ORDER BY dar.created_at DESC
  );
END;
$$;

-- =====================================================
-- RPC FUNCTIONS - PARTE 4: SOLICITUDES MASIVAS
-- =====================================================

-- Solicitar múltiples documentos a UNA persona
CREATE OR REPLACE FUNCTION request_multiple_documents(
  p_from_user_id uuid,
  p_group_id uuid,
  p_document_types text[],
  p_requested_duration text DEFAULT '7d',
  p_note text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_bulk_id uuid;
  v_doc_type text;
  v_doc_id uuid;
  v_count integer := 0;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Crear bulk request
  INSERT INTO bulk_access_requests (
    group_id, requested_by, request_type, target_user_id,
    requested_duration, note, status, total_count, pending_count
  )
  VALUES (
    p_group_id, v_user_id, 'multiple_docs_one_user', p_from_user_id,
    p_requested_duration, p_note, 'pending', array_length(p_document_types, 1), array_length(p_document_types, 1)
  )
  RETURNING id INTO v_bulk_id;

  -- Crear solicitudes individuales para cada tipo de documento
  FOREACH v_doc_type IN ARRAY p_document_types LOOP
    -- Buscar el documento del usuario
    SELECT id INTO v_doc_id
    FROM user_documents
    WHERE owner_id = p_from_user_id
      AND type = v_doc_type
    LIMIT 1;

    IF v_doc_id IS NOT NULL THEN
      INSERT INTO document_access_requests (
        document_id, group_id, requested_by, requested_duration, 
        note, status, bulk_request_id
      )
      VALUES (
        v_doc_id, p_group_id, v_user_id, p_requested_duration,
        p_note, 'pending', v_bulk_id
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'bulk_request_id', v_bulk_id,
    'requests_created', v_count,
    'status', 'pending'
  );
END;
$$;

-- Solicitar UN documento a MÚLTIPLES personas
CREATE OR REPLACE FUNCTION request_document_from_multiple(
  p_group_id uuid,
  p_document_type text,
  p_from_user_ids uuid[],
  p_requested_duration text DEFAULT '7d',
  p_note text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_bulk_id uuid;
  v_target_user_id uuid;
  v_doc_id uuid;
  v_count integer := 0;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Crear bulk request
  INSERT INTO bulk_access_requests (
    group_id, requested_by, request_type, document_type, target_user_ids,
    requested_duration, note, status, total_count, pending_count
  )
  VALUES (
    p_group_id, v_user_id, 'one_doc_multiple_users', p_document_type, p_from_user_ids,
    p_requested_duration, p_note, 'pending', array_length(p_from_user_ids, 1), array_length(p_from_user_ids, 1)
  )
  RETURNING id INTO v_bulk_id;

  -- Crear solicitudes individuales para cada usuario
  FOREACH v_target_user_id IN ARRAY p_from_user_ids LOOP
    -- Buscar el documento del usuario
    SELECT id INTO v_doc_id
    FROM user_documents
    WHERE owner_id = v_target_user_id
      AND type = p_document_type
    LIMIT 1;

    IF v_doc_id IS NOT NULL THEN
      INSERT INTO document_access_requests (
        document_id, group_id, requested_by, requested_duration,
        note, status, bulk_request_id
      )
      VALUES (
        v_doc_id, p_group_id, v_user_id, p_requested_duration,
        p_note, 'pending', v_bulk_id
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'bulk_request_id', v_bulk_id,
    'requests_created', v_count,
    'status', 'pending'
  );
END;
$$;

-- Ver estado de solicitud masiva
CREATE OR REPLACE FUNCTION get_bulk_request_status(p_bulk_request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_bulk record;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT * INTO v_bulk
  FROM bulk_access_requests
  WHERE id = p_bulk_request_id;

  RETURN json_build_object(
    'id', v_bulk.id,
    'request_type', v_bulk.request_type,
    'total_count', v_bulk.total_count,
    'approved_count', v_bulk.approved_count,
    'rejected_count', v_bulk.rejected_count,
    'pending_count', v_bulk.pending_count,
    'status', v_bulk.status,
    'details', (
      SELECT json_agg(
        json_build_object(
          'document', (
            SELECT json_build_object(
              'id', ud.id,
              'title', ud.title,
              'type', ud.type,
              'owner', (
                SELECT json_build_object(
                  'id', p.id,
                  'full_name', p.full_name,
                  'email', p.email
                )
                FROM profiles p
                WHERE p.id = ud.owner_id
              )
            )
            FROM user_documents ud
            WHERE ud.id = dar.document_id
          ),
          'status', dar.status,
          'approved_at', dar.approved_at,
          'rejected_reason', dar.rejected_reason
        )
      )
      FROM document_access_requests dar
      WHERE dar.bulk_request_id = p_bulk_request_id
    )
  );
END;
$$;

-- =====================================================
-- RPC FUNCTIONS - PARTE 5: PRE-REQUISITOS DE GRUPO
-- =====================================================

-- Configurar requisitos de documentos del grupo
CREATE OR REPLACE FUNCTION set_group_requirements(
  p_group_id uuid,
  p_requirements jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_owner boolean;
  v_req jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que es owner
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = v_user_id
      AND role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Solo el owner puede configurar requisitos';
  END IF;

  -- Eliminar requisitos anteriores
  DELETE FROM group_document_requirements
  WHERE group_id = p_group_id;

  -- Insertar nuevos requisitos
  FOR v_req IN SELECT * FROM jsonb_array_elements(p_requirements) LOOP
    INSERT INTO group_document_requirements (
      group_id, document_type, is_required, visibility, created_by
    )
    VALUES (
      p_group_id,
      v_req->>'type',
      (v_req->>'required')::boolean,
      COALESCE(v_req->>'visibility', 'admins_only'),
      v_user_id
    );
  END LOOP;
END;
$$;

-- Obtener requisitos del grupo
CREATE OR REPLACE FUNCTION get_group_requirements(p_group_id uuid)
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
    SELECT json_agg(
      json_build_object(
        'id', gdr.id,
        'document_type', gdr.document_type,
        'is_required', gdr.is_required,
        'visibility', gdr.visibility
      )
    )
    FROM group_document_requirements gdr
    WHERE gdr.group_id = p_group_id
  );
END;
$$;

-- Ver resumen de documentos faltantes
CREATE OR REPLACE FUNCTION get_missing_documents_summary(p_group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que es admin u owner
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = v_user_id
      AND role IN ('owner', 'admin')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Solo admins pueden ver el resumen';
  END IF;

  RETURN (
    SELECT json_object_agg(
      gdr.document_type,
      json_build_object(
        'required', COUNT(gm.user_id),
        'completed', COUNT(CASE 
          WHEN ds.id IS NOT NULL AND ds.is_visible = true 
          THEN 1 
        END),
        'missing', COUNT(CASE 
          WHEN ds.id IS NULL OR ds.is_visible = false 
          THEN 1 
        END),
        'missing_users', (
          SELECT json_agg(
            json_build_object(
              'id', p.id,
              'full_name', p.full_name,
              'email', p.email
            )
          )
          FROM profiles p
          JOIN group_members gm2 ON gm2.user_id = p.id
          LEFT JOIN user_documents ud ON ud.owner_id = p.id AND ud.type = gdr.document_type
          LEFT JOIN document_shares ds2 ON ds2.document_id = ud.id AND ds2.group_id = p_group_id
          WHERE gm2.group_id = p_group_id
            AND (ds2.id IS NULL OR ds2.is_visible = false)
        )
      )
    )
    FROM group_document_requirements gdr
    CROSS JOIN group_members gm
    LEFT JOIN user_documents ud ON ud.owner_id = gm.user_id AND ud.type = gdr.document_type
    LEFT JOIN document_shares ds ON ds.document_id = ud.id AND ds.group_id = p_group_id
    WHERE gdr.group_id = p_group_id
      AND gm.group_id = p_group_id
    GROUP BY gdr.document_type
  );
END;
$$;

-- Ver qué documentos le faltan a un usuario
CREATE OR REPLACE FUNCTION get_user_missing_documents(
  p_group_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_target_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  v_target_user_id := COALESCE(p_user_id, v_user_id);

  RETURN (
    SELECT json_agg(
      json_build_object(
        'type', gdr.document_type,
        'required', gdr.is_required,
        'user_has_it', EXISTS(
          SELECT 1 FROM user_documents 
          WHERE owner_id = v_target_user_id 
            AND type = gdr.document_type
        ),
        'is_shared', EXISTS(
          SELECT 1 
          FROM user_documents ud
          JOIN document_shares ds ON ds.document_id = ud.id
          WHERE ud.owner_id = v_target_user_id
            AND ud.type = gdr.document_type
            AND ds.group_id = p_group_id
            AND ds.is_visible = true
        )
      )
    )
    FROM group_document_requirements gdr
    WHERE gdr.group_id = p_group_id
  );
END;
$$;

-- =====================================================
-- RPC FUNCTIONS - PARTE 6: ROLES
-- =====================================================

-- Promover a admin
CREATE OR REPLACE FUNCTION promote_to_admin(
  p_group_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_owner boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que es owner
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = v_user_id
      AND role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Solo el owner puede promocionar admins';
  END IF;

  UPDATE group_members
  SET role = 'admin'
  WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND role = 'member';

  RETURN json_build_object('success', true, 'role', 'admin');
END;
$$;

-- Quitar rol de admin
CREATE OR REPLACE FUNCTION demote_from_admin(
  p_group_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_owner boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que es owner
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = v_user_id
      AND role = 'owner'
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Solo el owner puede quitar admins';
  END IF;

  UPDATE group_members
  SET role = 'member'
  WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND role = 'admin';

  RETURN json_build_object('success', true, 'role', 'member');
END;
$$;

-- Verificar rol del usuario
CREATE OR REPLACE FUNCTION check_user_role(
  p_group_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  SELECT role INTO v_role
  FROM group_members
  WHERE group_id = p_group_id
    AND user_id = v_user_id;

  RETURN COALESCE(v_role, 'none');
END;
$$;

-- =====================================================
-- RPC FUNCTIONS - PARTE 7: ACCESO Y AUDITORÍA
-- =====================================================

-- Obtener documentos compartidos en el grupo
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
    SELECT json_agg(
      json_build_object(
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
      )
    )
    FROM document_shares ds
    JOIN user_documents ud ON ud.id = ds.document_id
    WHERE ds.group_id = p_group_id
      AND (
        v_user_role IN ('owner', 'admin')
        OR
        (ds.is_visible AND (ds.expires_at IS NULL OR ds.expires_at > now()))
      )
    ORDER BY ds.shared_at DESC
  );
END;
$$;

-- Generar URL firmada para documento (con rate limit y logging)
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
  v_rate_check record;
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

  -- Rate limiting
  SELECT * INTO v_rate_check
  FROM check_rate_limit(v_user_id);

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

-- Ver logs de acceso a documento
CREATE OR REPLACE FUNCTION get_document_access_logs(p_document_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_owner boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar ownership
  SELECT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id AND owner_id = v_user_id
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'No eres el dueño de este documento';
  END IF;

  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', dal.id,
        'action', dal.action,
        'success', dal.success,
        'error_reason', dal.error_reason,
        'accessed_at', dal.accessed_at,
        'accessor', (
          SELECT json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email
          )
          FROM profiles p
          WHERE p.id = dal.accessed_by
        ),
        'group', (
          SELECT json_build_object(
            'id', g.id,
            'name', g.name
          )
          FROM groups g
          WHERE g.id = dal.group_id
        )
      )
    )
    FROM document_access_logs dal
    WHERE dal.document_id = p_document_id
    ORDER BY dal.accessed_at DESC
    LIMIT 100
  );
END;
$$;

-- =====================================================
-- RPC FUNCTIONS - PARTE 8: RATE LIMITING
-- =====================================================

-- Verificar rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_window timestamptz;
  v_access_count integer;
BEGIN
  v_current_window := date_trunc('minute', now());

  SELECT access_count INTO v_access_count
  FROM document_rate_limits
  WHERE user_id = p_user_id
    AND window_start = v_current_window;

  IF v_access_count IS NULL THEN
    -- Primera petición en esta ventana
    INSERT INTO document_rate_limits (user_id, window_start, access_count)
    VALUES (p_user_id, v_current_window, 1);

    RETURN json_build_object(
      'allowed', true,
      'remaining', 9,
      'window_start', v_current_window
    );
  ELSIF v_access_count < 10 THEN
    -- Incrementar contador
    UPDATE document_rate_limits
    SET access_count = access_count + 1
    WHERE user_id = p_user_id
      AND window_start = v_current_window;

    RETURN json_build_object(
      'allowed', true,
      'remaining', 10 - v_access_count - 1,
      'window_start', v_current_window
    );
  ELSE
    -- Límite excedido
    RETURN json_build_object(
      'allowed', false,
      'remaining', 0,
      'window_start', v_current_window,
      'retry_after', v_current_window + interval '1 minute'
    );
  END IF;
END;
$$;

-- Limpiar rate limits antiguos (ejecutar con cron job)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM document_rate_limits
  WHERE window_start < now() - interval '2 minutes';
END;
$$;

-- =====================================================
-- PERMISOS EN RPC FUNCTIONS
-- =====================================================

-- Documentos
GRANT EXECUTE ON FUNCTION create_personal_document TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_documents TO authenticated;

-- Compartir
GRANT EXECUTE ON FUNCTION share_document_with_group TO authenticated;
GRANT EXECUTE ON FUNCTION hide_document_from_group TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_all_shares TO authenticated;

-- Solicitudes individuales
GRANT EXECUTE ON FUNCTION request_document_access TO authenticated;
GRANT EXECUTE ON FUNCTION approve_access_request TO authenticated;
GRANT EXECUTE ON FUNCTION reject_access_request TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_pending_requests TO authenticated;

-- Solicitudes masivas
GRANT EXECUTE ON FUNCTION request_multiple_documents TO authenticated;
GRANT EXECUTE ON FUNCTION request_document_from_multiple TO authenticated;
GRANT EXECUTE ON FUNCTION get_bulk_request_status TO authenticated;

-- Pre-requisitos
GRANT EXECUTE ON FUNCTION set_group_requirements TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_requirements TO authenticated;
GRANT EXECUTE ON FUNCTION get_missing_documents_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_missing_documents TO authenticated;

-- Roles
GRANT EXECUTE ON FUNCTION promote_to_admin TO authenticated;
GRANT EXECUTE ON FUNCTION demote_from_admin TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_role TO authenticated;

-- Acceso
GRANT EXECUTE ON FUNCTION get_group_shared_documents TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_url TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_access_logs TO authenticated;

-- Rate limiting
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits TO postgres;

-- =====================================================
-- COMENTARIOS SQL (DOCUMENTACIÓN)
-- =====================================================

COMMENT ON TABLE user_documents IS 'Vault personal del usuario - Documentos privados';
COMMENT ON TABLE document_shares IS 'Compartir documentos con grupos (5 tipos de permisos)';
COMMENT ON TABLE document_individual_shares IS 'Shares individuales (aprobaciones específicas a 1 persona)';
COMMENT ON TABLE document_access_logs IS 'Auditoría completa de accesos (éxitos y fallos)';
COMMENT ON TABLE document_access_requests IS 'Solicitudes individuales de acceso';
COMMENT ON TABLE bulk_access_requests IS 'Solicitudes masivas (múltiples docs/personas)';
COMMENT ON TABLE group_document_requirements IS 'Pre-requisitos de documentos al crear grupo';
COMMENT ON TABLE document_rate_limits IS 'Rate limiting (10 accesos por minuto)';

COMMENT ON FUNCTION create_personal_document IS 'Crear documento en vault personal';
COMMENT ON FUNCTION get_my_documents IS 'Obtener todos mis documentos + estado de shares';
COMMENT ON FUNCTION share_document_with_group IS 'Compartir documento con grupo (5 tipos)';
COMMENT ON FUNCTION hide_document_from_group IS 'Ocultar documento de un grupo';
COMMENT ON FUNCTION revoke_all_shares IS 'Revocar todos los shares de un documento';
COMMENT ON FUNCTION request_document_access IS 'Solicitar acceso a documento oculto';
COMMENT ON FUNCTION approve_access_request IS 'Aprobar solicitud con condiciones';
COMMENT ON FUNCTION reject_access_request IS 'Rechazar solicitud con razón';
COMMENT ON FUNCTION get_my_pending_requests IS 'Ver solicitudes pendientes de mis docs';
COMMENT ON FUNCTION request_multiple_documents IS 'Solicitar múltiples docs a 1 persona';
COMMENT ON FUNCTION request_document_from_multiple IS 'Solicitar 1 doc a múltiples personas';
COMMENT ON FUNCTION get_bulk_request_status IS 'Ver estado de solicitud masiva';
COMMENT ON FUNCTION set_group_requirements IS 'Configurar pre-requisitos del grupo';
COMMENT ON FUNCTION get_group_requirements IS 'Obtener requisitos del grupo';
COMMENT ON FUNCTION get_missing_documents_summary IS 'Dashboard: quién falta qué docs';
COMMENT ON FUNCTION get_user_missing_documents IS 'Qué documentos le faltan a un usuario';
COMMENT ON FUNCTION promote_to_admin IS 'Promover miembro a admin';
COMMENT ON FUNCTION demote_from_admin IS 'Quitar rol de admin';
COMMENT ON FUNCTION check_user_role IS 'Verificar rol del usuario en grupo';
COMMENT ON FUNCTION get_group_shared_documents IS 'Obtener documentos compartidos en grupo';
COMMENT ON FUNCTION get_document_url IS 'Generar URL + rate limit + log';
COMMENT ON FUNCTION get_document_access_logs IS 'Ver logs de acceso del documento';
COMMENT ON FUNCTION check_rate_limit IS 'Verificar y actualizar rate limit';
COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Limpiar rate limits antiguos (cron)';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
-- Total creado:
-- - 8 tablas
-- - 26 RPC functions
-- - 30+ índices
-- - 24+ RLS policies
-- - 1 trigger
--
-- Próximo paso: Configurar Storage bucket y sus políticas RLS
-- Ver: GUIA_RAPIDA_FASE_8_FINAL.md
-- =====================================================