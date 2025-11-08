import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { Button } from '../src/components/Button';

export default function WelcomeScreen() {
  const { loading } = useAuth();

  // La redirección se maneja en _layout.tsx para evitar loops
  // Solo mostrar loading mientras se verifica el estado

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Sento</Text>
        <Text style={styles.tagline}>Tu app de viajes</Text>

        <View style={styles.buttons}>
          <Button
            title="Iniciar Sesión"
            onPress={() => router.push('/auth/sign-in')}
            style={styles.button}
          />
          <Button
            title="Registrarse"
            onPress={() => router.push('/auth/sign-up')}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: '#666',
    marginBottom: 48,
    fontWeight: '300',
  },
  buttons: {
    width: '100%',
  },
  button: {
    marginBottom: 12,
  },
});




