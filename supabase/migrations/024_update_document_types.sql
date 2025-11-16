-- Actualizar constraint de tipos de documento para incluir DNI/NIE/TIE/etc
ALTER TABLE user_documents DROP CONSTRAINT IF EXISTS user_documents_type_check;

ALTER TABLE user_documents ADD CONSTRAINT user_documents_type_check 
CHECK (type IN (
  -- Tipos antiguos (mantener compatibilidad)
  'passport', 'id_card', 'insurance', 'license', 'other',
  -- Tarjetas de identidad
  'DNI', 'NIE', 'TIE',
  -- Otros documentos específicos
  'health', 'driving', 'financial', 'education', 'professional', 
  'travel', 'legal', 'property', 'identification'
));

