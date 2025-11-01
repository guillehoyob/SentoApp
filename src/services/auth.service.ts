import { supabase } from './supabase';
import type { User, AuthError, AuthResponse, SignUpParams, SignInParams } from '../types/auth.types';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function validateEmail(email: string): AuthError | null {
  if (!email || email.trim().length === 0) {
    return { message: 'El email es requerido', code: 'EMAIL_REQUIRED' };
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return { message: 'El formato del email no es válido', code: 'EMAIL_INVALID' };
  }
  
  return null;
}

function validatePassword(password: string): AuthError | null {
  if (!password || password.length === 0) {
    return { message: 'La contraseña es requerida', code: 'PASSWORD_REQUIRED' };
  }
  
  if (password.length < 8) {
    return { message: 'La contraseña debe tener al menos 8 caracteres', code: 'PASSWORD_TOO_SHORT' };
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return { message: 'La contraseña debe contener al menos una letra y un número', code: 'PASSWORD_INVALID' };
  }
  
  return null;
}

function mapSupabaseError(error: { message: string; status?: number }): AuthError {
  const message = error.message || 'Error desconocido';
  
  if (message.includes('User already registered')) {
    return { message: 'Este email ya está registrado', code: 'EMAIL_EXISTS' };
  }
  
  if (message.includes('Invalid login credentials')) {
    return { message: 'Email o contraseña incorrectos', code: 'INVALID_CREDENTIALS' };
  }
  
  if (message.includes('Email not confirmed')) {
    return { message: 'Por favor confirma tu email antes de iniciar sesión', code: 'EMAIL_NOT_CONFIRMED' };
  }
  
  return { message, code: `ERROR_${error.status || 'UNKNOWN'}` };
}

async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name || undefined,
    language: data.language || undefined,
    created_at: data.created_at,
  };
}

export async function signUp(params: SignUpParams): Promise<AuthResponse> {
  const emailError = validateEmail(params.email);
  if (emailError) {
    return { user: null, error: emailError };
  }
  
  const passwordError = validatePassword(params.password);
  if (passwordError) {
    return { user: null, error: passwordError };
  }
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email.trim().toLowerCase(),
      password: params.password,
      options: {
        data: {
          full_name: params.full_name || '',
        },
      },
    });
    
    if (authError) {
      return { user: null, error: mapSupabaseError(authError) };
    }
    
    if (!authData.user) {
      return { user: null, error: { message: 'No se pudo crear el usuario', code: 'NO_USER' } };
    }
    
    // Esperar a que el trigger cree el perfil
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Intentar obtener el perfil varias veces
    let user = await getUserProfile(authData.user.id);
    let retries = 0;
    while (!user && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      user = await getUserProfile(authData.user.id);
      retries++;
    }
    
    if (!user) {
      return { 
        user: null, 
        error: { message: 'Usuario creado pero el perfil no está disponible aún. Intenta iniciar sesión.', code: 'PROFILE_NOT_READY' } 
      };
    }
    
    return { user, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Error inesperado', 
        code: 'UNEXPECTED_ERROR' 
      } 
    };
  }
}

export async function signIn(params: SignInParams): Promise<AuthResponse> {
  const emailError = validateEmail(params.email);
  if (emailError) {
    return { user: null, error: emailError };
  }
  
  if (!params.password || params.password.length === 0) {
    return { user: null, error: { message: 'La contraseña es requerida', code: 'PASSWORD_REQUIRED' } };
  }
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: params.email.trim().toLowerCase(),
      password: params.password,
    });
    
    if (authError) {
      return { user: null, error: mapSupabaseError(authError) };
    }
    
    if (!authData.user) {
      return { user: null, error: { message: 'No se pudo iniciar sesión', code: 'NO_USER' } };
    }
    
    const user = await getUserProfile(authData.user.id);
    
    return { user, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Error inesperado', 
        code: 'UNEXPECTED_ERROR' 
      } 
    };
  }
}

export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' 
          ? `${window.location.origin}`
          : 'sento://auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      return { user: null, error: mapSupabaseError(error) };
    }
    
    return { user: null, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Error al iniciar sesión con Google', 
        code: 'GOOGLE_ERROR' 
      } 
    };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }
    
    return await getUserProfile(session.user.id);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

