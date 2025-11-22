// ===================================================================
// useAccessRequests - Hook para gestionar solicitudes de acceso
// ===================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getMyPendingRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from '../services/documents.service';
import type {
  DocumentAccessRequest,
  ApproveRequestInput,
} from '../types/documents.types';

export function useAccessRequests() {
  const [requests, setRequests] = useState<DocumentAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar solicitudes pendientes
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyPendingRequests();
      setRequests(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Aprobar solicitud
  const approveRequest = useCallback(
    async (input: ApproveRequestInput) => {
      try {
        setError(null);
        await approveAccessRequest(input);
        await loadRequests(); // Recargar lista
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al aprobar';
        setError(message);
        throw err;
      }
    },
    [loadRequests]
  );

  // Rechazar solicitud
  const rejectRequest = useCallback(
    async (requestId: string, reason?: string) => {
      try {
        setError(null);
        await rejectAccessRequest(requestId, reason);
        await loadRequests(); // Recargar lista
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al rechazar';
        setError(message);
        throw err;
      }
    },
    [loadRequests]
  );

  // Cargar al montar
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return {
    requests,
    loading,
    error,
    reload: loadRequests,
    approveRequest,
    rejectRequest,
    pendingCount: requests.length,
  };
}

