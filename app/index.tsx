import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../src/hooks/useAuth';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hola sentoide!!</Text>
      
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.full_name || user.email}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
      
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  userInfo: {
    marginBottom: 30,
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});



