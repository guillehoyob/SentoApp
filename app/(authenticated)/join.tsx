// =====================================================
// PANTALLA: Aceptar invitación a grupo
// =====================================================

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { joinGroup, decodeInviteToken } from '../../src/services/invites.service';
import { supabase } from '../../src/services/supabase';
import { Button } from '../../src/components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function JoinGroupScreen() {
  const router = useRouter();
  const { groupId, token } = useLocalSearchParams<{ groupId: string; token: string }>();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadGroup();
  }, [groupId, token]);

  const checkAuthAndLoadGroup = async () => {
    try {
      // Verificar autenticación
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      if (!session) {
        // Guardar deep link para después del login
        await AsyncStorage.setItem('pending_invite', JSON.stringify({ groupId, token }));
        Alert.alert(
          'Inicia sesión',
          'Debes iniciar sesión para unirte al grupo',
          [
            {
              text: 'Iniciar sesión',
              onPress: () => router.replace('/auth/sign-in'),
            },
          ]
        );
        return;
      }

      // Decodificar token para ver info
      if (token) {
        const decoded = decodeInviteToken(token);
        setTokenInfo(decoded);

        if (decoded?.expired) {
          setError('Este link de invitación ha expirado. Solicita uno nuevo.');
          setLoading(false);
          return;
        }
      }

      // Cargar info del grupo
      if (groupId) {
        const { data, error: groupError } = await supabase
          .from('groups')
          .select(`
            *,
            owner:profiles!owner_id(id, email, full_name),
            members:group_members(
              user_id,
              role,
              profile:profiles(email, full_name)
            )
          `)
          .eq('id', groupId)
          .single();

        if (groupError) {
          setError('Grupo no encontrado');
        } else {
          setGroup(data);

          // Verificar si ya es miembro
          const isMember = data.members?.some((m: any) => m.user_id === session.user.id);
          if (isMember) {
            Alert.alert(
              'Ya eres miembro',
              'Ya formas parte de este grupo',
              [
                {
                  text: 'Ver grupo',
                  onPress: () => router.replace(`/(authenticated)/group-detail?id=${groupId}`),
                },
              ]
            );
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!groupId || !token) {
      Alert.alert('Error', 'Link de invitación inválido');
      return;
    }

    try {
      setJoining(true);
      await joinGroup({ groupId, token });

      Alert.alert(
        '¡Bienvenido!',
        `Te has unido exitosamente a "${group?.name}"`,
        [
          {
            text: 'Ver grupo',
            onPress: () => router.replace(`/(authenticated)/group-detail?id=${groupId}`),
          },
        ]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al unirse al grupo';
      
      if (errorMessage.includes('ya eres miembro')) {
        Alert.alert(
          'Ya eres miembro',
          'Ya formas parte de este grupo',
          [
            {
              text: 'Ver grupo',
              onPress: () => router.replace(`/(authenticated)/group-detail?id=${groupId}`),
            },
          ]
        );
      } else if (errorMessage.includes('expirado')) {
        setError('Este link de invitación ha expirado. Solicita uno nuevo.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#FF5050" />
        <Text className="font-body text-base text-neutral-600 mt-md">
          Cargando invitación...
        </Text>
      </View>
    );
  }

  if (error || !group) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-lg">
        <Text className="text-[64px] mb-md">❌</Text>
        <Text className="font-body-semibold text-xl text-neutral-700 mb-sm text-center">
          {error || 'Invitación no válida'}
        </Text>
        <Text className="font-body text-base text-neutral-500 text-center mb-xl">
          {error.includes('expirado') 
            ? 'Pide al organizador que genere un nuevo link'
            : 'Verifica que el link esté completo'
          }
        </Text>
        <Button
          title="Volver al inicio"
          onPress={() => router.replace('/(authenticated)/home')}
        />
      </View>
    );
  }

  const isExpired = group.type === 'trip' && group.end_date && new Date(group.end_date) < new Date();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
      <View className="flex-1 justify-center max-w-[420px] w-full self-center">
        {/* Header */}
        <View className="mb-xl items-center">
          <Text className="text-[64px] mb-md">{group.type === 'trip' ? '✈️' : '👥'}</Text>
          <Text className="font-display text-[32px] text-text-primary text-center mb-xs leading-[40px]">
            Invitación a {group.type === 'trip' ? 'viaje' : 'grupo'}
          </Text>
          {tokenInfo && !tokenInfo.expired && (
            <Text className="font-body text-sm text-neutral-500">
              Expira: {new Date(tokenInfo.expiresAt * 1000).toLocaleDateString('es-ES')}
            </Text>
          )}
        </View>

        {/* Card con info del grupo */}
        <View className="bg-card rounded-2xl p-xl shadow-xl mb-lg">
          <View className="mb-lg">
            <Text className="font-body-medium text-sm text-neutral-500 mb-xs">Nombre</Text>
            <Text className="font-body-semibold text-2xl text-text-primary">{group.name}</Text>
          </View>

          {group.destination && (
            <View className="mb-lg">
              <Text className="font-body-medium text-sm text-neutral-500 mb-xs">Destino</Text>
              <Text className="font-body text-lg text-neutral-700">📍 {group.destination}</Text>
            </View>
          )}

          <View className="mb-lg">
            <Text className="font-body-medium text-sm text-neutral-500 mb-xs">Organizador</Text>
            <Text className="font-body text-lg text-neutral-700">{group.owner?.full_name || 'Anónimo'}</Text>
          </View>

          <View className="mb-lg">
            <Text className="font-body-medium text-sm text-neutral-500 mb-xs">Fechas</Text>
            <Text className="font-body text-base text-neutral-700">
              📅 {new Date(group.start_date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            {group.end_date && (
              <Text className="font-body text-base text-neutral-700 mt-xs">
                🏁 {new Date(group.end_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            )}
          </View>

          {group.members && (
            <View className="bg-primary/10 p-md rounded-xl">
              <Text className="font-body-medium text-sm text-primary">
                👥 {group.members.length} miembro{group.members.length !== 1 ? 's' : ''} en el grupo
              </Text>
            </View>
          )}
        </View>

        {/* Warning si el viaje está caducado */}
        {isExpired && (
          <View className="bg-warning/15 p-lg rounded-xl mb-lg border border-warning/30">
            <Text className="font-body-medium text-base text-warning mb-xs">
              ⏰ Este viaje ha finalizado
            </Text>
            <Text className="font-body text-sm text-neutral-700">
              Aún puedes unirte para ver el historial y documentos del viaje
            </Text>
          </View>
        )}

        {/* Botón unirse */}
        <Button
          title={`Unirme a ${group.type === 'trip' ? 'este viaje' : 'este grupo'}`}
          onPress={handleJoinGroup}
          loading={joining}
        />

        <Button
          title="Cancelar"
          onPress={() => router.replace('/(authenticated)/home')}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
}

