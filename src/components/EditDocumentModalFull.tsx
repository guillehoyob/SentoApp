import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { supabase } from '../services/supabase';
import { updateDocumentInfo, updateDocumentFields, addDocumentFile, deleteDocumentFile, updateDocumentFileName } from '../services/documents.service';
import type { UserDocument, DocumentFile } from '../types/documents.types';

const TYPES = [
  { value: 'passport', label: 'Pasaporte', emoji: '🛂' },
  { value: 'id_card', label: 'DNI/Cédula', emoji: '🪪' },
  { value: 'insurance', label: 'Seguro', emoji: '🏥' },
  { value: 'license', label: 'Licencia', emoji: '🚗' },
  { value: 'other', label: 'Otro', emoji: '📄' },
];

const FIELD_TEMPLATES: Record<string, string[]> = {
  passport: ['Número', 'Fecha Expedición', 'Fecha Caducidad', 'País'],
  id_card: ['Número', 'Fecha Expedición', 'Fecha Caducidad'],
  insurance: ['Nº Póliza', 'Proveedor', 'Fecha Caducidad', 'Tel. Emergencia'],
  license: ['Número', 'Clase', 'Fecha Caducidad', 'País'],
  other: [],
};

interface Props {
  visible: boolean;
  document: UserDocument;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDocumentModalFull({ visible, document, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(document.title);
  const [type, setType] = useState(document.type);
  const [fields, setFields] = useState(document.fields || {});
  const [files, setFiles] = useState<DocumentFile[]>(document.files || []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');

  // Actualizar estados cuando el documento cambia
  useEffect(() => {
    setTitle(document.title);
    setType(document.type);
    setFields(document.fields || {});
    setFiles(document.files || []);
  }, [document]);

  const fieldNames = FIELD_TEMPLATES[type] || [];

  const handleAddFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setUploading(true);
      const file = result.assets[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Crypto.randomUUID()}.${fileExt}`;
      const storagePath = `${document.owner_id}/${document.id}/${fileName}`;

      const arrayBuffer = await fetch(file.uri).then((r) => r.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, arrayBuffer, { contentType: file.mimeType });

      if (uploadError) throw uploadError;

      await addDocumentFile(document.id, storagePath, file.name, file.mimeType || 'application/pdf', file.size || 0);

      // Recargar archivos desde BD
      const { data, error } = await supabase.rpc('get_my_documents');
      if (error) throw error;
      const updatedDoc = data?.find((d: any) => d.id === document.id);
      if (updatedDoc?.files) {
        setFiles(updatedDoc.files);
      }

      Alert.alert('¡Añadido!', 'Archivo añadido');
    } catch (error) {
      console.error('Error adding file:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    Alert.alert('Eliminar archivo', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocumentFile(fileId);
            setFiles(files.filter((f) => f.id !== fileId));
            Alert.alert('¡Eliminado!', 'Archivo eliminado');
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Error');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Ingresa un título');
      return;
    }
    try {
      setSaving(true);
      
      // Guardar nombre de archivo si está editando
      if (editingFileId && editingFileName.trim()) {
        await updateDocumentFileName(editingFileId, editingFileName.trim());
        setEditingFileId(null);
      }
      
      await updateDocumentInfo(document.id, title.trim(), type);
      await updateDocumentFields(document.id, fields);
      Alert.alert('¡Actualizado!', 'Documento actualizado');
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-neutral-50">
        <View className="bg-white border-b border-neutral-200 px-6 pt-16 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-h2 font-display font-bold">Editar Documento</Text>
            <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center">
              <Text className="text-xl">✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          {/* Título */}
          <Text className="text-base font-semibold mb-2">Título</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            className="bg-white border border-neutral-200 rounded-lg px-4 py-3 mb-4"
          />

          {/* Tipo */}
          <Text className="text-base font-semibold mb-2">Tipo</Text>
          <View className="flex-row flex-wrap mb-4">
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setType(t.value)}
                className={`mr-2 mb-2 px-4 py-2 rounded-lg border-2 flex-row ${
                  type === t.value ? 'bg-primary-50 border-primary-500' : 'bg-white border-neutral-200'
                }`}
              >
                <Text className="text-lg mr-1">{t.emoji}</Text>
                <Text className={`text-sm ${type === t.value ? 'text-primary-700 font-semibold' : 'text-neutral-700'}`}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campos */}
          {fieldNames.length > 0 && (
            <>
              <Text className="text-base font-semibold mb-2">Campos</Text>
              {fieldNames.map((name) => (
                <View key={name} className="mb-3">
                  <Text className="text-sm text-neutral-600 mb-1">{name}</Text>
                  <TextInput
                    value={fields[name] || ''}
                    onChangeText={(v) => setFields({ ...fields, [name]: v })}
                    className="bg-white border border-neutral-200 rounded-lg px-4 py-3"
                    placeholder={`Ingresa ${name.toLowerCase()}`}
                  />
                </View>
              ))}
            </>
          )}

          {/* Archivos */}
          <Text className="text-base font-semibold mb-2 mt-4">Archivos ({files.length})</Text>
          {files.map((file) => (
            <View key={file.id} className="bg-white border border-neutral-200 rounded-lg p-3 mb-2">
              {editingFileId === file.id ? (
                <View className="flex-row items-center">
                  <TextInput
                    value={editingFileName}
                    onChangeText={setEditingFileName}
                    className="flex-1 border border-neutral-300 rounded px-2 py-1 mr-2"
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await updateDocumentFileName(file.id, editingFileName);
                        setFiles(files.map(f => f.id === file.id ? {...f, file_name: editingFileName} : f));
                        setEditingFileId(null);
                        Alert.alert('Guardado', 'Nombre actualizado');
                      } catch (error) {
                        Alert.alert('Error', error instanceof Error ? error.message : 'Error');
                      }
                    }}
                    className="bg-green-100 px-3 py-2 rounded mr-1"
                  >
                    <Text className="text-xs">✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditingFileId(null)}
                    className="bg-neutral-100 px-3 py-2 rounded"
                  >
                    <Text className="text-xs">✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{file.mime_type.includes('pdf') ? '📄' : '🖼️'}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium">{file.file_name}</Text>
                    <Text className="text-xs text-neutral-500">{(file.size_bytes / 1024).toFixed(1)} KB</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingFileId(file.id);
                      setEditingFileName(file.file_name);
                    }}
                    className="bg-blue-100 px-3 py-2 rounded mr-1"
                  >
                    <Text className="text-xs">✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteFile(file.id)} className="bg-red-100 px-3 py-2 rounded">
                    <Text className="text-xs">🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={handleAddFile}
            disabled={uploading}
            className="bg-neutral-200 py-3 rounded-lg items-center mb-6"
          >
            {uploading ? (
              <ActivityIndicator color="#666" />
            ) : (
              <Text className="text-neutral-700 font-semibold">+ Añadir Archivo</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <View className="bg-white border-t border-neutral-200 px-6 py-4">
          <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-primary-500 py-4 rounded-xl items-center">
            <Text className="text-white font-semibold">{saving ? 'Guardando...' : 'Guardar Cambios'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

