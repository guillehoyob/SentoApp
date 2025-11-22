import { useState, useEffect, useCallback } from 'react';
import * as groupsService from '../services/groups.service';
import type { Group, UpdateGroupInput } from '../types/groups.types';
import { isGroupExpired } from '../services/groups.service';

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  /**
   * Carga el detalle del grupo
   */
  const loadGroup = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fetchedGroup = await groupsService.getGroupById(groupId);
      setGroup(fetchedGroup);
      
      if (fetchedGroup) {
        setExpired(isGroupExpired(fetchedGroup));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el grupo';
      setError(errorMessage);
      console.error('Error loading group:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  /**
   * Actualiza el grupo con optimistic update
   */
  const updateGroup = useCallback(async (data: UpdateGroupInput) => {
    if (!groupId || !group) {
      throw new Error('Grupo no disponible');
    }

    try {
      setError(null);

      // Optimistic update
      const updatedGroup: Group = {
        ...group,
        name: data.name !== undefined ? data.name : group.name,
        type: data.type !== undefined ? data.type : group.type,
        start_date: data.start_date !== undefined ? data.start_date : group.start_date,
        end_date: data.end_date !== undefined ? (data.end_date || undefined) : group.end_date,
        destination: data.destination !== undefined ? (data.destination || undefined) : group.destination,
        notes: data.notes !== undefined ? (data.notes || undefined) : group.notes,
      };
      setGroup(updatedGroup);
      setExpired(isGroupExpired(updatedGroup));

      // Actualizar en servidor
      const result = await groupsService.updateGroup(groupId, data);
      setGroup(result);
      setExpired(isGroupExpired(result));
      
      return result;
    } catch (err) {
      // Revertir optimistic update
      await loadGroup();
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el grupo';
      setError(errorMessage);
      throw err;
    }
  }, [groupId, group, loadGroup]);

  /**
   * Elimina el grupo
   */
  const deleteGroup = useCallback(async () => {
    if (!groupId) {
      throw new Error('Grupo no disponible');
    }

    try {
      setError(null);
      await groupsService.deleteGroup(groupId);
      setGroup(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar el grupo';
      setError(errorMessage);
      throw err;
    }
  }, [groupId]);

  // Cargar grupo al montar o cambiar groupId
  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  return {
    group,
    loading,
    error,
    expired,
    loadGroup,
    updateGroup,
    deleteGroup,
  };
}

