import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

interface Props {
  visible: boolean;
  groupId: string;
  groupName: string;
  onJoin: (documentsToShare: string[]) => Promise<void>;
  onCancel: () => void;
}

interface Requirement {
  doc_type: string;
  is_required: boolean;
}

interface UserDocument {
  id: string;
  type: string;
  title: string;
}

const DOC_EMOJI: Record<string, string> = {
  passport: '🛂',
  id_card: '🪪',
  insurance: '🏥',
  license: '🚗',
  other: '📄',
};

const DOC_LABEL: Record<string, string> = {
  passport: 'Pasaporte',
  id_card: 'DNI/Cédula',
  insurance: 'Seguro',
  license: 'Licencia',
  other: 'Otro',
};

export function GroupOnboardingModalFull({ visible, groupId, groupName, onJoin, onCancel }: Props) {
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [userDocs, setUserDocs] = useState<UserDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    } else {
      // Reset al cerrar
      setSelectedDocs(new Set());
      setAccepted(false);
    }
  }, [visible, groupId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar requisitos del grupo
      const { data: reqData, error: reqError } = await supabase.rpc('get_group_requirements', {
        p_group_id: groupId,
      });
      if (reqError) throw reqError;
      setRequirements(reqData || []);

      // Cargar documentos del usuario
      const { data: docsData, error: docsError } = await supabase.rpc('get_my_documents');
      if (docsError) throw docsError;
      setUserDocs(docsData || []);

    } catch (error) {
      console.error('Error loading onboarding data:', error);
      Alert.alert('Error', 'No se pudieron cargar los requisitos del grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!accepted) {
      Alert.alert('Atención', 'Debes aceptar los términos para unirte');
      return;
    }

    // Verificar que tenga todos los documentos obligatorios
    const requiredTypes = requirements.filter(r => r.is_required).map(r => r.doc_type);
    const missingRequired = requiredTypes.filter(type => 
      !userDocs.some(doc => doc.type === type)
    );

    if (missingRequired.length > 0) {
      const missingNames = missingRequired.map(type => DOC_LABEL[type]).join(', ');
      Alert.alert(
        '⚠️ Documentos Faltantes',
        `Te faltan documentos obligatorios: ${missingNames}\n\nPuedes unirte, pero deberás subirlos y compartirlos después.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Unirme Igualmente', onPress: () => executeJoin() }
        ]
      );
      return;
    }

    // Verificar que haya seleccionado los obligatorios
    const selectedTypes = Array.from(selectedDocs).map(docId => 
      userDocs.find(d => d.id === docId)?.type
    ).filter(Boolean);

    const missingSelectedRequired = requiredTypes.filter(type => 
      !selectedTypes.includes(type)
    );

    if (missingSelectedRequired.length > 0) {
      const missingNames = missingSelectedRequired.map(type => DOC_LABEL[type]).join(', ');
      Alert.alert(
        '⚠️ No Has Seleccionado Obligatorios',
        `Debes marcar para compartir: ${missingNames}`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    await executeJoin();
  };

  const executeJoin = async () => {
    try {
      setJoining(true);
      await onJoin(Array.from(selectedDocs));
    } catch (error) {
      console.error('Error joining:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al unirse');
    } finally {
      setJoining(false);
    }
  };

  const toggleDoc = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const getUserDocsForType = (type: string) => {
    return userDocs.filter(doc => doc.type === type);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-lg max-h-[90%]">
          <Text className="text-2xl font-bold text-neutral-900 mb-xs">
            Requisitos del Grupo
          </Text>
          <Text className="text-sm text-neutral-600 mb-md">{groupName}</Text>

          {loading ? (
            <View className="py-3xl items-center">
              <ActivityIndicator size="large" color="#FF5050" />
            </View>
          ) : requirements.length === 0 ? (
            <View>
              <Text className="text-sm text-neutral-600 mb-lg">
                Este grupo no tiene requisitos de documentos.
              </Text>
              <TouchableOpacity
                onPress={() => executeJoin()}
                className="bg-primary py-lg rounded-xl items-center"
                disabled={joining}
              >
                <Text className="text-white font-semibold text-lg">
                  {joining ? 'Uniéndose...' : 'Unirme al Grupo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onCancel} className="py-md items-center mt-sm">
                <Text className="text-neutral-600">Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView className="mb-md">
              <Text className="text-sm text-neutral-700 mb-md">
                Selecciona los documentos que deseas compartir con el grupo:
              </Text>

              {requirements.map((req, idx) => {
                const userDocsOfType = getUserDocsForType(req.doc_type);
                const hasDoc = userDocsOfType.length > 0;

                return (
                  <View key={idx} className="mb-md">
                    <View
                      className={`flex-row items-center p-md rounded-lg border-2 ${
                        req.is_required ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
                      }`}
                    >
                      <Text className="text-2xl mr-sm">{DOC_EMOJI[req.doc_type]}</Text>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-neutral-900">
                          {DOC_LABEL[req.doc_type]}
                        </Text>
                        <Text
                          className={`text-xs font-semibold ${
                            req.is_required ? 'text-red-700' : 'text-yellow-700'
                          }`}
                        >
                          {req.is_required ? '⚠️ Obligatorio' : 'Opcional'}
                        </Text>
                      </View>
                      {hasDoc ? (
                        <Text className="text-green-600 font-semibold text-xs">✓ Tienes {userDocsOfType.length}</Text>
                      ) : (
                        <Text className="text-red-600 font-semibold text-xs">✗ No tienes</Text>
                      )}
                    </View>

                    {/* Documentos del usuario de este tipo */}
                    {hasDoc && userDocsOfType.map(doc => (
                      <TouchableOpacity
                        key={doc.id}
                        onPress={() => toggleDoc(doc.id)}
                        className={`flex-row items-center p-sm ml-lg mt-xs rounded border ${
                          selectedDocs.has(doc.id)
                            ? 'bg-green-50 border-green-400'
                            : 'bg-neutral-50 border-neutral-300'
                        }`}
                      >
                        <View
                          className={`w-5 h-5 rounded border-2 mr-sm items-center justify-center ${
                            selectedDocs.has(doc.id)
                              ? 'bg-green-500 border-green-500'
                              : 'border-neutral-400'
                          }`}
                        >
                          {selectedDocs.has(doc.id) && <Text className="text-white text-xs">✓</Text>}
                        </View>
                        <Text className="text-sm text-neutral-800 flex-1">{doc.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}

              {/* Checkbox aceptar términos */}
              <TouchableOpacity
                onPress={() => setAccepted(!accepted)}
                className="flex-row items-center mt-md p-md bg-neutral-100 rounded-lg"
              >
                <View
                  className={`w-6 h-6 rounded border-2 mr-sm items-center justify-center ${
                    accepted ? 'bg-primary border-primary' : 'border-neutral-400'
                  }`}
                >
                  {accepted && <Text className="text-white text-xs">✓</Text>}
                </View>
                <Text className="text-sm text-neutral-700 flex-1">
                  Acepto compartir los documentos seleccionados con este grupo
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {requirements.length > 0 && (
            <View className="flex-row gap-sm">
              <TouchableOpacity
                onPress={onCancel}
                className="flex-1 bg-neutral-200 py-lg rounded-xl items-center"
                disabled={joining}
              >
                <Text className="text-neutral-700 font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleJoin}
                className={`flex-1 py-lg rounded-xl items-center ${
                  accepted && !joining ? 'bg-primary' : 'bg-neutral-300'
                }`}
                disabled={!accepted || joining}
              >
                <Text className={`font-semibold ${accepted && !joining ? 'text-white' : 'text-neutral-500'}`}>
                  {joining ? 'Uniéndose...' : 'Unirme'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

