-- ===================================================
-- ENABLE REALTIME FOR DOCUMENT SHARES
-- ===================================================
-- Permite que los clientes se suscriban a cambios en tiempo real
-- en la tabla document_shares para recibir actualizaciones automáticas
-- cuando un documento se oculta/muestra en un grupo.
-- ===================================================

-- Habilitar replicación de realtime en document_shares
ALTER PUBLICATION supabase_realtime ADD TABLE document_shares;

-- Verificar que la tabla tenga REPLICA IDENTITY
-- (necesario para que Realtime funcione correctamente)
ALTER TABLE document_shares REPLICA IDENTITY FULL;

-- Comentario para referencia
COMMENT ON TABLE document_shares IS 
'Tabla habilitada para Realtime - los cambios se transmiten automáticamente a los clientes suscritos';

