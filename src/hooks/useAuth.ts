import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import * as authService from '../services/auth.service';
import type { User, SignUpParams, SignInParams, AuthError } from '../types/auth.types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signUp: (params: SignUpParams) => Promise<{ error: AuthError | null }>;
  signIn: (params: SignInParams) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verificar sesión persistida al iniciar
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Manejar todos los eventos de autenticación
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUser]);

  const signUp = useCallback(async (params: SignUpParams) => {
    setLoading(true);
    try {
      const response = await authService.signUp(params);
      if (response.user) {
        setUser(response.user);
      }
      return { error: response.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (params: SignInParams) => {
    setLoading(true);
    try {
      const response = await authService.signIn(params);
      if (response.user) {
        setUser(response.user);
        setLoading(false);
        // Pequeño delay para asegurar que el estado se propaga
        await new Promise(resolve => setTimeout(resolve, 50));
      } else {
        setLoading(false);
      }
      return { error: response.error };
    } catch (error) {
      setLoading(false);
      return { error: { message: 'Error inesperado al iniciar sesión', code: 'UNEXPECTED_ERROR' } };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authService.signInWithGoogle();
      return { error: response.error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}

