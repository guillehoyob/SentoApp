import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { useRouter } from 'expo-router';

export function ProductionHome() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 24
                }}
            >
                {/* Hero Section */}
                <View className="items-center mb-3xl">
                    {/* Logo/Icon */}
                    <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-lg">
                        <Text className="text-5xl">✈️</Text>
                    </View>

                    {/* Main Title */}
                    <Text className="font-display text-[48px] text-primary mb-md text-center leading-[56px]">
                        Sento
                    </Text>

                    {/* Subtitle */}
                    <Text className="font-body-semibold text-2xl text-text-primary text-center mb-sm">
                        Your New Sento Journey
                    </Text>

                    {/* Description */}
                    <Text className="font-body text-base text-neutral-600 text-center max-w-[320px]">
                        Tu nueva experiencia de viaje comienza aquí.{'\n'}
                        Gestión profesional de grupos y documentos.
                    </Text>
                </View>

                {/* Quick Actions */}
                <View className="w-full max-w-[400px] gap-md">
                    <Button
                        size="lg"
                        action="primary"
                        onPress={() => router.push('/(authenticated)/groups')}
                    >
                        <ButtonText>Ver Mis Grupos</ButtonText>
                    </Button>

                    <Button
                        size="lg"
                        action="secondary"
                        variant="outline"
                        onPress={() => router.push('/(authenticated)/create-group')}
                    >
                        <ButtonText>Crear Nuevo Grupo</ButtonText>
                    </Button>
                </View>

                {/* Coming Soon Badge */}
                <View className="mt-3xl">
                    <View className="bg-primary/10 px-lg py-md rounded-full">
                        <Text className="font-body-medium text-sm text-primary">
                            🚀 Nuevas funciones próximamente
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
