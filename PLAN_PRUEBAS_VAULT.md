# PRUEBAS VAULT 8A++

## SQL (Supabase SQL Editor)
```sql
-- 1. Actualizar get_group_shared_documents
CREATE OR REPLACE FUNCTION get_group_shared_documents(p_group_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT 
        ud.id, ud.title, ud.type, ud.owner_id, ud.fields,
        ds.share_type, ds.is_visible, ds.expires_at, ds.shared_at,
        p.full_name as owner_name,
        (SELECT json_agg(json_build_object(
          'id', df.id, 'storage_path', df.storage_path, 'file_name', df.file_name,
          'mime_type', df.mime_type, 'size_bytes', df.size_bytes
        ) ORDER BY df.file_order)
        FROM document_files df WHERE df.document_id = ud.id) AS files
      FROM document_shares ds
      JOIN user_documents ud ON ds.document_id = ud.id
      JOIN profiles p ON ud.owner_id = p.id
      WHERE ds.group_id = p_group_id
        AND ds.is_visible = true
        AND (ds.expires_at IS NULL OR ds.expires_at > now())
        AND EXISTS(SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = auth.uid())
      ORDER BY ds.shared_at DESC
    ) t
  );
END;$$;
```

## SQL ANTERIOR
```sql
ALTER TABLE user_documents ADD COLUMN IF NOT EXISTS fields jsonb DEFAULT '{}';

CREATE OR REPLACE FUNCTION update_document_fields(p_document_id uuid, p_fields jsonb)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM user_documents WHERE id = p_document_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'No owner';
  END IF;
  UPDATE user_documents SET fields = p_fields WHERE id = p_document_id;
  RETURN json_build_object('success', true);
END;$$;

CREATE OR REPLACE FUNCTION update_document_info(p_document_id uuid, p_title text, p_type text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM user_documents WHERE id = p_document_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'No owner';
  END IF;
  UPDATE user_documents SET title = p_title, type = p_type WHERE id = p_document_id;
  RETURN json_build_object('success', true);
END;$$;
```

## APP
1. **Subir** → Mi Vault → + → subir PDF pasaporte
2. **Expandir** → tap doc → debe mostrar: grupos + campos (vacíos) + 1 archivo
3. **Editar** → "✏️ Editar Todo" → llenar campos (Número: 123, Fecha Exp: 2025, etc) → Guardar
4. **Verificar campos** → expandir doc → campos llenos + 📋 botón copiar
5. **Copiar campo** → tap 📋 → "Copiado"
6. **Añadir archivo** → "✏️ Editar" → "+" → subir 2º PDF → Guardar
7. **Ver archivos** → expandir → debe haber 2 archivos → tap uno → abre navegador
8. **Compartir** → "Compartir" → grupo + permanente → Confirmar
9. **En grupo** → grupo → "Documentos Compartidos" → ver campos llenos + 2 archivos + copiard
10. **Ocultar** → vault → "👁️‍🗨️ Ocultar" → confirmar → badge "Oculto"
11. **Eliminar** → "🗑️ Eliminar" → confirmar → desaparece todo

## RESULTADO
✅ Todo OK → enviar "OK"
❌ Error → copiar mensaje exacto
