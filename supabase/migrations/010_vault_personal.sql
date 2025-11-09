-- =====================================================
-- FASE 8: VAULT SEGURO (B+) - DOCUMENTOS CON AUDITORÍA MEJORADA
-- =====================================================
-- Esta migración implementa el sistema de documentos personales
-- con control de privacidad, auditoría mejorada y compliance GDPR básico.
--
-- ARQUITECTURA:
-- 1. user_documents → Documentos personales del usuario
-- 2. document_shares → Control de compartir con grupos + PERMISOS TEMPORALES
-- 3. document_access_logs → Auditoría mejorada (metadata, intentos fallidos)
-- 4. document_rate_limits → Rate limiting (anti-spam)
-- 5. Storage: documents/personal/USER_ID/DOC_ID/file.pdf
--
-- MEJORAS B+ vs B:
-- ✅ Permisos temporales (expires_at)
-- ✅ Rate limiting (máx 10 accesos/minuto)
-- ✅ Metadata de accesos (IP, user agent)
-- ✅ Log de intentos fallidos
--
-- FILOSOFÍA:
-- - Por defecto: TODO privado
-- - Usuario decide qué compartir y con quién
-- - Permisos pueden expirar automáticamente
-- - Puede revocar acceso en cualquier momento
-- - Auditoría completa de accesos + intentos fallidos
-- - Rate limiting para evitar spam/scraping
-- =====================================================

-- =====================================================
-- TABLA: user_documents
-- =====================================================
-- Documentos personales del usuario (Vault)
-- Cada usuario tiene su propio "vault" privado
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
-- TABLA: document_shares
-- =====================================================
-- Control de compartir documentos con grupos
-- El usuario decide qué docs compartir con qué grupos
-- MEJORA B+: Permisos temporales con expires_at
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_visible boolean DEFAULT true,
  expires_at timestamptz, -- ⭐ NUEVO: Permiso temporal (NULL = sin expiración)
  shared_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(document_id, group_id)
);

-- =====================================================
-- TABLA: document_access_logs
-- =====================================================
-- Auditoría mejorada de accesos a documentos
-- Registra quién vio/descargó cada documento + intentos fallidos
-- MEJORA B+: success, error_reason, metadata
CREATE TABLE IF NOT EXISTS document_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('view', 'download', 'share', 'hide', 'revoke', 'denied')),
  success boolean DEFAULT true, -- ⭐ NUEVO: false si el acceso fue denegado
  error_reason text, -- ⭐ NUEVO: razón del fallo (expired, not_shared, rate_limited)
  metadata jsonb, -- ⭐ NUEVO: {ip, user_agent, referer, etc.}
  accessed_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: document_rate_limits
-- =====================================================
-- Rate limiting para evitar spam/scraping
-- MEJORA B+: Límite de 10 accesos por minuto por usuario
CREATE TABLE IF NOT EXISTS document_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  access_count integer DEFAULT 1,
  UNIQUE(user_id, window_start)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Búsqueda rápida de documentos por usuario
CREATE INDEX IF NOT EXISTS user_documents_owner_id_idx 
ON user_documents(owner_id);

-- Búsqueda rápida de documentos por tipo
CREATE INDEX IF NOT EXISTS user_documents_type_idx 
ON user_documents(type);

-- Búsqueda rápida de shares por grupo
CREATE INDEX IF NOT EXISTS document_shares_group_id_idx 
ON document_shares(group_id);

-- Búsqueda rápida de shares por documento
CREATE INDEX IF NOT EXISTS document_shares_document_id_idx 
ON document_shares(document_id);

-- Búsqueda rápida de logs por documento
CREATE INDEX IF NOT EXISTS document_access_logs_document_id_idx 
ON document_access_logs(document_id);

-- Búsqueda rápida de logs por fecha
CREATE INDEX IF NOT EXISTS document_access_logs_accessed_at_idx 
ON document_access_logs(accessed_at DESC);

