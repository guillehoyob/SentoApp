import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/Button';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      // El root layout manejará la redirección automáticamente
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bienvenido a Sento</Text>
      
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.full_name || user.email}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          title="Ver Mis Grupos"
          onPress={() => router.push('/(authenticated)/groups')}
          style={styles.actionButton}
        />
        
        <Button
          title="Crear Grupo/Viaje"
          onPress={() => router.push('/(authenticated)/create-group')}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>

      <Button
        title="Cerrar Sesión"
        onPress={handleSignOut}
        variant="danger"
        style={styles.signOutButton}
      />
      
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 48,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  userInfo: {
    marginBottom: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  signOutButton: {
    marginTop: 20,
    minWidth: 200,
  },
});

