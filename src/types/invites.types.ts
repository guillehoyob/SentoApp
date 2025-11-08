// =====================================================
// TIPOS: Invitaciones
// =====================================================

/**
 * Información de una invitación generada
 */
export interface Invitation {
  url: string;          // Deep link: sento://invite/xxx?t=yyy
  expires_at: string;   // ISO timestamp
  token: string;        // JWT token
  group_id: string;     // ID del grupo
}

/**
 * Estado de decodificación de un token
 */
export interface DecodedInviteToken {
  groupId: string;
  expiresAt: number;    // Unix timestamp
  expired: boolean;
}

