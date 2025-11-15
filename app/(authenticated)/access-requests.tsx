import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAccessRequests } from '../../src/hooks/useAccessRequests';
import { supabase } from '../../src/services/supabase';

export default function AccessRequestsScreen() {
  const router = useRouter();
  const { requests, loading, error, refresh } = useAccessRequests();

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('approve_access_request', {
        p_request_id: requestId,
        p_expires_at: null,
      });
      if (error) throw error;
      Alert.alert('¡Aprobado!', 'Solicitud aprobada');
      refresh();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('reject_access_request', {
        p_request_id: requestId,
      });
      if (error) throw error;
      Alert.alert('Rechazado', 'Solicitud rechazada');
      refresh();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="bg-white border-b border-neutral-200 px-6 pt-16 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-h2 font-display font-bold text-neutral-900">
            Solicitudes Pendientes
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Text className="text-xl text-neutral-600">✕</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm font-body text-neutral-600">
          Aprueba o rechaza solicitudes de acceso
        </Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {loading && (
          <Text className="text-center text-neutral-600 mt-10">Cargando...</Text>
        )}

        {error && (
          <Text className="text-center text-red-500 mt-10">{error}</Text>
        )}

        {!loading && !error && requests.length === 0 && (
          <Text className="text-center text-neutral-600 mt-10">
            No tienes solicitudes pendientes
          </Text>
        )}

        {requests.map((req) => (
          <View
            key={req.id}
            className="bg-white rounded-xl p-4 mb-3 border border-neutral-200"
          >
            <Text className="text-sm font-semibold text-neutral-900 mb-1">
              {req.document_title || 'Documento'}
            </Text>
            <Text className="text-xs text-neutral-700 mb-2">
              Solicitado por: {req.requester_name || 'Usuario'}
            </Text>
            <Text className="text-xs text-neutral-500 mb-3">
              {new Date(req.created_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleApprove(req.id)}
                className="flex-1 bg-green-100 py-2 rounded items-center"
              >
                <Text className="text-sm font-semibold text-green-700">✓ Aprobar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReject(req.id)}
                className="flex-1 bg-red-100 py-2 rounded items-center"
              >
                <Text className="text-sm font-semibold text-red-700">✕ Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

