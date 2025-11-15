import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { requestDocumentsFromGroup } from '../services/documents.service';

interface Props {
  visible: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DOC_TYPES = [
  { value: 'passport', label: 'Pasaporte', emoji: '🛂' },
  { value: 'id_card', label: 'DNI/Cédula', emoji: '🪪' },
  { value: 'insurance', label: 'Seguro', emoji: '🏥' },
  { value: 'license', label: 'Licencia', emoji: '🚗' },
];

export function RequestDocumentsModal({ visible, groupId, groupName, onClose, onSuccess }: Props) {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadMembers();
    }
  }, [visible, groupId]);

  const loadMembers = async () => {
    try {
      const { data: group } = await supabase
        .from('groups')
        .select('*, members:group_members(user_id, profiles(id, full_name))')
        .eq('id', groupId)
        .single();

      if (group?.members) {
        const membersList = group.members
          .filter((m: any) => m.profiles)
          .map((m: any) => ({
            id: m.profiles.id,
            name: m.profiles.full_name,
          }));
        setMembers(membersList);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleDoc = (docType: string) => {
    setSelectedDocs(prev =>
      prev.includes(docType) ? prev.filter(t => t !== docType) : [...prev, docType]
    );
  };

  const handleRequest = async () => {
    if (selectedDocs.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un tipo de documento');
      return;
    }

    try {
      setLoading(true);
      const result = await requestDocumentsFromGroup(
        groupId,
        selectedDocs,
        selectedUsers.length > 0 ? selectedUsers : undefined
      );

      Alert.alert(
        '¡Enviado!',
        `${result.requests_created} solicitudes creadas`
      );
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-neutral-50">
        <View className="bg-white border-b border-neutral-200 px-6 pt-16 pb-4">
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-12 right-4 w-10 h-10 items-center justify-center"
          >
            <Text className="text-xl">✕</Text>
          </TouchableOpacity>
          <Text className="text-h3 font-display font-bold text-neutral-900 mb-2">
            Solicitar Documentos
          </Text>
          <Text className="text-sm text-neutral-600">{groupName}</Text>
        </View>

        <ScrollView className="flex-1 p-6">
          {/* Tipos de documentos */}
          <Text className="text-base font-semibold mb-3">Documentos a solicitar</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {DOC_TYPES.map((doc) => (
              <TouchableOpacity
                key={doc.value}
                onPress={() => toggleDoc(doc.value)}
                className={`flex-row items-center px-4 py-2 rounded-full border ${
                  selectedDocs.includes(doc.value)
                    ? 'bg-primary-100 border-primary-500'
                    : 'bg-white border-neutral-300'
                }`}
              >
                <Text className="text-lg mr-2">{doc.emoji}</Text>
                <Text
                  className={`text-sm font-medium ${
                    selectedDocs.includes(doc.value) ? 'text-primary-700' : 'text-neutral-700'
                  }`}
                >
                  {doc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Usuarios */}
          <Text className="text-base font-semibold mb-3">
            Solicitar a: (vacío = todos)
          </Text>
          <View className="mb-6">
            {members.map((member) => (
              <TouchableOpacity
                key={member.id}
                onPress={() => toggleUser(member.id)}
                className={`flex-row items-center justify-between p-3 mb-2 rounded-lg border ${
                  selectedUsers.includes(member.id)
                    ? 'bg-primary-50 border-primary-300'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <Text className="text-sm font-medium text-neutral-900">
                  {member.name}
                </Text>
                {selectedUsers.includes(member.id) && (
                  <Text className="text-primary-500">✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleRequest}
            disabled={loading}
            className="bg-primary-500 py-4 rounded-lg items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Enviar Solicitudes
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

