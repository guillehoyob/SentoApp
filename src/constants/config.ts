import Constants from 'expo-constants';

interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function getConfig(): Config {
  const manifest = Constants.expoConfig || Constants.manifest;
  
  const supabaseUrl = 
    manifest?.extra?.supabaseUrl ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://iybjzqtiispacfmmynsx.supabase.co';
  
  const supabaseAnonKey = 
    manifest?.extra?.supabaseAnonKey ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Ymp6cXRpaXNwYWNmbW15bnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDczNDMsImV4cCI6MjA3NzU4MzM0M30.xxtALe4iH1bVQkmCxKrRXaWASbsFaDoCLBS0Os9J9V0';

  if (__DEV__) {
    console.log('🔍 Config:', {
      url: supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan las variables de entorno de Supabase');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export const config = getConfig();




