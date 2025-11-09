// ===================================================================
// useGroupDocuments - Hook para gestionar docs compartidos en grupo
// ===================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getGroupSharedDocuments,
  requestDocumentAccess,
} from '../services/documents.service';
import type { GroupSharedDocument } from '../types/documents.types';

export function useGroupDocuments(groupId: string) {
  const [documents, setDocuments] = useState<GroupSharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar documentos compartidos
  const loadDocuments = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);
      const docs = await getGroupSharedDocuments(groupId);
      setDocuments(docs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error loading group documents:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // Refrescar
  const refresh = useCallback(async () => {
    if (!groupId) return;

    try {
      setRefreshing(true);
      setError(null);
      const docs = await getGroupSharedDocuments(groupId);
      setDocuments(docs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, [groupId]);

  // Solicitar acceso a documento
  const requestAccess = useCallback(
    async (documentId: string, duration: string = '7d', note?: string) => {
      try {
        setError(null);
        await requestDocumentAccess(documentId, groupId, duration, note);
        // No recargamos aquí, el usuario verá el estado actualizado cuando el dueño apruebe
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al solicitar acceso';
        setError(message);
        throw err;
      }
    },
    [groupId]
  );

  // Cargar al montar o cuando cambia groupId
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    loading,
    error,
    refreshing,
    refresh,
    reload: loadDocuments,
    requestAccess,
  };
}