-- ⭐ NUEVO: Índice para logs de intentos fallidos
CREATE INDEX IF NOT EXISTS document_access_logs_success_idx 
ON document_access_logs(success) WHERE success = false;

-- ⭐ NUEVO: Índice para metadata de logs (JSONB)
CREATE INDEX IF NOT EXISTS document_access_logs_metadata_idx 
ON document_access_logs USING gin(metadata);

-- ⭐ NUEVO: Índice para expiración de shares
CREATE INDEX IF NOT EXISTS document_shares_expires_at_idx 
ON document_shares(expires_at) WHERE expires_at IS NOT NULL;

-- ⭐ NUEVO: Índice para rate limiting
CREATE INDEX IF NOT EXISTS document_rate_limits_window_start_idx 
ON document_rate_limits(user_id, window_start DESC);

-- =====================================================
-- RLS: HABILITAR
-- =====================================================

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_rate_limits ENABLE ROW LEVEL SECURITY; -- ⭐ NUEVO

-- =====================================================
-- RLS POLICY: user_documents - SELECT
-- =====================================================
-- Solo el dueño puede ver sus propios documentos
CREATE POLICY "Ver propios documentos"
ON user_documents
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- =====================================================
-- RLS POLICY: user_documents - INSERT
-- =====================================================
-- Cualquier usuario autenticado puede crear documentos
CREATE POLICY "Crear propios documentos"
ON user_documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- RLS POLICY: user_documents - UPDATE
-- =====================================================
-- Solo el dueño puede actualizar sus documentos
CREATE POLICY "Actualizar propios documentos"
ON user_documents
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- =====================================================
-- RLS POLICY: user_documents - DELETE
-- =====================================================
-- Solo el dueño puede eliminar sus documentos
CREATE POLICY "Eliminar propios documentos"
ON user_documents
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- =====================================================
-- RLS POLICY: document_shares - SELECT
-- =====================================================
-- Puedes ver shares si:
-- 1. Eres el dueño del documento
-- 2. O eres miembro del grupo donde está compartido
CREATE POLICY "Ver shares propios o de tu grupo"
ON document_shares
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_shares.document_id
  )
  OR
  auth.uid() IN (
    SELECT user_id FROM group_members WHERE group_id = document_shares.group_id
  )
);

-- =====================================================
-- RLS POLICY: document_shares - INSERT
-- =====================================================
-- Solo el dueño del documento puede compartirlo
CREATE POLICY "Compartir propios documentos"
ON document_shares
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_shares.document_id
  )
  AND
  shared_by = auth.uid()
);

-- =====================================================
-- RLS POLICY: document_shares - UPDATE
-- =====================================================
-- Solo el dueño puede actualizar shares (ocultar/mostrar)
CREATE POLICY "Actualizar shares propios"
ON document_shares
FOR UPDATE
TO authenticated
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

-- =====================================================
-- RLS POLICY: document_shares - DELETE
-- =====================================================
-- Solo el dueño puede revocar shares
CREATE POLICY "Revocar shares propios"
ON document_shares
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_shares.document_id
  )
);

-- =====================================================
-- RLS POLICY: document_access_logs - SELECT
-- =====================================================
-- Puedes ver logs si eres el dueño del documento
CREATE POLICY "Ver logs de propios documentos"
ON document_access_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT owner_id FROM user_documents WHERE id = document_access_logs.document_id
  )
);

-- =====================================================
-- RLS POLICY: document_access_logs - INSERT
-- =====================================================
-- Cualquiera puede crear logs (se usan en RPC functions)
CREATE POLICY "Crear logs de acceso"
ON document_access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- RLS POLICY: document_rate_limits - SELECT
-- =====================================================
-- Solo puedes ver tus propios rate limits
CREATE POLICY "Ver propios rate limits"
ON document_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICY: document_rate_limits - INSERT/UPDATE
-- =====================================================
-- Sistema puede crear/actualizar rate limits (SECURITY DEFINER)
CREATE POLICY "Sistema gestiona rate limits"
ON document_rate_limits
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- TRIGGER: Actualizar updated_at en document_shares
-- =====================================================

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
-- RPC FUNCTION: check_rate_limit (HELPER)
-- =====================================================
-- Verifica rate limiting: máx 10 accesos por minuto
-- MEJORA B+: Anti-spam y anti-scraping
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count integer;
  v_limit integer := 10; -- Máximo 10 accesos por minuto
