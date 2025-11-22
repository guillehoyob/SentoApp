import { useState, useEffect, useCallback } from 'react';
import { getGroupDocuments, GroupDocument } from '../services/groupDocuments.service';

export function useGroupDocuments(groupId: string | null) {
  const [documents, setDocuments] = useState<GroupDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDocuments = useCallback(async (isRefreshing = false) => {
    if (!groupId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const docs = await getGroupDocuments(groupId);
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading group documents:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const refresh = useCallback(() => {
    loadDocuments(true);
  }, [loadDocuments]);

  const reload = useCallback(() => {
    loadDocuments(false);
  }, [loadDocuments]);

  return {
    documents,
    loading,
    error,
    refreshing,
    refresh,
    reload,
  };
}
