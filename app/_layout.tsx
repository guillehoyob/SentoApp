import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isCallback = segments.length > 1 && (segments as string[])[1] === 'callback';

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup && !isCallback) {
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Sento', headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ title: 'Iniciar Sesión', headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ title: 'Registrarse', headerShown: false }} />
      <Stack.Screen name="auth/callback" options={{ title: 'Cargando...', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}