BEGIN
  -- Redondear al minuto actual
  v_window_start := date_trunc('minute', now());

  -- Obtener contador actual
  SELECT access_count INTO v_current_count
  FROM document_rate_limits
  WHERE user_id = p_user_id
    AND window_start = v_window_start;

  -- Si no existe, crear
  IF v_current_count IS NULL THEN
    INSERT INTO document_rate_limits (user_id, window_start, access_count)
    VALUES (p_user_id, v_window_start, 1);
    RETURN true;
  END IF;

  -- Si excede el límite
  IF v_current_count >= v_limit THEN
    RETURN false;
  END IF;

  -- Incrementar contador
  UPDATE document_rate_limits
  SET access_count = access_count + 1
  WHERE user_id = p_user_id
    AND window_start = v_window_start;

  RETURN true;
END;
$$;

-- =====================================================
-- RPC FUNCTION: create_personal_document
-- =====================================================
-- Crea un documento en el vault personal del usuario
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
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Crear el documento
  INSERT INTO user_documents (
    owner_id,
    type,
    title,
    storage_path,
    encrypted,
    mime_type,
    size_bytes
  )
  VALUES (
    v_user_id,
    p_type,
    p_title,
    p_storage_path,
    p_encrypted,
    p_mime_type,
    p_size_bytes
  )
  RETURNING id INTO v_document_id;

  -- Retornar el documento
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

