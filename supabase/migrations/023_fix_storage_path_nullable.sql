-- Hacer storage_path opcional (ahora usamos document_files)
ALTER TABLE user_documents ALTER COLUMN storage_path DROP NOT NULL;
ALTER TABLE user_documents ALTER COLUMN mime_type DROP NOT NULL;
ALTER TABLE user_documents ALTER COLUMN size_bytes DROP NOT NULL;

