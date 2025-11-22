# SQL PARA LOGS

**Ejecuta en Supabase SQL Editor:**

```sql
CREATE OR REPLACE FUNCTION get_my_document_access_logs(p_limit integer DEFAULT 50)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT 
        dal.id,
        ud.title as document_title,
        ud.type as document_type,
        p.full_name as accessed_by_name,
        dal.accessed_at,
        g.name as group_name,
        dal.success
      FROM document_access_logs dal
      JOIN user_documents ud ON dal.document_id = ud.id
      JOIN profiles p ON dal.user_id = p.id
      LEFT JOIN groups g ON dal.group_id = g.id
      WHERE ud.owner_id = auth.uid()
      ORDER BY dal.accessed_at DESC
      LIMIT p_limit
    ) t
  );
END;$$;
```

Después → app → vault → "📊 Ver logs de acceso"

