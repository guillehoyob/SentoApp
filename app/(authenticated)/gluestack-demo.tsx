import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// 🎉 COMPONENTES REALES DE GLUESTACK UI V2
import { Button, ButtonText, ButtonSpinner, ButtonIcon } from '@/components/ui/button';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Badge, BadgeText, BadgeIcon } from '@/components/ui/badge';

export default function GluestackDemoScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <View className="flex-1 bg-background-0">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-primary-500 pt-14 pb-6 px-6">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-body-semibold">Gluestack UI v2 REAL</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text className="text-primary-100 text-sm font-body">
          Componentes instalados con npx gluestack-ui add
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          
          {/* Card 1: Buttons con variantes */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-outline-200">
            <Text className="text-xl font-body-semibold text-typography-900 mb-4">
              🎨 Button Component (Gluestack UI)
            </Text>
            
            <View className="gap-3">
              <Text className="text-sm font-body-medium text-typography-600 mb-1">
                Action: primary
              </Text>
              <Button action="primary" variant="solid">
                <ButtonText>Primary Solid</ButtonText>
              </Button>
              
              <Button action="primary" variant="outline">
                <ButtonText>Primary Outline</ButtonText>
              </Button>
              
              <Text className="text-sm font-body-medium text-typography-600 mb-1 mt-2">
                Action: secondary
              </Text>
              <Button action="secondary" variant="solid">
                <ButtonText>Secondary Solid</ButtonText>
              </Button>
              
              <Text className="text-sm font-body-medium text-typography-600 mb-1 mt-2">
                Action: positive (Success)
              </Text>
              <Button action="positive" variant="solid">
                <ButtonText>Positive Action</ButtonText>
              </Button>
              
              <Text className="text-sm font-body-medium text-typography-600 mb-1 mt-2">
                Action: negative (Error)
              </Text>
              <Button action="negative" variant="solid">
                <ButtonText>Negative Action</ButtonText>
              </Button>
              
              <Text className="text-sm font-body-medium text-typography-600 mb-1 mt-2">
                Button con loading
              </Text>
              <Button 
                action="primary" 
                onPress={handleLoadingTest}
                isDisabled={isLoading}
              >
                {isLoading && <ButtonSpinner />}
                <ButtonText>{isLoading ? 'Cargando...' : 'Test Loading'}</ButtonText>
              </Button>
            </View>
          </View>

          {/* Card 2: Button Sizes */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-outline-200">
            <Text className="text-xl font-body-semibold text-typography-900 mb-4">
              📏 Button Sizes
            </Text>
            
            <View className="gap-3 items-start">
              <Button size="xs" action="primary">
                <ButtonText>Extra Small (xs)</ButtonText>
              </Button>
              
              <Button size="sm" action="primary">
                <ButtonText>Small (sm)</ButtonText>
              </Button>
              
              <Button size="md" action="primary">
                <ButtonText>Medium (md) - Default</ButtonText>
              </Button>
              
              <Button size="lg" action="primary">
                <ButtonText>Large (lg)</ButtonText>
              </Button>
              
              <Button size="xl" action="primary">
                <ButtonText>Extra Large (xl)</ButtonText>
              </Button>
            </View>
          </View>

          {/* Card 3: Input Component */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-outline-200">
            <Text className="text-xl font-body-semibold text-typography-900 mb-4">
              ✍️ Input Component (Gluestack UI)
            </Text>
            
            <View className="gap-4">
              <View>
                <Text className="text-sm font-body-medium text-typography-600 mb-2">
                  Input default
                </Text>
                <Input variant="outline" size="md">
                  <InputField 
                    placeholder="tu@email.com"
                    value={email}
                    onChangeText={setEmail}
                  />
                </Input>
              </View>
              
              <View>
                <Text className="text-sm font-body-medium text-typography-600 mb-2">
                  Input con valor
                </Text>
                <Input variant="outline" size="md">
                  <InputField 
                    placeholder="Password"
                    secureTextEntry
                    value="••••••••"
                  />
                </Input>
              </View>
              
              <View>
                <Text className="text-sm font-body-medium text-typography-600 mb-2">
                  Input deshabilitado
                </Text>
                <Input variant="outline" size="md" isDisabled>
                  <InputField 
                    placeholder="Disabled input"
                  />
                </Input>
              </View>
              
              <View>
                <Text className="text-sm font-body-medium text-typography-600 mb-2">
                  Input con error
                </Text>
                <Input variant="outline" size="md" isInvalid>
                  <InputField 
                    placeholder="Email inválido"
                    value="invalid@"
                  />
                </Input>
                <Text className="text-xs text-error-500 mt-1">
                  Por favor ingresa un email válido
                </Text>
              </View>
            </View>
          </View>

          {/* Card 4: Badge Component */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-outline-200">
            <Text className="text-xl font-body-semibold text-typography-900 mb-4">
              🏷️ Badge Component (Gluestack UI)
            </Text>
            
            <View className="flex-row flex-wrap gap-2">
              <Badge size="md" variant="solid" action="success">
                <BadgeText>Success</BadgeText>
              </Badge>
              
              <Badge size="md" variant="solid" action="error">
                <BadgeText>Error</BadgeText>
              </Badge>
              
              <Badge size="md" variant="solid" action="warning">
                <BadgeText>Warning</BadgeText>
              </Badge>
              
              <Badge size="md" variant="solid" action="info">
                <BadgeText>Info</BadgeText>
              </Badge>
              
              <Badge size="md" variant="solid" action="muted">
                <BadgeText>Muted</BadgeText>
              </Badge>
            </View>
            
            <Text className="text-sm font-body-medium text-typography-600 mt-4 mb-2">
              Badge Outline
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Badge size="md" variant="outline" action="success">
                <BadgeText>Success</BadgeText>
              </Badge>
              
              <Badge size="md" variant="outline" action="error">
                <BadgeText>Error</BadgeText>
              </Badge>
              
              <Badge size="md" variant="outline" action="warning">
                <BadgeText>Warning</BadgeText>
              </Badge>
            </View>
            
            <Text className="text-sm font-body-medium text-typography-600 mt-4 mb-2">
              Badge Sizes
            </Text>
            <View className="flex-row flex-wrap gap-2 items-center">
              <Badge size="sm" variant="solid" action="info">
                <BadgeText>Small</BadgeText>
              </Badge>
              
              <Badge size="md" variant="solid" action="info">
                <BadgeText>Medium</BadgeText>
              </Badge>
              
              <Badge size="lg" variant="solid" action="info">
                <BadgeText>Large</BadgeText>
              </Badge>
            </View>
          </View>

          {/* Card 5: Combinaciones */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-outline-200">
            <Text className="text-xl font-body-semibold text-typography-900 mb-4">
              🎭 Combinaciones Reales
            </Text>
            
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Input variant="outline" size="sm">
                    <InputField placeholder="Buscar..." />
                  </Input>
                </View>
                <Button size="sm" action="primary">
                  <ButtonText>Buscar</ButtonText>
                </Button>
              </View>
              
              <View className="flex-row items-center gap-2">
                <Badge size="sm" variant="solid" action="success">
                  <BadgeText>Activo</BadgeText>
                </Badge>
                <Badge size="sm" variant="outline" action="info">
                  <BadgeText>3 pendientes</BadgeText>
                </Badge>
              </View>
            </View>
          </View>

          {/* Info Final */}
          <View className="bg-success-50 border border-success-200 rounded-2xl p-6">
            <Text className="text-center font-body-semibold text-success-700 text-lg mb-2">
              ✅ Componentes REALES de Gluestack UI v2
            </Text>
            <Text className="text-center font-body text-success-600 text-sm">
              Instalados con: npx gluestack-ui add button input badge{'\n\n'}
              Estos son componentes NATIVOS de Gluestack UI v2,{'\n'}
              NO son wrappers de componentes de React Native.{'\n\n'}
              🎨 Totalmente personalizables con Tailwind CSS
            </Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
