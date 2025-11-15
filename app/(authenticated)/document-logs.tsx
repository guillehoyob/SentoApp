import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/services/supabase';

interface AccessLog {
  id: string;
  document_title: string;
  document_type: string;
  accessed_by_name: string;
  accessed_at: string;
  group_name: string | null;
  success: boolean;
}

export default function DocumentLogsScreen() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_document_access_logs', { p_limit: 50 });
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    return 'ahora';
  };

  const getEmoji = (type: string) => {
    switch (type) {
      case 'passport': return '🛂';
      case 'id_card': return '🪪';
      case 'insurance': return '🏥';
      case 'license': return '🚗';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center">
        <ActivityIndicator size="large" color="#FF5050" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="bg-white border-b border-neutral-200 px-6 pt-16 pb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-h2 font-display font-bold">Logs de Acceso</Text>
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <Text className="text-xl">✕</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-neutral-600 mt-1">{logs.length} accesos registrados</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLogs(); }} />}
      >
        {logs.length === 0 ? (
          <View className="p-6">
            <Text className="text-center text-neutral-600">No hay accesos registrados</Text>
          </View>
        ) : (
          <View className="p-4">
            {logs.map((log) => (
              <View key={log.id} className="bg-white rounded-xl p-4 mb-3 border border-neutral-200">
                <View className="flex-row items-start">
                  <Text className="text-2xl mr-3">{getEmoji(log.document_type)}</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-neutral-900">{log.document_title}</Text>
                    <Text className="text-sm text-neutral-600 mt-1">
                      {log.accessed_by_name} accedió {formatTime(log.accessed_at)}
                    </Text>
                    {log.group_name && (
                      <Text className="text-xs text-neutral-500 mt-1">en {log.group_name}</Text>
                    )}
                  </View>
                  <View className={`px-2 py-1 rounded ${log.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`text-xs font-semibold ${log.success ? 'text-green-700' : 'text-red-700'}`}>
                      {log.success ? '✓' : '✗'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

