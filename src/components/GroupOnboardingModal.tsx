import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../services/supabase';

interface Props {
  visible: boolean;
  groupId: string;
  groupName: string;
  onAccept: () => void;
  onReject: () => void;
}

const DOC_EMOJI: Record<string, string> = {
  passport: '🛂',
  id_card: '🪪',
  insurance: '🏥',
  license: '🚗',
};

const DOC_LABEL: Record<string, string> = {
  passport: 'Pasaporte',
  id_card: 'DNI/Cédula',
  insurance: 'Seguro',
  license: 'Licencia',
};

export function GroupOnboardingModal({ visible, groupId, groupName, onAccept, onReject }: Props) {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRequirements();
    }
  }, [visible, groupId]);

  const loadRequirements = async () => {
    try {
      const { data, error } = await supabase.rpc('get_group_requirements', {
        p_group_id: groupId,
      });

      if (error) throw error;
      setRequirements(data || []);
    } catch (error) {
      console.error('Error loading requirements:', error);
    }
  };

  if (!requirements.length) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          <Text className="text-h3 font-display font-bold text-neutral-900 mb-2">
            Requisitos del Grupo
          </Text>
          <Text className="text-sm text-neutral-600 mb-4">{groupName}</Text>

          <ScrollView className="mb-4">
            <Text className="text-sm text-neutral-700 mb-4">
              Este grupo requiere que compartas los siguientes documentos:
            </Text>

            {requirements.map((req: any, idx: number) => (
              <View
                key={idx}
                className={`flex-row items-center p-3 mb-2 rounded-lg border ${
                  req.is_required ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <Text className="text-2xl mr-3">{DOC_EMOJI[req.doc_type]}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-neutral-900">
                    {DOC_LABEL[req.doc_type]}
                  </Text>
                  <Text
                    className={`text-xs font-semibold ${
                      req.is_required ? 'text-red-700' : 'text-yellow-700'
                    }`}
                  >
                    {req.is_required ? 'Obligatorio' : 'Opcional'}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => setAccepted(!accepted)}
              className="flex-row items-center mt-4 p-3 bg-neutral-100 rounded-lg"
            >
              <View
                className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                  accepted ? 'bg-primary-500 border-primary-500' : 'border-neutral-400'
                }`}
              >
                {accepted && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className="text-sm text-neutral-700 flex-1">
                He leído y acepto compartir estos documentos con el grupo
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onReject}
              className="flex-1 bg-neutral-200 py-3 rounded-lg items-center"
            >
              <Text className="text-neutral-700 font-semibold">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!accepted) {
                  Alert.alert('Atención', 'Debes aceptar los términos para unirte');
                  return;
                }
                onAccept();
              }}
              className={`flex-1 py-3 rounded-lg items-center ${
                accepted ? 'bg-primary-500' : 'bg-neutral-300'
              }`}
              disabled={!accepted}
            >
              <Text className={`font-semibold ${accepted ? 'text-white' : 'text-neutral-500'}`}>
                Unirme al Grupo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

