import { createClient } from '@supabase/supabase-js';
import { config } from '../constants/config';

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    if (!config.supabaseUrl || !config.supabaseUrl.startsWith('http')) {
      return {
        success: false,
        message: '❌ URL de Supabase inválida',
        error: `URL proporcionada: ${config.supabaseUrl || 'vacía'}`,
      };
    }

    const { error } = await supabase.auth.getSession();
    
    if (!error) {
      return {
        success: true,
        message: '✅ Conectado correctamente a Supabase',
      };
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      return {
        success: false,
        message: '❌ No se puede resolver el dominio de Supabase',
        error: `Verifica la URL: ${config.supabaseUrl}`,
      };
    }

    return {
      success: false,
      message: '❌ Error al conectar con Supabase',
      error: error.message || `Código: ${error.status || 'desconocido'}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || errorMessage.includes('getaddrinfo') || errorMessage.includes('Failed to fetch')) {
      return {
        success: false,
        message: '❌ No se puede resolver el dominio de Supabase',
        error: `Verifica que la URL sea correcta: ${config.supabaseUrl}`,
      };
    }

    return {
      success: false,
      message: '❌ Error inesperado al conectar',
      error: errorMessage,
    };
  }
}