-- =====================================================
-- RPC FUNCTION: share_document_with_group
-- =====================================================
-- Comparte un documento personal con un grupo
-- MEJORA B+: Soporte para expires_at (permisos temporales)
CREATE OR REPLACE FUNCTION share_document_with_group(
  p_document_id uuid,
  p_group_id uuid,
  p_expires_in_days integer DEFAULT NULL -- ⭐ NUEVO: NULL = sin expiración
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
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que el usuario es dueño del documento
  SELECT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id
      AND owner_id = v_user_id
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'No eres el dueño de este documento';
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

  -- Calcular expiración si se especificó
  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := now() + (p_expires_in_days || ' days')::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  -- Crear o actualizar el share
  INSERT INTO document_shares (
    document_id,
    group_id,
    shared_by,
    is_visible,
    expires_at
  )
  VALUES (
    p_document_id,
    p_group_id,
    v_user_id,
    true,
    v_expires_at
  )
  ON CONFLICT (document_id, group_id)
  DO UPDATE SET
    is_visible = true,
    expires_at = v_expires_at,
    updated_at = now()
  RETURNING id INTO v_share_id;

  -- Crear log de auditoría
  INSERT INTO document_access_logs (
    document_id,
    accessed_by,
    group_id,
    action,
    success,
    metadata
  )
  VALUES (
    p_document_id,
    v_user_id,
    p_group_id,
    'share',
    true,
    json_build_object('expires_at', v_expires_at)::jsonb
  );

  -- Retornar el share
  RETURN (
    SELECT json_build_object(
      'id', ds.id,
      'document_id', ds.document_id,
      'group_id', ds.group_id,
      'shared_by', ds.shared_by,
      'is_visible', ds.is_visible,
      'expires_at', ds.expires_at,
      'shared_at', ds.shared_at,
      'updated_at', ds.updated_at
    )
    FROM document_shares ds
    WHERE ds.id = v_share_id
  );
END;
$$;

-- =====================================================
-- RPC FUNCTION: hide_document_from_group
-- =====================================================
-- Oculta un documento de un grupo (sin eliminarlo)
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
  v_is_owner boolean;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que el usuario es dueño del documento
  SELECT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id
      AND owner_id = v_user_id
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'No eres el dueño de este documento';
  END IF;

  -- Actualizar el share a invisible
  UPDATE document_shares
  SET is_visible = false,
      updated_at = now()
  WHERE document_id = p_document_id
    AND group_id = p_group_id;

  -- Crear log de auditoría
  INSERT INTO document_access_logs (
    document_id,
    accessed_by,
    group_id,
    action
  )
  VALUES (
    p_document_id,
    v_user_id,
    p_group_id,
    'hide'
  );

  -- Retornar confirmación
  RETURN json_build_object(
    'success', true,
    'message', 'Documento ocultado del grupo'
  );
END;
$$;

-- =====================================================
-- RPC FUNCTION: get_my_documents
-- =====================================================
-- Obtiene todos los documentos personales del usuario
-- con info de en qué grupos están compartidos
CREATE OR REPLACE FUNCTION get_my_documents()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Retornar documentos con shares
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
              'expires_at', ds.expires_at, -- ⭐ NUEVO
              'shared_at', ds.shared_at
            )
          )
          FROM document_shares ds
          JOIN groups g ON g.id = ds.group_id
          WHERE ds.document_id = ud.id
        ),
        'access_count', (
          SELECT COUNT(*)
          FROM document_access_logs dal
          WHERE dal.document_id = ud.id
            AND dal.action = 'view'
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
-- RPC FUNCTION: get_group_shared_documents
-- =====================================================
-- Obtiene documentos que miembros han compartido con el grupo
-- Solo visibles para miembros del grupo
-- MEJORA B+: Filtra documentos expirados
CREATE OR REPLACE FUNCTION get_group_shared_documents(p_group_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
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

  -- Retornar documentos compartidos y visibles (no expirados)
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', ud.id,
        'owner_id', ud.owner_id,
        'type', ud.type,
        'title', ud.title,
        'encrypted', ud.encrypted,
        'mime_type', ud.mime_type,
        'size_bytes', ud.size_bytes,
        'shared_at', ds.shared_at,
        'expires_at', ds.expires_at, -- ⭐ NUEVO
        'owner', (
          SELECT json_build_object(
            'id', p.id,
            'email', p.email,
            'full_name', p.full_name
          )
          FROM profiles p
          WHERE p.id = ud.owner_id
        ),
        'is_own', ud.owner_id = v_user_id
      )
    )
    FROM document_shares ds
    JOIN user_documents ud ON ud.id = ds.document_id
    WHERE ds.group_id = p_group_id
      AND ds.is_visible = true
      AND (ds.expires_at IS NULL OR ds.expires_at > now()) -- ⭐ NUEVO: Filtrar expirados
    ORDER BY ds.shared_at DESC
  );
END;
$$;

