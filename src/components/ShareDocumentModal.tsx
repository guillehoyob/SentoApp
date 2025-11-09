// ===================================================================
// SHARE DOCUMENT MODAL - Modal para compartir documentos con grupos
// ===================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useGroups } from '../hooks/useGroups';
import { shareDocumentWithGroup, getShareTypeLabel } from '../services/documents.service';
import type { ShareType } from '../types/documents.types';

interface ShareDocumentModalProps {
  visible: boolean;
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SHARE_TYPES: Array<{
  value: ShareType;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    value: 'permanent',
    label: 'Permanente',
    description: 'Siempre visible',
    emoji: '♾️',
  },
  {
    value: 'trip_linked',
    label: 'Ligado al viaje',
    description: 'Se activa/oculta con las fechas',
    emoji: '📅',
  },
  {
    value: 'temporary',
    label: 'Temporal',
    description: 'Por X días personalizados',
    emoji: '⏳',
  },
  {
    value: 'manual',
    label: 'Manual',
    description: 'Hasta que lo ocultes',
    emoji: '✋',
  },
  {
    value: 'scheduled',
    label: 'Programado',
    description: 'Desde fecha X hasta Y',
    emoji: '🗓️',
  },
];

const DURATION_OPTIONS = [
  { value: 7, label: '7 días' },
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
];

export function ShareDocumentModal({
  visible,
  documentId,
  documentTitle,
  onClose,
  onSuccess,
}: ShareDocumentModalProps) {
  const { groups, loading: loadingGroups } = useGroups();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ShareType>('manual');
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [sharing, setSharing] = useState(false);

  // Reset al abrir
  useEffect(() => {
    if (visible) {
      setSelectedGroup(null);
      setSelectedType('manual');
      setSelectedDuration(7);
    }
  }, [visible]);

  const handleShare = async () => {
    if (!selectedGroup) {
      Alert.alert('Error', 'Selecciona un grupo');
      return;
    }

    try {
      setSharing(true);

      await shareDocumentWithGroup({
        documentId,
        groupId: selectedGroup,
        shareType: selectedType,
        expiresInDays: selectedType === 'temporary' ? selectedDuration : undefined,
      });

      Alert.alert('¡Éxito!', 'Documento compartido correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al compartir');
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    if (sharing) return;
    onClose();
  };

  const needsDuration = selectedType === 'temporary';

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-neutral-50">
        {/* Header */}
        <View className="bg-white border-b border-neutral-200 px-6 pt-16 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-h2 font-display font-bold text-neutral-900">
              Compartir Documento
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={sharing}
              className="w-10 h-10 items-center justify-center"
            >
              <Text className="text-xl text-neutral-600">✕</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm font-body text-neutral-600" numberOfLines={1}>
            {documentTitle}
          </Text>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          {/* Selector de grupo */}
          <Text className="text-base font-semibold text-neutral-800 mb-3">
            Compartir con *
          </Text>
          {loadingGroups ? (
            <ActivityIndicator color="#FF5050" />
          ) : groups.length === 0 ? (
            <View className="bg-neutral-100 p-4 rounded-lg mb-6">
              <Text className="text-sm text-neutral-600 text-center">
                No tienes grupos creados aún
              </Text>
            </View>
          ) : (
            <View className="mb-6">
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => setSelectedGroup(group.id)}
                  disabled={sharing}
                  className={`mb-2 p-4 rounded-lg border-2 ${
                    selectedGroup === group.id
                      ? 'bg-primary-50 border-primary-500'
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text
                        className={`text-base font-medium ${
                          selectedGroup === group.id
                            ? 'text-primary-700'
                            : 'text-neutral-800'
                        }`}
                      >
                        {group.type === 'trip' ? '✈️' : '👥'} {group.name}
                      </Text>
                      {group.destination && (
                        <Text className="text-xs text-neutral-600 mt-1">
                          📍 {group.destination}
                        </Text>
                      )}
                    </View>
                    {selectedGroup === group.id && (
                      <View className="w-6 h-6 bg-primary-500 rounded-full items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tipo de permiso */}
          <Text className="text-base font-semibold text-neutral-800 mb-3">
            Tipo de permiso *
          </Text>
          <View className="mb-6">
            {SHARE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setSelectedType(type.value)}
                disabled={sharing}
                className={`mb-2 p-4 rounded-lg border-2 ${
                  selectedType === type.value
                    ? 'bg-primary-50 border-primary-500'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <View className="flex-row items-start">
                  <Text className="text-2xl mr-3">{type.emoji}</Text>
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-medium ${
                        selectedType === type.value
                          ? 'text-primary-700'
                          : 'text-neutral-800'
                      }`}
                    >
                      {type.label}
                    </Text>
                    <Text className="text-xs text-neutral-600 mt-1">
                      {type.description}
                    </Text>
                  </View>
                  {selectedType === type.value && (
                    <View className="w-5 h-5 bg-primary-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duración (solo si es temporal) */}
          {needsDuration && (
            <>
              <Text className="text-base font-semibold text-neutral-800 mb-3">
                Duración *
              </Text>
              <View className="flex-row flex-wrap mb-6">
                {DURATION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setSelectedDuration(option.value)}
                    disabled={sharing}
                    className={`mr-2 mb-2 px-4 py-3 rounded-lg border-2 ${
                      selectedDuration === option.value
                        ? 'bg-primary-50 border-primary-500'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedDuration === option.value
                          ? 'text-primary-700'
                          : 'text-neutral-700'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Info */}
          <View className="bg-blue-50 p-4 rounded-lg mb-6">
            <Text className="text-xs font-body text-blue-800">
              💡 Los miembros del grupo podrán ver este documento según los permisos configurados. Puedes ocultarlo en cualquier momento.
            </Text>
          </View>
        </ScrollView>

        {/* Footer con botones */}
        <View className="bg-white border-t border-neutral-200 px-6 py-4">
          <TouchableOpacity
            onPress={handleShare}
            disabled={sharing || !selectedGroup}
            className={`py-4 rounded-xl items-center ${
              sharing || !selectedGroup ? 'bg-neutral-300' : 'bg-primary-500'
            }`}
          >
            {sharing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Compartir</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

