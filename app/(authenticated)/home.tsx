import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
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
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header con logo y logout */}
      <View className="bg-card pt-[50px] pb-lg px-lg border-b border-neutral-100">
        <View className="flex-row justify-between items-center mb-sm">
          <Text className="font-display text-[32px] text-primary leading-[40px]">
            Sento
          </Text>
          <TouchableOpacity 
            onPress={handleSignOut}
            className="px-md py-xs rounded-lg bg-danger/10"
            activeOpacity={0.7}
          >
            <Text className="font-body-medium text-sm text-danger">
              Salir
            </Text>
          </TouchableOpacity>
        </View>
        
        {user && (
          <View className="mt-sm">
            <Text className="font-body-semibold text-lg text-text-primary">
              {user.full_name || 'Usuario'}
            </Text>
            <Text className="font-body text-sm text-neutral-500">
              {user.email}
            </Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Sección principal */}
        <View className="mb-xl">
          <Text className="font-display text-h2 text-text-primary mb-xs">
            ¿Qué quieres hacer?
          </Text>
          <Text className="font-body text-base text-neutral-600">
            Gestiona tus grupos y viajes
          </Text>
        </View>

        {/* Cards de acciones */}
        <View className="gap-md">
          <TouchableOpacity
            className="bg-card rounded-2xl p-xl shadow-lg border-2 border-primary/20"
            onPress={() => router.push('/(authenticated)/groups')}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center mb-sm">
              <Text className="text-[32px] mr-md">👥</Text>
              <Text className="font-body-semibold text-xl text-text-primary flex-1">
                Mis Grupos
              </Text>
              <Text className="text-primary text-xl">→</Text>
            </View>
            <Text className="font-body text-base text-neutral-600">
              Ver y gestionar tus grupos existentes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-primary rounded-2xl p-xl shadow-lg"
            onPress={() => router.push('/(authenticated)/create-group')}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center mb-sm">
              <Text className="text-[32px] mr-md">✈️</Text>
              <Text className="font-body-semibold text-xl text-white flex-1">
                Crear Grupo/Viaje
              </Text>
              <Text className="text-white text-xl">+</Text>
            </View>
            <Text className="font-body text-base text-white/90">
              Organiza un nuevo viaje o grupo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info adicional */}
        <View className="mt-3xl p-lg bg-neutral-50 rounded-xl border border-neutral-200">
          <Text className="font-body-medium text-sm text-neutral-600 text-center">
            💡 Invita a tus amigos y gestiona gastos compartidos
          </Text>
        </View>
      </ScrollView>
      
      <StatusBar style="auto" />
    </View>
  );
}
