import { Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function AuthenticatedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // No redirigir aquí, dejar que el root layout lo maneje
  // Solo mostrar loading si no hay usuario
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="groups" />
      <Stack.Screen name="create-group" />
      <Stack.Screen name="group-detail" />
      <Stack.Screen name="join" options={{ presentation: 'modal' }} />
      <Stack.Screen name="test-join" options={{ presentation: 'modal' }} />
      <Stack.Screen name="vault" options={{ presentation: 'modal' }} />
      <Stack.Screen name="document-logs" options={{ presentation: 'modal' }} />
      <Stack.Screen name="access-requests" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

