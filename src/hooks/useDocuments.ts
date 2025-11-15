// ===================================================================
// useDocuments - Hook para gestionar documentos del vault
// ===================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getMyDocuments,
  shareDocumentWithGroup,
  hideDocumentFromGroup,
  revokeAllShares,
} from '../services/documents.service';
import type { UserDocument, ShareDocumentInput } from '../types/documents.types';

export function useDocuments() {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar documentos
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await getMyDocuments();
      setDocuments(docs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refrescar (pull-to-refresh)
  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const docs = await getMyDocuments();
      setDocuments(docs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Compartir documento
  const shareDocument = useCallback(
    async (input: ShareDocumentInput) => {
      try {
        setError(null);
        await shareDocumentWithGroup(input);
        // Recargar para actualizar el estado de shares
        await loadDocuments();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al compartir';
        setError(message);
        throw err;
      }
    },
    [loadDocuments]
  );

  // Ocultar documento de un grupo
  const hideDocument = useCallback(
    async (documentId: string, groupId: string) => {
      try {
        setError(null);
        await hideDocumentFromGroup(documentId, groupId);
        await loadDocuments();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al ocultar';
        setError(message);
        throw err;
      }
    },
    [loadDocuments]
  );

  // Revocar todos los shares
  const revokeShares = useCallback(
    async (documentId: string) => {
      try {
        setError(null);
        const count = await revokeAllShares(documentId);
        await loadDocuments();
        return count;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al revocar';
        setError(message);
        throw err;
      }
    },
    [loadDocuments]
  );

  // Cargar al montar
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
    shareDocument,
    hideDocument,
    revokeShares,
  };
}

