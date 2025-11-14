import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as groupsService from '../services/groups.service';
import type { Group, CreateGroupInput } from '../types/groups.types';

const CACHE_KEY = '@sento:groups_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

interface CachedGroups {
  groups: Group[];
  timestamp: number;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga grupos desde cache o servidor
   */
  const loadGroups = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Intentar cargar desde cache si no es refresh forzado
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedGroups = JSON.parse(cached);
          const now = Date.now();
          
          // Si el cache es válido (menos de 5 minutos), usarlo
          if (now - parsed.timestamp < CACHE_EXPIRY) {
            setGroups(parsed.groups);
            setLoading(false);
            
            // Actualizar en background sin bloquear UI
            refreshGroups();
            return;
          }
        }
      }

      // Cargar desde servidor
      await refreshGroups();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los grupos';
      setError(errorMessage);
      console.error('Error loading groups:', err);
      
      // Intentar cargar desde cache como fallback
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedGroups = JSON.parse(cached);
          setGroups(parsed.groups);
        }
      } catch (cacheErr) {
        console.error('Error loading from cache:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresca grupos desde el servidor
   */
  const refreshGroups = useCallback(async () => {
    try {
      const fetchedGroups = await groupsService.getMyGroups();
      setGroups(fetchedGroups);
      setError(null);

      // Guardar en cache
      const cacheData: CachedGroups = {
        groups: fetchedGroups,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al refrescar los grupos';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Crea un nuevo grupo con optimistic update
   */
  const createGroup = useCallback(async (data: CreateGroupInput) => {
    try {
      setError(null);
      
      // Crear en servidor (sin optimistic update para evitar problemas)
      const newGroup = await groupsService.createGroup(data);
      
      // Actualizar cache inmediatamente
      await refreshGroups();
      
      return newGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el grupo';
      setError(errorMessage);
      throw err;
    }
  }, [refreshGroups]);

  // Cargar grupos al montar
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return {
    groups,
    loading,
    error,
    loadGroups,
    refreshGroups,
    createGroup,
  };
}