-- =====================================================
-- RPC FUNCTION: get_document_url
-- =====================================================
-- Genera signed URL y registra el acceso
-- Verifica permisos: debe ser miembro del grupo donde está compartido
-- MEJORA B+: Rate limiting + verificación de expiración + metadata
CREATE OR REPLACE FUNCTION get_document_url(
  p_document_id uuid,
  p_group_id uuid,
  p_metadata jsonb DEFAULT NULL -- ⭐ NUEVO: {ip, user_agent, referer}
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_shared boolean;
  v_is_member boolean;
  v_is_expired boolean;
  v_expires_at timestamptz;
  v_storage_path text;
  v_rate_limit_ok boolean;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    -- Log de intento fallido
    INSERT INTO document_access_logs (
      document_id, accessed_by, group_id, action, success, error_reason
    ) VALUES (
      p_document_id, v_user_id, p_group_id, 'denied', false, 'not_authenticated'
    );
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- ⭐ NUEVO: Verificar rate limiting
  SELECT check_rate_limit(v_user_id) INTO v_rate_limit_ok;
  
  IF NOT v_rate_limit_ok THEN
    -- Log de intento fallido por rate limit
    INSERT INTO document_access_logs (
      document_id, accessed_by, group_id, action, success, error_reason, metadata
    ) VALUES (
      p_document_id, v_user_id, p_group_id, 'denied', false, 'rate_limited', p_metadata
    );
    RAISE EXCEPTION 'Demasiados intentos. Espera un momento.';
  END IF;

  -- Verificar que el usuario es miembro del grupo
  SELECT EXISTS(
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
      AND user_id = v_user_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    -- Log de intento fallido
    INSERT INTO document_access_logs (
      document_id, accessed_by, group_id, action, success, error_reason, metadata
    ) VALUES (
      p_document_id, v_user_id, p_group_id, 'denied', false, 'not_member', p_metadata
    );
    RAISE EXCEPTION 'No eres miembro de este grupo';
  END IF;

  -- ⭐ NUEVO: Verificar que el documento está compartido, visible Y no expirado
  SELECT 
    EXISTS(
      SELECT 1 FROM document_shares
      WHERE document_id = p_document_id
        AND group_id = p_group_id
        AND is_visible = true
        AND (expires_at IS NULL OR expires_at > now())
    ),
    (
      SELECT expires_at FROM document_shares
      WHERE document_id = p_document_id
        AND group_id = p_group_id
    )
  INTO v_is_shared, v_expires_at;

  -- Verificar expiración
  IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
    -- Log de intento fallido por expiración
    INSERT INTO document_access_logs (
      document_id, accessed_by, group_id, action, success, error_reason, metadata
    ) VALUES (
      p_document_id, v_user_id, p_group_id, 'denied', false, 'expired', p_metadata
    );
    RAISE EXCEPTION 'Este permiso ha expirado';
  END IF;

  IF NOT v_is_shared THEN
    -- Log de intento fallido
    INSERT INTO document_access_logs (
      document_id, accessed_by, group_id, action, success, error_reason, metadata
    ) VALUES (
      p_document_id, v_user_id, p_group_id, 'denied', false, 'not_shared', p_metadata
    );
    RAISE EXCEPTION 'Este documento no está compartido en este grupo';
  END IF;

  -- Obtener storage_path
  SELECT storage_path INTO v_storage_path
  FROM user_documents
  WHERE id = p_document_id;

  -- ⭐ NUEVO: Crear log de acceso exitoso con metadata
  INSERT INTO document_access_logs (
    document_id,
    accessed_by,
    group_id,
    action,
    success,
    metadata
  )
  VALUES (
    p_document_id,
    v_user_id,
    p_group_id,
    'view',
    true,
    p_metadata
  );

  -- Retornar el storage_path para que el cliente genere la signed URL
  -- (No podemos generar signed URL desde SQL, se hace en el cliente)
  RETURN json_build_object(
    'storage_path', v_storage_path,
    'document_id', p_document_id,
    'expires_at', v_expires_at
  );
END;
$$;

-- =====================================================
-- RPC FUNCTION: get_document_access_logs
-- =====================================================
-- Obtiene el historial de accesos de un documento
-- Solo el dueño puede ver los logs
-- MEJORA B+: Incluye success, error_reason, metadata
CREATE OR REPLACE FUNCTION get_document_access_logs(p_document_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_owner boolean;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que el usuario es dueño del documento
  SELECT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id
      AND owner_id = v_user_id
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'No eres el dueño de este documento';
  END IF;

  -- Retornar logs con nuevos campos
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', dal.id,
        'action', dal.action,
        'success', dal.success, -- ⭐ NUEVO
        'error_reason', dal.error_reason, -- ⭐ NUEVO
        'metadata', dal.metadata, -- ⭐ NUEVO
        'accessed_at', dal.accessed_at,
        'accessed_by', (
          SELECT json_build_object(
            'id', p.id,
            'email', p.email,
            'full_name', p.full_name
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
  );
END;
$$;

-- =====================================================
-- RPC FUNCTION: revoke_all_shares
-- =====================================================
-- Oculta un documento de TODOS los grupos
-- (Revocación masiva)
CREATE OR REPLACE FUNCTION revoke_all_shares(p_document_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_owner boolean;
  v_affected_count integer;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Verificar que el usuario es dueño del documento
  SELECT EXISTS(
    SELECT 1 FROM user_documents
    WHERE id = p_document_id
      AND owner_id = v_user_id
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'No eres el dueño de este documento';
  END IF;

  -- Ocultar de todos los grupos
  UPDATE document_shares
  SET is_visible = false,
      updated_at = now()
  WHERE document_id = p_document_id
    AND is_visible = true;

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  -- Crear log de auditoría
  INSERT INTO document_access_logs (
    document_id,
    accessed_by,
    group_id,
    action
  )
  VALUES (
    p_document_id,
    v_user_id,
    NULL,
    'revoke'
  );

  -- Retornar confirmación
  RETURN json_build_object(
    'success', true,
    'message', 'Documento revocado de todos los grupos',
    'groups_affected', v_affected_count
  );
END;
$$;

-- =====================================================
-- RPC FUNCTION: cleanup_old_rate_limits (CRON)
-- =====================================================
-- Limpia rate limits antiguos (más de 1 hora)
-- Se ejecutará automáticamente cada hora (pg_cron)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM document_rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- =====================================================
-- PERMISOS
-- =====================================================

GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated; -- ⭐ NUEVO
GRANT EXECUTE ON FUNCTION create_personal_document TO authenticated;
GRANT EXECUTE ON FUNCTION share_document_with_group TO authenticated;
GRANT EXECUTE ON FUNCTION hide_document_from_group TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_documents TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_shared_documents TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_url TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_access_logs TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_all_shares TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits TO postgres; -- Solo sistema

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE user_documents IS 'Vault personal: documentos privados del usuario';
COMMENT ON TABLE document_shares IS 'Control de compartir documentos con grupos + permisos temporales (B+)';
COMMENT ON TABLE document_access_logs IS 'Auditoría mejorada: historial de accesos + intentos fallidos + metadata (B+)';
COMMENT ON TABLE document_rate_limits IS 'Rate limiting: máx 10 accesos/minuto por usuario (B+)';

COMMENT ON FUNCTION check_rate_limit IS 'Verifica rate limiting (anti-spam)';
COMMENT ON FUNCTION create_personal_document IS 'Crea un documento en el vault personal';
COMMENT ON FUNCTION share_document_with_group IS 'Comparte documento con grupo (soporte expires_at)';
COMMENT ON FUNCTION hide_document_from_group IS 'Oculta un documento de un grupo';
COMMENT ON FUNCTION get_my_documents IS 'Obtiene todos los documentos personales del usuario';
COMMENT ON FUNCTION get_group_shared_documents IS 'Obtiene docs compartidos en grupo (filtra expirados)';
COMMENT ON FUNCTION get_document_url IS 'Genera URL + verifica rate limit + registra acceso con metadata';
COMMENT ON FUNCTION get_document_access_logs IS 'Obtiene historial completo (exitosos + fallidos)';
COMMENT ON FUNCTION revoke_all_shares IS 'Revoca acceso de todos los grupos';
COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Limpia rate limits antiguos (cron cada hora)';

-- =====================================================
-- FIN DE MIGRACIÓN - VAULT SEGURO (B+)
-- =====================================================
-- 
-- RESUMEN DE MEJORAS B+ vs B:
-- ✅ Permisos temporales (expires_at)
-- ✅ Rate limiting (10 accesos/min)
-- ✅ Metadata en logs (IP, user agent)
-- ✅ Log de intentos fallidos
-- ✅ Filtrado automático de expirados
-- 
-- LISTO PARA: Desarrollo y beta testing
-- PRÓXIMO PASO: Frontend (Fase 9)
-- UPGRADE A C+++: Antes de lanzamiento público
-- =====================================================

