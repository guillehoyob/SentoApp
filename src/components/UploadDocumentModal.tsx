// ===================================================================
// UPLOAD DOCUMENT MODAL - Modal para subir documentos al vault
// ===================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabase';
import { createPersonalDocument } from '../services/documents.service';
import type { DocumentType } from '../types/documents.types';

interface UploadDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DOCUMENT_TYPES: Array<{ value: DocumentType; label: string; emoji: string }> = [
  { value: 'passport', label: 'Pasaporte', emoji: '🛂' },
  { value: 'id_card', label: 'DNI/Cédula', emoji: '🪪' },
  { value: 'insurance', label: 'Seguro Médico', emoji: '🏥' },
  { value: 'license', label: 'Licencia de Conducir', emoji: '🚗' },
  { value: 'other', label: 'Otro', emoji: '📄' },
];

export function UploadDocumentModal({ visible, onClose, onSuccess }: UploadDocumentModalProps) {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      
      // Validar tamaño (10MB max)
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert('Error', 'El archivo es demasiado grande. Máximo 10MB.');
        return;
      }

      setSelectedFile(file);
      
      // Auto-fill title si está vacío
      if (!title && file.name) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleUpload = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Selecciona un tipo de documento');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Ingresa un título');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Selecciona un archivo');
      return;
    }

    try {
      setUploading(true);

      // Obtener usuario actual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuario no autenticado');

      // Generar ID único para el documento
      const documentId = crypto.randomUUID();
      
      // Generar path para Storage
      const timestamp = Date.now();
      const extension = selectedFile.name.split('.').pop();
      const storagePath = `${userData.user.id}/${documentId}/${timestamp}.${extension}`;

      // Leer el archivo como base64
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convertir base64 a Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Subir a Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, bytes, {
          contentType: selectedFile.mimeType || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Crear registro en BD
      await createPersonalDocument({
        type: selectedType,
        title: title.trim(),
        storage_path: storagePath,
        mime_type: selectedFile.mimeType || 'application/octet-stream',
        size_bytes: selectedFile.size || 0,
        encrypted: false,
      });

      Alert.alert('¡Éxito!', 'Documento subido correctamente');
      
      // Reset y cerrar
      setSelectedType(null);
      setTitle('');
      setSelectedFile(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setSelectedType(null);
    setTitle('');
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-neutral-50">
        {/* Header */}
        <View className="bg-white border-b border-neutral-200 px-6 pt-16 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-h2 font-display font-bold text-neutral-900">
              Subir Documento
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={uploading}
              className="w-10 h-10 items-center justify-center"
            >
              <Text className="text-xl text-neutral-600">✕</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm font-body text-neutral-600">
            Añade un documento a tu vault personal
          </Text>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          {/* Tipo de documento */}
          <Text className="text-base font-semibold text-neutral-800 mb-3">
            Tipo de documento *
          </Text>
          <View className="flex-row flex-wrap mb-6">
            {DOCUMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setSelectedType(type.value)}
                disabled={uploading}
                className={`mr-2 mb-2 px-4 py-3 rounded-lg border-2 flex-row items-center ${
                  selectedType === type.value
                    ? 'bg-primary-50 border-primary-500'
                    : 'bg-white border-neutral-200'
                }`}
              >
                <Text className="text-xl mr-2">{type.emoji}</Text>
                <Text
                  className={`text-sm font-medium ${
                    selectedType === type.value ? 'text-primary-700' : 'text-neutral-700'
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Título */}
          <Text className="text-base font-semibold text-neutral-800 mb-3">Título *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Pasaporte vigente 2024"
            editable={!uploading}
            className="bg-white border border-neutral-200 rounded-lg px-4 py-3 text-base font-body text-neutral-900 mb-6"
          />

          {/* Selector de archivo */}
          <Text className="text-base font-semibold text-neutral-800 mb-3">Archivo *</Text>
          <TouchableOpacity
            onPress={handlePickDocument}
            disabled={uploading}
            className="bg-white border-2 border-dashed border-neutral-300 rounded-lg p-6 items-center mb-4"
          >
            {selectedFile ? (
              <>
                <Text className="text-4xl mb-2">📎</Text>
                <Text className="text-sm font-medium text-neutral-800 mb-1">
                  {selectedFile.name}
                </Text>
                <Text className="text-xs text-neutral-600">
                  {(selectedFile.size! / 1024).toFixed(2)} KB
                </Text>
              </>
            ) : (
              <>
                <Text className="text-4xl mb-2">📁</Text>
                <Text className="text-sm font-medium text-neutral-800 mb-1">
                  Seleccionar archivo
                </Text>
                <Text className="text-xs text-neutral-600">
                  PDF o imagen (max 10MB)
                </Text>
              </>
            )}
          </TouchableOpacity>

          {selectedFile && (
            <TouchableOpacity
              onPress={() => setSelectedFile(null)}
              disabled={uploading}
              className="items-center mb-6"
            >
              <Text className="text-sm text-primary-600 font-medium">Cambiar archivo</Text>
            </TouchableOpacity>
          )}

          {/* Info */}
          <View className="bg-blue-50 p-4 rounded-lg mb-6">
            <Text className="text-xs font-body text-blue-800">
              💡 Tu documento se guardará de forma privada en tu vault. Podrás compartirlo con tus grupos cuando quieras.
            </Text>
          </View>
        </ScrollView>

        {/* Footer con botones */}
        <View className="bg-white border-t border-neutral-200 px-6 py-4">
          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading || !selectedType || !title.trim() || !selectedFile}
            className={`py-4 rounded-xl items-center ${
              uploading || !selectedType || !title.trim() || !selectedFile
                ? 'bg-neutral-300'
                : 'bg-primary-500'
            }`}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Subir Documento</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

