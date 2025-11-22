import { Text, View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/hooks/useAuth';
import { useDevMode } from '../../src/contexts/DevModeContext';
import { DevPanel } from '../../src/views/development/DevPanel';
import { ProductionHome } from '../../src/views/production/ProductionHome';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { isDevelopmentMode, toggleMode, loading: devModeLoading } = useDevMode();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (devModeLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="font-body text-neutral-600">Cargando...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header con logo, toggle y logout */}
      <View className="bg-card pt-[50px] pb-lg px-lg border-b border-neutral-100">
        <View className="flex-row justify-between items-center mb-sm">
          <Text className="font-display text-[32px] text-primary leading-[40px]">
            Sento
          </Text>

          {/* Dev Mode Toggle */}
          <View className="flex-row items-center gap-md">
            <TouchableOpacity
              onPress={toggleMode}
              className={`px-md py-xs rounded-full ${isDevelopmentMode ? 'bg-purple-500' : 'bg-primary'
                }`}
              activeOpacity={0.7}
            >
              <Text className="font-body-medium text-xs text-white">
                {isDevelopmentMode ? '🛠️ DEV' : '✨ PROD'}
              </Text>
            </TouchableOpacity>

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

        {/* Mode indicator */}
        <View className="mt-sm">
          <Text className="font-body text-xs text-neutral-500">
            {isDevelopmentMode
              ? '🛠️ Modo Desarrollo - Todas las funciones disponibles'
              : '✨ Modo Producción - Vista profesional'}
          </Text>
        </View>
      </View>

      {/* Content - Toggle between Dev and Production */}
      {isDevelopmentMode ? <DevPanel /> : <ProductionHome />}

      <StatusBar style="auto" />
    </View>
  );
}
