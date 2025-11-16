import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

interface SharedDocument {
  id: string;
  type: string;
  title: string;
  mime_type: string;
  size_bytes: number;
  fields?: Record<string, any>;
  files?: any[];
  owner_name: string;
  share_type: string;
  is_visible: boolean;
  expires_at: string | null;
  shared_at: string;
  can_access: boolean;
}

export function useSharedDocuments(groupId: string | null) {
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
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

      const { data, error: rpcError } = await supabase.rpc('get_group_shared_documents', {
        p_group_id: groupId,
      });

      if (rpcError) throw rpcError;

      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading shared documents:', err);
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

