import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/Button';
import { TextInputComponent } from '../../src/components/TextInput';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const { signIn, signInWithGoogle, loading } = useAuth();

  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Email inválido');
    } else {
      setEmailError('');
    }
  }, [email]);

  useEffect(() => {
    if (password && password.length < 8) {
      setPasswordError('Mínimo 8 caracteres');
    } else {
      setPasswordError('');
    }
  }, [password]);

  const handleSignIn = async () => {
    setGeneralError('');
    
    if (!email.trim()) {
      setEmailError('Email requerido');
      return;
    }
    
    if (!password.trim()) {
      setPasswordError('Contraseña requerida');
      return;
    }

    const { error } = await signIn({ email, password });
    
    if (error) {
      setGeneralError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError('');
    const { error } = await signInWithGoogle();
    
    if (error) {
      setGeneralError(error.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }}>
      <View className="flex-1 justify-center max-w-[420px] w-full self-center">
        {/* Header */}
        <View className="mb-xl">
          <Text className="font-display text-[40px] text-center text-text-primary mb-xs leading-[48px]">
            Bienvenido
          </Text>
          <Text className="font-body text-lg text-center text-neutral-600">
            Inicia sesión para continuar
          </Text>
        </View>

        {/* Card principal */}
        <View className="bg-card rounded-2xl p-xl shadow-xl">
          <ErrorMessage message={generalError} />

          <TextInputComponent
            label="Correo electrónico"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={emailError}
          />

          <TextInputComponent
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            error={passwordError}
          />

          <TouchableOpacity
            className="self-end mb-lg -mt-md"
            onPress={() => {
              alert('Funcionalidad próximamente disponible');
            }}
          >
            <Text className="font-body-medium text-sm text-primary">
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <Button
            title="Iniciar Sesión"
            onPress={handleSignIn}
            loading={loading}
          />

          <View className="flex-row items-center my-xl">
            <View className="flex-1 h-[1px] bg-neutral-200" />
            <Text className="font-body-medium text-sm text-neutral-400 mx-lg">
              o continúa con
            </Text>
            <View className="flex-1 h-[1px] bg-neutral-200" />
          </View>

          <Button
            title="🌐 Google"
            onPress={handleGoogleSignIn}
            variant="secondary"
            loading={loading}
          />

          <View className="flex-row justify-center mt-xl pt-md border-t border-neutral-100">
            <Text className="font-body text-base text-neutral-600">
              ¿No tienes cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
              <Text className="font-body-semibold text-base text-primary">
                Crear cuenta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

