import { supabase } from './supabase';

export interface GroupDocumentFile {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface GroupDocument {
  id: string;
  group_id: string;
  title: string;
  type: string;
  description?: string;
  tagged_users: string[]; // Array de user_ids
  created_at: string;
  updated_at: string;
  uploader: {
    id: string;
    full_name: string;
    email: string;
  };
  files: GroupDocumentFile[];
}

export async function getGroupDocuments(groupId: string): Promise<GroupDocument[]> {
  const { data, error } = await supabase.rpc('get_group_documents', {
    p_group_id: groupId,
  });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createGroupDocument(
  groupId: string,
  title: string,
  type: string,
  description: string,
  taggedUsers: string[]
): Promise<string> {
  const { data, error } = await supabase.rpc('create_group_document', {
    p_group_id: groupId,
    p_title: title,
    p_type: type,
    p_description: description || null,
    p_tagged_users: taggedUsers, // NO hacemos JSON.stringify, enviamos el array directamente
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function addGroupDocumentFile(
  groupDocumentId: string,
  storagePath: string,
  fileName: string,
  mimeType: string,
  sizeBytes: number
): Promise<void> {
  const { error } = await supabase.rpc('add_group_document_file', {
    p_group_document_id: groupDocumentId,
    p_storage_path: storagePath,
    p_file_name: fileName,
    p_mime_type: mimeType,
    p_size_bytes: sizeBytes,
  });

  if (error) throw new Error(error.message);
}

export async function updateGroupDocument(
  docId: string,
  title: string,
  description: string,
  taggedUsers: string[]
): Promise<void> {
  const { error } = await supabase.rpc('update_group_document', {
    p_doc_id: docId,
    p_title: title,
    p_description: description || null,
    p_tagged_users: taggedUsers, // NO hacemos JSON.stringify, enviamos el array directamente
  });

  if (error) throw new Error(error.message);
}

export async function deleteGroupDocument(docId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('delete_group_document', {
    p_doc_id: docId,
  });

  if (error) throw new Error(error.message);

  // Eliminar archivos de storage
  if (data?.storage_paths && data.storage_paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('group-documents')
      .remove(data.storage_paths);

    if (storageError) {
      console.error('Error eliminando archivos de storage:', storageError);
    }
  }

  return data?.storage_paths || [];
}

export async function deleteGroupDocumentFile(fileId: string): Promise<void> {
  const { data, error } = await supabase.rpc('delete_group_document_file', {
    p_file_id: fileId,
  });

  if (error) throw new Error(error.message);

  // Eliminar de storage
  if (data) {
    const { error: storageError } = await supabase.storage
      .from('group-documents')
      .remove([data]);

    if (storageError) {
      console.error('Error eliminando archivo de storage:', storageError);
    }
  }
}

export async function getGroupDocumentFileUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('group-documents')
    .createSignedUrl(storagePath, 3600); // 1 hora

  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error('No se pudo generar URL');

  return data.signedUrl;
}

export const GROUP_DOCUMENT_TYPES_ARRAY = [
  { value: 'itinerary', label: 'Itinerario', emoji: '🗺️' },
  { value: 'booking', label: 'Reserva', emoji: '🏨' },
  { value: 'ticket', label: 'Boleto/Entrada', emoji: '🎫' },
  { value: 'insurance', label: 'Seguro Grupal', emoji: '🛡️' },
  { value: 'contract', label: 'Contrato', emoji: '📜' },
  { value: 'invoice', label: 'Factura', emoji: '🧾' },
  { value: 'receipt', label: 'Recibo', emoji: '🧾' },
  { value: 'map', label: 'Mapa', emoji: '🗺️' },
  { value: 'guide', label: 'Guía', emoji: '📘' },
  { value: 'emergency', label: 'Emergencia/Contactos', emoji: '🚨' },
  { value: 'other', label: 'Otro', emoji: '📄' },
];

// Objeto para acceso rápido por tipo
export const GROUP_DOCUMENT_TYPES: Record<string, string> = {
  itinerary: 'Itinerario',
  booking: 'Reserva',
  ticket: 'Boleto/Entrada',
  insurance: 'Seguro Grupal',
  contract: 'Contrato',
  invoice: 'Factura',
  receipt: 'Recibo',
  map: 'Mapa',
  guide: 'Guía',
  emergency: 'Emergencia/Contactos',
  other: 'Otro',
};

