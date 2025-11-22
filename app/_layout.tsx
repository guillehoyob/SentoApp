import '../global.css';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { DevModeProvider } from '../src/contexts/DevModeContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [initialUrlHandled, setInitialUrlHandled] = useState(false);

  // Manejar deep links
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      // Formato: sento://invite/GROUP_ID?t=TOKEN
      const match = url.match(/sento:\/\/invite\/([^?]+)\?t=(.+)/);
      if (match) {
        const [, groupId, token] = match;

        if (user) {
          // Usuario autenticado: ir directo a join
          router.push(`/(authenticated)/join?groupId=${groupId}&token=${token}`);
        } else {
          // Usuario no autenticado: guardar para después
          await AsyncStorage.setItem('pending_invite', JSON.stringify({ groupId, token }));
          router.push('/auth/sign-in');
        }
      }
    };

    // Manejar URL inicial
    const checkInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && !initialUrlHandled) {
        await handleDeepLink(initialUrl);
        setInitialUrlHandled(true);
      }
    };

    // Listener para URLs mientras la app está abierta
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    checkInitialUrl();

    return () => subscription.remove();
  }, [user, initialUrlHandled]);

  // Verificar invitaciones pendientes después del login
  useEffect(() => {
    const checkPendingInvite = async () => {
      if (user && !loading) {
        const pendingStr = await AsyncStorage.getItem('pending_invite');
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          await AsyncStorage.removeItem('pending_invite');
          router.push(`/(authenticated)/join?groupId=${pending.groupId}&token=${pending.token}`);
        }
      }
    };

    checkPendingInvite();
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(authenticated)';

    // Si no está autenticado pero intenta acceder a rutas protegidas
    if (!user && inAuthGroup) {
      router.replace('/auth/sign-in');
    }

    // Si está autenticado pero en páginas públicas
    if (user && segments[0] === 'auth') {
      router.push('/(authenticated)/home');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/sign-in" />
      <Stack.Screen name="auth/sign-up" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="(authenticated)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(authenticated)/join"
        options={{
          headerShown: false,
          presentation: 'modal'
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'PlayfairDisplay-BoldItalic': PlayfairDisplay_700Bold_Italic,
    'GeneralSans-Light': require('../assets/fonts/GeneralSans-Light.ttf'),
    'GeneralSans-Regular': require('../assets/fonts/GeneralSans-Regular.ttf'),
    'GeneralSans-Medium': require('../assets/fonts/GeneralSans-Medium.ttf'),
    'GeneralSans-Semibold': require('../assets/fonts/GeneralSans-Semibold.ttf'),
    'GeneralSans-Italic': require('../assets/fonts/GeneralSans-Italic.ttf'),
    'GeneralSans-SemiboldItalic': require('../assets/fonts/GeneralSans-SemiboldItalic.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5050" />
      </View>
    );
  }

  return (
    <GluestackUIProvider mode="light">
      <DevModeProvider>
        <RootLayoutNav />
      </DevModeProvider>
    </GluestackUIProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
});

