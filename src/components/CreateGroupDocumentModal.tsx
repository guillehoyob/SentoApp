import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabase';
import {
  createGroupDocument,
  addGroupDocumentFile,
  GROUP_DOCUMENT_TYPES_ARRAY,
} from '../services/groupDocuments.service';

interface Props {
  visible: boolean;
  groupId: string;
  groupMembers?: Array<{ user_id: string; user: { full_name: string; email: string } }>;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGroupDocumentModal({
  visible,
  groupId,
  groupMembers,
  onClose,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('other');
  const [description, setDescription] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{ uri: string; name: string; size: number; mimeType: string }>
  >([]);
  const [uploading, setUploading] = useState(false);

  const handleReset = () => {
    setTitle('');
    setType('other');
    setDescription('');
    setTaggedUsers([]);
    setSelectedFiles([]);
  };

  const handleSelectFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) return;

      setSelectedFiles([
        ...selectedFiles,
        ...result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream',
        })),
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron seleccionar archivos');
    }
  };

  const handleToggleTag = (userId: string) => {
    if (taggedUsers.includes(userId)) {
      setTaggedUsers(taggedUsers.filter((id) => id !== userId));
    } else {
      setTaggedUsers([...taggedUsers, userId]);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (selectedFiles.length === 0) {
      Alert.alert('Error', 'Debes subir al menos un archivo');
      return;
    }

    try {
      setUploading(true);

      // 1. Crear documento
      const docId = await createGroupDocument(
        groupId,
        title.trim(),
        type,
        description.trim(),
        taggedUsers
      );

      // 2. Subir archivos
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Crypto.randomUUID()}.${fileExt}`;
        const storagePath = `${groupId}/${docId}/${fileName}`;

        console.log(`📂 Subiendo archivo ${i + 1}/${selectedFiles.length}: ${file.name}`);

        // Leer archivo como base64
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Convertir a bytes
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        // Subir a Storage
        const { error: uploadError } = await supabase.storage
          .from('group-documents')
          .upload(storagePath, bytes, {
            contentType: file.mimeType,
            upsert: false,
          });

        if (uploadError) {
          console.error('Error subiendo archivo:', uploadError);
          throw uploadError;
        }

        // Registrar en BD
        await addGroupDocumentFile(docId, storagePath, file.name, file.mimeType, file.size);
      }

      Alert.alert('✅ Éxito', 'Documento de grupo creado');
      handleReset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creando documento de grupo:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-neutral-50">
        {/* Header */}
        <View className="bg-white border-b border-neutral-200 px-6 pt-16 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-h2 font-display font-bold">Nuevo Documento</Text>
            <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center">
              <Text className="text-xl">✕</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-neutral-600 mt-1">Documento del grupo</Text>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          {/* Título */}
          <Text className="text-base font-semibold mb-2">Título *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            className="bg-white border border-neutral-200 rounded-lg px-4 py-3 mb-4"
            placeholder="Ej: Reserva Hotel Ibiza"
          />

          {/* Tipo */}
          <Text className="text-base font-semibold mb-2">Tipo de Documento *</Text>
          <View className="flex-row flex-wrap mb-4">
            {GROUP_DOCUMENT_TYPES_ARRAY.map((docType) => (
              <TouchableOpacity
                key={docType.value}
                onPress={() => setType(docType.value)}
                className={`mr-2 mb-2 px-3 py-2 rounded-lg border-2 flex-row ${
                  type === docType.value
                    ? 'bg-primary-50 border-primary-500'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <Text className="text-base mr-1">{docType.emoji}</Text>
                <Text
                  className={`text-sm ${
                    type === docType.value ? 'text-primary-700 font-semibold' : 'text-neutral-700'
                  }`}
                >
                  {docType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Descripción */}
          <Text className="text-base font-semibold mb-2">Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            className="bg-white border border-neutral-200 rounded-lg px-4 py-3 mb-4"
            placeholder="Detalles adicionales..."
            multiline
            numberOfLines={3}
          />

          {/* Etiquetar Participantes */}
          <Text className="text-base font-semibold mb-2">Etiquetar Participantes</Text>
          <View className="bg-white rounded-lg p-3 mb-4 border border-neutral-200">
            {!groupMembers || groupMembers.length === 0 ? (
              <Text className="text-sm text-neutral-500">No hay otros miembros en el grupo</Text>
            ) : (
              groupMembers.map((member) => (
                <TouchableOpacity
                  key={member.user_id}
                  onPress={() => handleToggleTag(member.user_id)}
                  className="flex-row items-center justify-between py-2 border-b border-neutral-100"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-neutral-800">
                      {member.user.full_name || member.user.email}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded items-center justify-center ${
                      taggedUsers.includes(member.user_id)
                        ? 'bg-primary-500'
                        : 'bg-neutral-200'
                    }`}
                  >
                    {taggedUsers.includes(member.user_id) && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Archivos */}
          <Text className="text-base font-semibold mb-2">Archivos *</Text>
          {selectedFiles.map((file, idx) => (
            <View key={idx} className="bg-white rounded-lg p-3 mb-2 border border-neutral-200 flex-row items-center">
              <Text className="text-2xl mr-3">
                {file.mimeType.includes('pdf') ? '📄' : '🖼️'}
              </Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-neutral-800">{file.name}</Text>
                <Text className="text-xs text-neutral-500">
                  {(file.size / 1024).toFixed(1)} KB
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                className="bg-red-100 px-3 py-2 rounded"
              >
                <Text className="text-xs">🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSelectFiles}
            disabled={uploading}
            className="bg-neutral-200 py-3 rounded-lg items-center mb-6"
          >
            <Text className="text-neutral-700 font-semibold">+ Añadir Archivos</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View className="bg-white border-t border-neutral-200 px-6 py-4">
          <TouchableOpacity
            onPress={handleCreate}
            disabled={uploading}
            className="bg-primary-500 py-4 rounded-xl items-center"
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Crear Documento</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

