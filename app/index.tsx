import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { Button } from '../src/components/Button';

export default function WelcomeScreen() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#FF5050" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background justify-center items-center px-lg">
      <View className="w-full max-w-[420px] items-center">
        {/* Logo/Título */}
        <View className="mb-3xl items-center">
          <Text className="font-display text-[64px] text-primary mb-md leading-[72px]">
            Sento
          </Text>
          <Text className="font-body text-lg text-neutral-600 text-center">
            Organiza tus viajes y grupos{'\n'}de forma sencilla
          </Text>
        </View>

        {/* Card con botones */}
        <View className="w-full bg-card rounded-2xl p-xl shadow-xl">
          <Button
            title="Iniciar Sesión"
            onPress={() => router.push('/auth/sign-in')}
          />
          <Button
            title="Crear cuenta"
            onPress={() => router.push('/auth/sign-up')}
            variant="secondary"
          />
          
          <Text className="font-body text-sm text-neutral-400 text-center mt-lg">
            Comienza tu próxima aventura
          </Text>
        </View>
      </View>
    </View>
  );
}




