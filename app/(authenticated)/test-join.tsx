import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/services/supabase';
import { joinGroup } from '../../src/services/invites.service';
import { shareDocumentWithGroup } from '../../src/services/documents.service';
import { Button } from '../../src/components/Button';
import { GroupOnboardingModalFull } from '../../src/components/GroupOnboardingModalFull';

export default function TestJoinScreen() {
  const router = useRouter();
  const [groupId, setGroupId] = useState('');
  const [token, setToken] = useState('');
  const [groupName, setGroupName] = useState('');
  const [joining, setJoining] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handlePrepareJoin = async () => {
    if (!groupId.trim() || !token.trim()) {
      Alert.alert('Error', 'Pega groupId y token');
      return;
    }

    try {
      setJoining(true);
      const cleanGroupId = groupId.trim().replace(/\s+/g, '');
      const cleanToken = token.trim().replace(/\s+/g, '');
      
      // Decodificar token para obtener info del grupo
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        Alert.alert('Error', 'Token malformado (debe tener 3 partes)');
        return;
      }

      let payload: any;
      try {
        payload = JSON.parse(atob(parts[1]));
        console.log('🧪 Token válido para grupo:', payload.aud);
      } catch (e) {
        console.error('Error decodificando token:', e);
        Alert.alert('Error', 'Token inválido - no se puede decodificar');
        return;
      }
      
      // Verificar que el token sea para este grupo
      if (payload.aud !== cleanGroupId) {
        Alert.alert('Error', 'El token no coincide con el Group ID proporcionado');
        return;
      }

      // Verificar expiración
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        Alert.alert('Error', 'Token expirado - solicita uno nuevo');
        return;
      }
      
      // Obtener nombre del grupo desde BD
      // Usar maybeSingle() para evitar error si RLS bloquea
      const { data, error } = await supabase
        .from('groups')
        .select('name')
        .eq('id', cleanGroupId)
        .maybeSingle();
      
      // Si RLS bloquea, usar nombre genérico (el usuario aún no es miembro)
      const groupNameToShow = data?.name || 'Grupo';
      
      console.log('✅ Grupo encontrado:', groupNameToShow);
      
      // Todo OK - mostrar modal onboarding
      setGroupName(groupNameToShow);
      setGroupId(cleanGroupId);
      setToken(cleanToken);
      setShowOnboarding(true);
      
    } catch (err) {
      console.error('❌ Error preparando unión:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo verificar el grupo');
    } finally {
      setJoining(false);
    }
  };

  const handleJoinWithDocs = async (docsToShare: string[]) => {
    try {
      console.log('🧪 Uniéndose con documentos:', docsToShare);
      
      // 1. Unirse al grupo
      const group = await joinGroup({ groupId, token });
      console.log('✅ Unido al grupo:', group.name);
      
      // 2. Compartir documentos seleccionados
      if (docsToShare.length > 0) {
        for (const docId of docsToShare) {
          await shareDocumentWithGroup({
            documentId: docId,
            groupId: groupId,
            shareType: 'manual',
            expiresInDays: null
          });
          console.log('✅ Documento compartido:', docId);
        }
      }
      
      // 3. Limpiar caché y navegar
      await AsyncStorage.removeItem('@sento:groups_cache');
      setShowOnboarding(false);
      router.replace('/(authenticated)/groups');
      
      setTimeout(() => {
        Alert.alert('✅ Unido!', `Te uniste a: ${group.name}${docsToShare.length > 0 ? `\n\n${docsToShare.length} documento(s) compartido(s)` : ''}`);
      }, 300);
      
    } catch (err) {
      console.error('❌ Error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al unirse');
    }
  };

  const handlePasteExample = () => {
    Alert.alert(
      '📋 Cómo usar',
      '1. Usuario A: Generar invitación\n2. Copiar el link: sento://invite/GROUP_ID?t=TOKEN\n3. Usuario B: Pegar aquí GROUP_ID y TOKEN por separado\n4. Unirse'
    );
  };

  return (
    <ScrollView className="flex-1 bg-background p-lg">
      <View className="mb-lg">
        <TouchableOpacity onPress={() => router.back()} className="mb-md">
          <Text className="text-primary text-base">← Volver</Text>
        </TouchableOpacity>
        
        <Text className="font-display text-[28px] text-neutral-900 mb-xs">
          🧪 Test: Unirse a Grupo
        </Text>
        <Text className="font-body text-base text-neutral-600 mb-md">
          Para testing sin deep links clickables
        </Text>

        <TouchableOpacity 
          onPress={handlePasteExample}
          className="bg-blue-50 p-md rounded-lg border border-blue-200"
        >
          <Text className="text-sm text-blue-700">💡 ¿Cómo obtener groupId y token?</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white rounded-2xl p-lg border border-neutral-200 mb-lg">
        <Text className="font-body-semibold text-base text-neutral-800 mb-sm">
          Group ID
        </Text>
        <TextInput
          className="bg-neutral-50 border border-neutral-300 rounded-lg p-md text-base mb-lg"
          placeholder="075abc-123def-456..."
          value={groupId}
          onChangeText={setGroupId}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={2}
        />

        <Text className="font-body-semibold text-base text-neutral-800 mb-sm">
          Token (JWT)
        </Text>
        <TextInput
          className="bg-neutral-50 border border-neutral-300 rounded-lg p-md text-base"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={4}
        />
      </View>

      <Button
        title="Unirse al Grupo"
        onPress={handlePrepareJoin}
        loading={joining}
      />

      {/* Modal de Onboarding con requisitos */}
      <GroupOnboardingModalFull
        visible={showOnboarding}
        groupId={groupId}
        groupName={groupName}
        onJoin={handleJoinWithDocs}
        onCancel={() => setShowOnboarding(false)}
      />

      <View className="mt-lg bg-yellow-50 p-md rounded-lg border border-yellow-200">
        <Text className="text-sm text-yellow-800">
          ⚠️ Solo para testing. En producción se usa deep link clickable.
        </Text>
      </View>
    </ScrollView>
  );
}

