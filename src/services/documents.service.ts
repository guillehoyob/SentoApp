// ===================================================================
// DOCUMENTS SERVICE - Interactúa con el backend del Vault
// ===================================================================

import { supabase } from './supabase';
import type {
  UserDocument,
  CreateDocumentInput,
  ShareDocumentInput,
  DocumentAccessRequest,
  ApproveRequestInput,
  RequestMultipleDocsInput,
  RequestDocFromMultipleInput,
  BulkAccessRequest,
  GroupDocumentRequirement,
  SetRequirementsInput,
  MissingDocumentsSummary,
  UserMissingDocuments,
  DocumentAccessLog,
  GroupSharedDocument,
  UploadDocumentMetadata,
} from '../types/documents.types';

// ===================================================================
// GESTIÓN DE DOCUMENTOS
// ===================================================================

/**
 * Obtener todos mis documentos del vault
 */
export async function getMyDocuments(): Promise<UserDocument[]> {
  const { data, error } = await supabase.rpc('get_my_documents');

  if (error) {
    console.error('Error getting documents:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Crear un nuevo documento en el vault
 * NOTA: Primero hay que subir el archivo a Storage, luego llamar a esta función
 */
export async function createPersonalDocument(
  metadata: UploadDocumentMetadata
): Promise<UserDocument> {
  const { data, error } = await supabase.rpc('create_personal_document', {
    p_type: metadata.type,
    p_title: metadata.title,
    p_storage_path: metadata.storage_path,
    p_mime_type: metadata.mime_type,
    p_size_bytes: metadata.size_bytes,
    p_encrypted: metadata.encrypted || false,
  });

  if (error) {
    console.error('Error creating document:', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Subir archivo a Storage
 * Retorna el storage_path para usar en create_personal_document
 */
export async function uploadDocumentFile(
  file: { uri: string; name: string; type: string },
  documentId: string
): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Usuario no autenticado');

  // Generar path: documents/{userId}/{documentId}/{timestamp}-{filename}
  const timestamp = Date.now();
  const storagePath = `${user.user.id}/${documentId}/${timestamp}-${file.name}`;

  // Convertir URI a blob/file para web
  // Para React Native, necesitarás react-native-fs o similar
  const response = await fetch(file.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('documents')
    .upload(storagePath, blob, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(error.message);
  }

  return storagePath;
}

// ===================================================================
// COMPARTIR DOCUMENTOS
// ===================================================================

/**
 * Compartir documento con un grupo
 */
export async function shareDocumentWithGroup(
  input: ShareDocumentInput
): Promise<void> {
  const { error } = await supabase.rpc('share_document_with_group', {
    p_document_id: input.documentId,
    p_group_id: input.groupId,
    p_share_type: input.shareType,
    p_expires_in_days: input.expiresInDays || null,
  });

  if (error) {
    console.error('Error sharing document:', error);
    throw new Error(error.message);
  }
}

/**
 * Ocultar documento de un grupo
 */
export async function hideDocumentFromGroup(
  documentId: string,
  groupId: string
): Promise<void> {
  const { error } = await supabase.rpc('hide_document_from_group', {
    p_document_id: documentId,
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error hiding document:', error);
    throw new Error(error.message);
  }
}

/**
 * Mostrar documento de nuevo en un grupo
 */
export async function showDocumentInGroup(
  documentId: string,
  groupId: string
): Promise<void> {
  const { error } = await supabase.rpc('show_document_in_group', {
    p_document_id: documentId,
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error showing document:', error);
    throw new Error(error.message);
  }
}

/**
 * Eliminar documento completamente (BD + Storage)
 */
export async function deletePersonalDocument(documentId: string): Promise<void> {
  // Llamar RPC que elimina shares, requests y el documento de la BD
  const { data, error } = await supabase.rpc('delete_personal_document', {
    p_document_id: documentId,
  });

  if (error) {
    console.error('Error deleting document:', error);
    throw new Error(error.message);
  }

  // Eliminar archivo de Storage
  if (data?.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([data.storage_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // No lanzamos error aquí porque el documento ya se eliminó de la BD
    }
  }
}

export async function revokeAllShares(documentId: string): Promise<number> {
  const { data, error } = await supabase.rpc('revoke_all_shares', {
    p_document_id: documentId,
  });
  if (error) throw new Error(error.message);
  return data?.groups_affected || 0;
}

export async function updateDocumentFields(documentId: string, fields: Record<string, string>): Promise<void> {
  const { error } = await supabase.rpc('update_document_fields', {
    p_document_id: documentId,
    p_fields: fields,
  });
  if (error) throw new Error(error.message);
}

export async function updateDocumentInfo(documentId: string, title: string, type: string): Promise<void> {
  const { error } = await supabase.rpc('update_document_info', {
    p_document_id: documentId,
    p_title: title,
    p_type: type,
  });
  if (error) throw new Error(error.message);
}

export async function addDocumentFile(
  documentId: string,
  storagePath: string,
  fileName: string,
  mimeType: string,
  sizeBytes: number
): Promise<void> {
  const { error } = await supabase.rpc('add_document_file', {
    p_document_id: documentId,
    p_storage_path: storagePath,
    p_file_name: fileName,
    p_mime_type: mimeType,
    p_size_bytes: sizeBytes,
  });
  if (error) throw new Error(error.message);
}

export async function deleteDocumentFile(fileId: string): Promise<string> {
  const { data, error } = await supabase.rpc('delete_document_file', {
    p_file_id: fileId,
  });
  if (error) throw new Error(error.message);
  
  // Eliminar de storage
  const storagePath = data?.storage_path;
  if (storagePath) {
    await supabase.storage.from('documents').remove([storagePath]);
  }
  
  return storagePath;
}

export async function updateDocumentFileName(fileId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('document_files')
    .update({ file_name: newName })
    .eq('id', fileId);
  
  if (error) throw new Error(error.message);
}

export async function updateDocumentShare(
  shareId: string,
  permissionType?: string,
  expiresAt?: string,
  startsAt?: string
): Promise<void> {
  const { error } = await supabase.rpc('update_document_share', {
    p_share_id: shareId,
    p_permission_type: permissionType,
    p_expires_at: expiresAt,
    p_starts_at: startsAt,
  });
  if (error) throw new Error(error.message);
}

export async function deleteDocumentShare(shareId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_document_share', {
    p_share_id: shareId,
  });
  if (error) throw new Error(error.message);
}

export async function requestDocumentsFromGroup(
  groupId: string,
  docTypes: string[],
  userIds?: string[],
  message?: string
): Promise<{ requests_created: number }> {
  const { data, error } = await supabase.rpc('request_documents_from_group', {
    p_group_id: groupId,
    p_doc_types: docTypes,
    p_user_ids: userIds,
    p_message: message,
  });
  if (error) throw new Error(error.message);
  return data;
}

// ===================================================================
// SOLICITUDES INDIVIDUALES
// ===================================================================

/**
 * Solicitar acceso a un documento oculto/expirado
 */
export async function requestDocumentAccess(
  documentId: string,
  groupId: string,
  requestedDuration: string = '7d',
  note?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('request_document_access', {
    p_document_id: documentId,
    p_group_id: groupId,
    p_requested_duration: requestedDuration,
    p_note: note || null,
  });

  if (error) {
    console.error('Error requesting access:', error);
    throw new Error(error.message);
  }

  return data.request_id;
}

/**
 * Aprobar una solicitud de acceso
 */
export async function approveAccessRequest(
  input: ApproveRequestInput
): Promise<void> {
  const { error } = await supabase.rpc('approve_access_request', {
    p_request_id: input.requestId,
    p_approved_duration: input.approvedDuration,
    p_approved_for: input.approvedFor,
  });

  if (error) {
    console.error('Error approving request:', error);
    throw new Error(error.message);
  }
}

/**
 * Rechazar una solicitud de acceso
 */
export async function rejectAccessRequest(
  requestId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase.rpc('reject_access_request', {
    p_request_id: requestId,
    p_reason: reason || null,
  });

  if (error) {
    console.error('Error rejecting request:', error);
    throw new Error(error.message);
  }
}

/**
 * Obtener solicitudes pendientes de mis documentos
 */
export async function getMyPendingRequests(): Promise<DocumentAccessRequest[]> {
  const { data, error } = await supabase.rpc('get_my_pending_requests');

  if (error) {
    console.error('Error getting pending requests:', error);
    throw new Error(error.message);
  }

  return data || [];
}

// ===================================================================
// SOLICITUDES MASIVAS
// ===================================================================

/**
 * Solicitar múltiples documentos a UNA persona
 */
export async function requestMultipleDocuments(
  input: RequestMultipleDocsInput
): Promise<string> {
  const { data, error } = await supabase.rpc('request_multiple_documents', {
    p_from_user_id: input.fromUserId,
    p_group_id: input.groupId,
    p_document_types: input.documentTypes,
    p_requested_duration: input.requestedDuration || '7d',
    p_note: input.note || null,
  });

  if (error) {
    console.error('Error requesting multiple documents:', error);
    throw new Error(error.message);
  }

  return data.bulk_request_id;
}

/**
 * Solicitar UN documento a MÚLTIPLES personas
 */
export async function requestDocumentFromMultiple(
  input: RequestDocFromMultipleInput
): Promise<string> {
  const { data, error } = await supabase.rpc('request_document_from_multiple', {
    p_group_id: input.groupId,
    p_document_type: input.documentType,
    p_from_user_ids: input.fromUserIds,
    p_requested_duration: input.requestedDuration || '7d',
    p_note: input.note || null,
  });

  if (error) {
    console.error('Error requesting from multiple:', error);
    throw new Error(error.message);
  }

  return data.bulk_request_id;
}

/**
 * Obtener estado de solicitud masiva
 */
export async function getBulkRequestStatus(
  bulkRequestId: string
): Promise<BulkAccessRequest> {
  const { data, error } = await supabase.rpc('get_bulk_request_status', {
    p_bulk_request_id: bulkRequestId,
  });

  if (error) {
    console.error('Error getting bulk request status:', error);
    throw new Error(error.message);
  }

  return data;
}

// ===================================================================
// PRE-REQUISITOS DE GRUPO
// ===================================================================

/**
 * Configurar pre-requisitos de documentos para un grupo
 */
export async function setGroupRequirements(
  input: SetRequirementsInput
): Promise<void> {
  const { error } = await supabase.rpc('set_group_requirements', {
    p_group_id: input.groupId,
    p_requirements: input.requirements,
  });

  if (error) {
    console.error('Error setting requirements:', error);
    throw new Error(error.message);
  }
}

/**
 * Obtener requisitos de un grupo
 */
export async function getGroupRequirements(
  groupId: string
): Promise<GroupDocumentRequirement[]> {
  const { data, error } = await supabase.rpc('get_group_requirements', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting requirements:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Obtener resumen de documentos faltantes (dashboard para admins)
 */
export async function getMissingDocumentsSummary(
  groupId: string
): Promise<MissingDocumentsSummary> {
  const { data, error } = await supabase.rpc('get_missing_documents_summary', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting missing documents summary:', error);
    throw new Error(error.message);
  }

  return data || {};
}

/**
 * Obtener documentos faltantes de un usuario
 */
export async function getUserMissingDocuments(
  groupId: string,
  userId?: string
): Promise<UserMissingDocuments[]> {
  const { data, error } = await supabase.rpc('get_user_missing_documents', {
    p_group_id: groupId,
    p_user_id: userId || null,
  });

  if (error) {
    console.error('Error getting user missing documents:', error);
    throw new Error(error.message);
  }

  return data || [];
}

// ===================================================================
// ROLES
// ===================================================================

/**
 * Promover un miembro a admin
 */
export async function promoteToAdmin(
  groupId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('promote_to_admin', {
    p_group_id: groupId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error promoting to admin:', error);
    throw new Error(error.message);
  }
}

/**
 * Quitar rol de admin
 */
export async function demoteFromAdmin(
  groupId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('demote_from_admin', {
    p_group_id: groupId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error demoting from admin:', error);
    throw new Error(error.message);
  }
}

/**
 * Verificar rol del usuario en un grupo
 */
export async function checkUserRole(
  groupId: string,
  userId?: string
): Promise<'owner' | 'admin' | 'member' | 'none'> {
  const { data, error } = await supabase.rpc('check_user_role', {
    p_group_id: groupId,
    p_user_id: userId || null,
  });

  if (error) {
    console.error('Error checking user role:', error);
    throw new Error(error.message);
  }

  return data;
}

// ===================================================================
// ACCESO Y AUDITORÍA
// ===================================================================

/**
 * Obtener documentos compartidos en un grupo
 */
export async function getGroupSharedDocuments(
  groupId: string
): Promise<GroupSharedDocument[]> {
  const { data, error } = await supabase.rpc('get_group_shared_documents', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error getting group shared documents:', error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Obtener URL firmada para ver/descargar un documento
 * NOTA: Esta función ya incluye rate limiting y logging en el backend
 */
export async function getDocumentUrl(
  documentId: string,
  groupId: string
): Promise<string> {
  // Primero, obtener el storage_path desde el backend (con rate limiting)
  const { data: storagePath, error: rpcError } = await supabase.rpc(
    'get_document_url',
    {
      p_document_id: documentId,
      p_group_id: groupId,
    }
  );

  if (rpcError) {
    console.error('Error getting document URL:', rpcError);
    throw new Error(rpcError.message);
  }

  // Generar signed URL (válida por 60 minutos)
  const { data: signedData, error: storageError } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600); // 1 hora

  if (storageError) {
    console.error('Error creating signed URL:', storageError);
    throw new Error(storageError.message);
  }

  return signedData.signedUrl;
}

/**
 * Obtener logs de acceso de un documento
 */
export async function getDocumentAccessLogs(
  documentId: string
): Promise<DocumentAccessLog[]> {
  const { data, error } = await supabase.rpc('get_document_access_logs', {
    p_document_id: documentId,
  });

  if (error) {
    console.error('Error getting access logs:', error);
    throw new Error(error.message);
  }

  return data || [];
}

// ===================================================================
// HELPERS
// ===================================================================

/**
 * Formatear tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Verificar si un documento está expirado
 */
export function isDocumentExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Calcular días hasta expiración
 */
export function daysUntilExpiration(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Obtener label amigable para tipo de documento
 */
export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    passport: 'Pasaporte',
    id_card: 'DNI/Cédula',
    insurance: 'Seguro',
    license: 'Licencia',
    other: 'Otro',
  };
  return labels[type] || type;
}

/**
 * Obtener label amigable para tipo de permiso
 */
export function getShareTypeLabel(shareType: string): string {
  const labels: Record<string, string> = {
    permanent: 'Permanente',
    trip_linked: 'Ligado al viaje',
    temporary: 'Temporal',
    manual: 'Manual',
    scheduled: 'Programado',
  };
  return labels[shareType] || shareType;
}

export async function downloadAndOpenDocument(
  documentId: string,
  groupId: string,
  title: string
): Promise<void> {
  const WebBrowser = require('expo-web-browser');

  try {
    const signedUrl = await getDocumentUrl(documentId, groupId);
    await WebBrowser.openBrowserAsync(signedUrl);
  } catch (error) {
    throw error;
  }
}

