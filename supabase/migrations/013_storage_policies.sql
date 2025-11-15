-- ===================================================================
-- MIGRACIÓN 013: POLÍTICAS RLS PARA STORAGE BUCKET "DOCUMENTS"
-- ===================================================================
-- Propósito: Configurar políticas de seguridad para el bucket de documentos
-- Fecha: 2024
-- ===================================================================

-- =====================================================
-- POLÍTICAS PARA STORAGE.OBJECTS (BUCKET: documents)
-- =====================================================

-- 1. POLICY: Permitir INSERT - Usuario puede subir a su propio directorio
-- Ruta: {user_id}/{document_id}/{timestamp}.{ext}
CREATE POLICY "Users can upload to own directory"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. POLICY: Permitir SELECT - Usuario puede ver sus propios archivos
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. POLICY: Permitir SELECT - Usuario puede ver archivos compartidos con él
-- NOTA: Verifica que exista un share válido en document_shares
CREATE POLICY "Users can view shared files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 
    FROM user_documents ud
    INNER JOIN document_shares ds ON ds.document_id = ud.id
    INNER JOIN group_members gm ON gm.group_id = ds.group_id
    WHERE 
      ud.storage_path = storage.objects.name
      AND gm.user_id = auth.uid()
      AND ds.is_visible = true
      AND (ds.expires_at IS NULL OR ds.expires_at > now())
  )
);

-- 4. POLICY: Permitir UPDATE - Usuario puede actualizar metadatos de sus propios archivos
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. POLICY: Permitir DELETE - Usuario puede eliminar sus propios archivos
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- VERIFICACIONES
-- =====================================================

-- Verificar que las políticas se crearon correctamente
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE 'Users can%';
  
  IF policy_count >= 5 THEN
    RAISE NOTICE '✅ Storage policies creadas correctamente (% políticas)', policy_count;
  ELSE
    RAISE WARNING '⚠️  Solo se crearon % políticas (se esperaban 5+)', policy_count;
  END IF;
END $$;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON POLICY "Users can upload to own directory" ON storage.objects 
IS 'Permite a usuarios subir archivos a su propio directorio ({user_id}/...)';

COMMENT ON POLICY "Users can view own files" ON storage.objects 
IS 'Permite a usuarios ver sus propios archivos';

COMMENT ON POLICY "Users can view shared files" ON storage.objects 
IS 'Permite ver archivos que han sido compartidos mediante document_shares';

COMMENT ON POLICY "Users can update own files" ON storage.objects 
IS 'Permite actualizar metadatos de archivos propios';

COMMENT ON POLICY "Users can delete own files" ON storage.objects 
IS 'Permite eliminar archivos propios';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

