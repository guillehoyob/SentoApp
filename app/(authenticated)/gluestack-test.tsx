import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function GluestackTest() {
  const router = useRouter();
  const [count, setCount] = React.useState(0);

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-purple-500 pt-14 pb-6 px-6">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">NativeWind + Tailwind Test</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <View className="p-6">
        {/* Test básico con NativeWind */}
        <View className="bg-blue-50 p-4 rounded-lg mb-6 border-2 border-blue-200">
          <Text className="text-lg font-bold mb-2 text-blue-900">✅ NativeWind funciona</Text>
          <Text className="text-gray-600">Este texto usa className de Tailwind</Text>
        </View>

        {/* Test con contador */}
        <View className="bg-purple-100 p-4 rounded-lg mb-6 border-2 border-purple-300">
          <Text className="text-2xl font-bold mb-2 text-purple-900">
            🎨 Tailwind + NativeWind
          </Text>
          <Text className="text-gray-700 mb-4 text-lg">
            Counter: {count}
          </Text>
          
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setCount(count + 1)}
              className="bg-purple-500 px-6 py-3 rounded-lg active:bg-purple-600"
            >
              <Text className="text-white font-bold">+1</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setCount(0)}
              className="bg-white border-2 border-purple-500 px-6 py-3 rounded-lg active:bg-purple-50"
            >
              <Text className="text-purple-600 font-bold">Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Más ejemplos */}
        <View className="bg-green-100 p-4 rounded-lg mb-6 border-2 border-green-300">
          <Text className="text-xl font-bold text-green-700 mb-2">
            Box Component
          </Text>
          <Text className="text-gray-600">
            Este es un componente estilizado con Tailwind CSS
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setCount(count + 10)}
          className="bg-blue-500 px-6 py-4 rounded-lg w-full active:bg-blue-600"
        >
          <Text className="text-white font-bold text-center text-lg">+10 (Full Width)</Text>
        </TouchableOpacity>

        {/* Info adicional */}
        <View className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
          <Text className="text-sm text-yellow-800 text-center font-semibold mb-2">
            ℹ️ Gluestack UI v2 Info
          </Text>
          <Text className="text-xs text-yellow-700 text-center">
            Gluestack UI v2 usa NativeWind/Tailwind directamente.{'\n'}
            No necesitas componentes especiales, solo usa className.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

