// ===================================================================
// TIPOS DE DOCUMENTOS DEL VAULT
// ===================================================================

export type DocumentType = 'passport' | 'id_card' | 'insurance' | 'license' | 'other';

export type ShareType = 'permanent' | 'trip_linked' | 'temporary' | 'manual' | 'scheduled';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type BulkRequestType = 'multiple_docs_one_user' | 'one_doc_multiple_users';

export type BulkRequestStatus = 'pending' | 'partial' | 'completed' | 'cancelled';

export type DocumentAction =
  | 'view'
  | 'download'
  | 'share'
  | 'hide'
  | 'revoke'
  | 'denied'
  | 'request_sent'
  | 'request_approved'
  | 'request_rejected';

// ===================================================================
// DOCUMENTO PERSONAL
// ===================================================================

export interface UserDocument {
  id: string;
  owner_id: string;
  type: DocumentType;
  title: string;
  storage_path: string;
  encrypted: boolean;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  // Incluye información de shares (del backend)
  shared_in?: DocumentShareInfo[];
}

export interface DocumentShareInfo {
  group_id: string;
  group_name: string;
  is_visible: boolean;
  share_type: ShareType;
  expires_at: string | null;
  shared_at: string;
}

// ===================================================================
// COMPARTIR DOCUMENTO
// ===================================================================

export interface DocumentShare {
  id: string;
  document_id: string;
  group_id: string;
  shared_by: string;
  share_type: ShareType;
  is_visible: boolean;
  expires_at: string | null;
  activate_at: string | null;
  auto_activate_on_trip_start: boolean;
  shared_at: string;
  updated_at: string;
}

export interface ShareDocumentInput {
  documentId: string;
  groupId: string;
  shareType: ShareType;
  expiresInDays?: number;
  activateAt?: string;
  autoActivateOnTripStart?: boolean;
}

// ===================================================================
// SOLICITUDES DE ACCESO
// ===================================================================

export interface DocumentAccessRequest {
  id: string;
  document: {
    id: string;
    title: string;
    type: DocumentType;
  };
  requester: {
    id: string;
    full_name: string;
    email: string;
  };
  group: {
    id: string;
    name: string;
  };
  requested_duration: string;
  note: string | null;
  created_at: string;
}

export interface ApproveRequestInput {
  requestId: string;
  approvedDuration: string; // '7d', '30d', 'permanent'
  approvedFor: 'requester_only' | 'whole_group';
}

// ===================================================================
// SOLICITUDES MASIVAS
// ===================================================================

export interface BulkAccessRequest {
  id: string;
  request_type: BulkRequestType;
  total_count: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  status: BulkRequestStatus;
  details: BulkRequestDetail[];
}

export interface BulkRequestDetail {
  document: {
    id: string;
    title: string;
    type: DocumentType;
    owner: {
      id: string;
      full_name: string;
      email: string;
    };
  };
  status: RequestStatus;
  approved_at: string | null;
  rejected_reason: string | null;
}

export interface RequestMultipleDocsInput {
  fromUserId: string;
  groupId: string;
  documentTypes: DocumentType[];
  requestedDuration?: string;
  note?: string;
}

export interface RequestDocFromMultipleInput {
  groupId: string;
  documentType: DocumentType;
  fromUserIds: string[];
  requestedDuration?: string;
  note?: string;
}

// ===================================================================
// PRE-REQUISITOS DE GRUPO
// ===================================================================

export interface GroupDocumentRequirement {
  id: string;
  document_type: DocumentType;
  is_required: boolean;
  visibility: 'admins_only' | 'all_members';
}

export interface SetRequirementsInput {
  groupId: string;
  requirements: Array<{
    type: DocumentType;
    required: boolean;
    visibility: 'admins_only' | 'all_members';
  }>;
}

export interface MissingDocumentsSummary {
  [documentType: string]: {
    required: number;
    completed: number;
    missing: number;
    missing_users: Array<{
      id: string;
      full_name: string;
      email: string;
    }>;
  };
}

export interface UserMissingDocuments {
  type: DocumentType;
  required: boolean;
  user_has_it: boolean;
  is_shared: boolean;
}

// ===================================================================
// LOGS DE ACCESO
// ===================================================================

export interface DocumentAccessLog {
  id: string;
  action: DocumentAction;
  success: boolean;
  error_reason: string | null;
  accessed_at: string;
  accessor: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  group: {
    id: string;
    name: string;
  } | null;
}

// ===================================================================
// DOCUMENTOS COMPARTIDOS EN GRUPO
// ===================================================================

export interface GroupSharedDocument {
  id: string;
  type: DocumentType;
  title: string;
  mime_type: string;
  size_bytes: number;
  owner: {
    id: string;
    full_name: string;
    email: string;
  };
  share_type: ShareType;
  is_visible: boolean;
  expires_at: string | null;
  shared_at: string;
  can_access: boolean;
}

// ===================================================================
// INPUTS PARA CREAR DOCUMENTO
// ===================================================================

export interface CreateDocumentInput {
  type: DocumentType;
  title: string;
  file: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface UploadDocumentMetadata {
  type: DocumentType;
  title: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  encrypted?: boolean;
}

