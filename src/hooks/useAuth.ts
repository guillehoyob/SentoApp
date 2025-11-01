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
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
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
      }
      return { error: response.error };
    } finally {
      setLoading(false);
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

