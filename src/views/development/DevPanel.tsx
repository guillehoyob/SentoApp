import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export function DevPanel() {
    const router = useRouter();

    return (
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

                <TouchableOpacity
                    className="bg-secondary rounded-2xl p-xl shadow-lg border-2 border-secondary/30"
                    onPress={() => router.push('/(authenticated)/vault')}
                    activeOpacity={0.8}
                >
                    <View className="flex-row items-center mb-sm">
                        <Text className="text-[32px] mr-md">🔐</Text>
                        <Text className="font-body-semibold text-xl text-white flex-1">
                            Mi Vault
                        </Text>
                        <Text className="text-white text-xl">→</Text>
                    </View>
                    <Text className="font-body text-base text-white/90">
                        Gestiona tus documentos personales
                    </Text>
                </TouchableOpacity>

                {/* Botón Gluestack Demo */}
                <TouchableOpacity
                    className="bg-purple-500 rounded-2xl p-xl shadow-lg"
                    onPress={() => router.push('/(authenticated)/gluestack-demo')}
                    activeOpacity={0.8}
                >
                    <View className="flex-row items-center mb-sm">
                        <Text className="text-[32px] mr-md">🎨</Text>
                        <Text className="font-body-semibold text-xl text-white flex-1">
                            Gluestack UI Demo
                        </Text>
                        <Text className="text-white text-xl">→</Text>
                    </View>
                    <Text className="font-body text-base text-white/90">
                        Ver componentes de Gluestack v2
                    </Text>
                </TouchableOpacity>

                {/* Botón de testing (solo desarrollo) */}
                <TouchableOpacity
                    className="bg-neutral-200 rounded-2xl p-xl border-2 border-neutral-300 border-dashed"
                    onPress={() => router.push('/(authenticated)/test-join')}
                    activeOpacity={0.8}
                >
                    <View className="flex-row items-center mb-sm">
                        <Text className="text-[32px] mr-md">🧪</Text>
                        <Text className="font-body-semibold text-xl text-neutral-700 flex-1">
                            Test: Unirse a Grupo
                        </Text>
                        <Text className="text-neutral-500 text-xl">→</Text>
                    </View>
                    <Text className="font-body text-base text-neutral-600">
                        Pegar groupId + token para testing
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
    );
}
