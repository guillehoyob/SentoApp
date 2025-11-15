import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/Button';
import { TextInputComponent } from '../../src/components/TextInput';
import { ErrorMessage } from '../../src/components/ErrorMessage';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const { signUp, signInWithGoogle, loading } = useAuth();

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
    } else if (password && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      setPasswordError('Debe contener al menos una letra y un número');
    } else {
      setPasswordError('');
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
    } else {
      setConfirmPasswordError('');
    }
  }, [confirmPassword, password]);

  const handleSignUp = async () => {
    setGeneralError('');
    
    if (!email.trim()) {
      setEmailError('Email requerido');
      return;
    }
    
    if (!password.trim()) {
      setPasswordError('Contraseña requerida');
      return;
    }

    if (!fullName.trim()) {
      setGeneralError('Nombre completo requerido');
      return;
    }

    if (!acceptedTerms) {
      setGeneralError('Debes aceptar los términos y condiciones');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      return;
    }

    const { error } = await signUp({ email, password, full_name: fullName });
    
    if (error) {
      if (error.code === 'PROFILE_NOT_READY') {
        router.push('/auth/sign-in');
      } else {
        setGeneralError(error.message);
      }
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
            Crear Cuenta
          </Text>
          <Text className="font-body text-lg text-center text-neutral-600">
            Únete a Sento hoy
          </Text>
        </View>

        {/* Card principal */}
        <View className="bg-card rounded-2xl p-xl shadow-xl">
          <ErrorMessage message={generalError} />

          <TextInputComponent
            label="Nombre completo"
            placeholder="Juan Pérez"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <TextInputComponent
            label="Email"
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
            placeholder="Mínimo 8 caracteres, 1 letra y 1 número"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            error={passwordError}
          />

          <TextInputComponent
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="password"
            error={confirmPasswordError}
          />

          <TouchableOpacity
            className="flex-row items-center mb-xl"
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View className={`w-6 h-6 border-2 rounded-md justify-center items-center mr-sm ${
              acceptedTerms ? 'bg-primary border-primary' : 'border-neutral-300'
            }`}>
              {acceptedTerms && (
                <Text className="text-white text-sm font-body-semibold">✓</Text>
              )}
            </View>
            <Text className="font-body text-sm text-neutral-700 flex-1">
              Acepto los términos y condiciones
            </Text>
          </TouchableOpacity>

          <Button
            title="Crear cuenta"
            onPress={handleSignUp}
            loading={loading}
            disabled={!acceptedTerms}
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
              ¿Ya tienes cuenta?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
              <Text className="font-body-semibold text-base text-primary">
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
