import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabase';
import { updateDocumentInfo, updateDocumentFields, addDocumentFile, deleteDocumentFile, updateDocumentFileName } from '../services/documents.service';
import type { UserDocument, DocumentFile } from '../types/documents.types';
import { PassportStampsModal, PassportStamp } from './PassportStampsModal';
import { 
  DNI_FIELDS, 
  NIE_FIELDS, 
  TIE_FIELDS, 
  PASSPORT_FIELDS, 
  DRIVING_FIELDS,
  DocumentField 
} from '../constants/documentTypes';
import { FIELD_LABELS } from '../constants/documentFieldsSections';

// Tipos de documentos para selector
const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI', emoji: '🪪' },
  { value: 'NIE', label: 'NIE', emoji: '🪪' },
  { value: 'TIE', label: 'TIE', emoji: '🪪' },
  { value: 'passport', label: 'Pasaporte', emoji: '🛂' },
  { value: 'driving', label: 'Conducción', emoji: '🚗' },
  { value: 'health', label: 'Salud', emoji: '🏥' },
  { value: 'financial', label: 'Financiero', emoji: '💳' },
  { value: 'other', label: 'Otro', emoji: '📄' },
];

// Mapeo de tipos a campos
const FIELD_TEMPLATES_MAP: Record<string, DocumentField[]> = {
  'DNI': DNI_FIELDS,
  'NIE': NIE_FIELDS,
  'TIE': TIE_FIELDS,
  'passport': PASSPORT_FIELDS,
  'driving': DRIVING_FIELDS,
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
  
  // Sellos de pasaporte
  const [passportStamps, setPassportStamps] = useState<PassportStamp[]>([]);
  const [stampsModalVisible, setStampsModalVisible] = useState(false);

  // Actualizar estados cuando el documento cambia o el modal se abre
  useEffect(() => {
    if (visible) {
      setTitle(document.title);
      setType(document.type);
      setFields(document.fields || {});
      setFiles(document.files || []);
      
      // Cargar sellos si es pasaporte
      if (document.type === 'passport' && document.fields?.stamps && Array.isArray(document.fields.stamps)) {
        console.log('🔵 Cargando sellos en EditModal:', document.fields.stamps.length);
        setPassportStamps(document.fields.stamps);
      } else {
        setPassportStamps([]);
      }
    }
  }, [document, visible]);

  // Obtener campos dinámicos según tipo
  const documentFields = FIELD_TEMPLATES_MAP[type] || [];

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
      
      // Incluir stamps en fields si es pasaporte
      const fieldsToSave = { ...fields };
      if (type === 'passport') {
        if (passportStamps.length > 0) {
          console.log('🔵 Guardando', passportStamps.length, 'sellos en BD');
          fieldsToSave.stamps = passportStamps;
        } else {
          delete fieldsToSave.stamps; // Eliminar si no hay sellos
        }
      }
      
      await updateDocumentFields(document.id, fieldsToSave);
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

          {/* Tipo - Solo lectura */}
          <View className="bg-neutral-100 border border-neutral-200 rounded-lg p-4 mb-4">
            <Text className="text-sm text-neutral-600 mb-1">Tipo de Documento</Text>
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">
                {DOCUMENT_TYPES.find(t => t.value === type)?.emoji || '📄'}
              </Text>
              <Text className="text-base font-semibold text-neutral-800">
                {DOCUMENT_TYPES.find(t => t.value === type)?.label || type}
              </Text>
            </View>
            <Text className="text-xs text-neutral-500 mt-1">
              El tipo no se puede cambiar después de crear el documento
            </Text>
          </View>

          {/* Campos dinámicos según tipo */}
          {documentFields.length > 0 && (
            <View className="bg-white rounded-lg p-4 mb-4 border border-neutral-200">
              <Text className="text-base font-semibold mb-3">📝 Campos del Documento</Text>
              {documentFields.map((field) => {
                const label = FIELD_LABELS[field.key] || field.label;
                return (
                  <View key={field.key} className="mb-3">
                    <Text className="text-sm text-neutral-700 mb-1">
                      {label}
                      {field.required && <Text className="text-red-500"> *</Text>}
                    </Text>
                    <TextInput
                      value={fields[field.key] || ''}
                      onChangeText={(v) => setFields({ ...fields, [field.key]: v })}
                      className="bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-3"
                      placeholder={field.placeholder || `Ingresa ${label.toLowerCase()}`}
                      maxLength={field.maxLength}
                    />
                    {field.format && (
                      <Text className="text-xs text-neutral-500 mt-1">
                        Formato: {field.format}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Sellos de Pasaporte (solo passport) - MOVIDO AQUÍ */}
          {type === 'passport' && (
            <View className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <Text className="text-sm font-semibold text-purple-900 mb-2">✈️ Países Visitados</Text>
              {passportStamps.length > 0 ? (
                <View className="mb-3">
                  <Text className="text-sm text-purple-800 font-semibold mb-2">
                    {new Set(passportStamps.map(s => s.pais.toLowerCase().trim())).size} país{new Set(passportStamps.map(s => s.pais.toLowerCase().trim())).size !== 1 ? 'es' : ''} • {passportStamps.length} sello{passportStamps.length !== 1 ? 's' : ''}
                  </Text>
                  {passportStamps.slice(0, 2).map((stamp, idx) => (
                    <View key={idx} className="bg-white rounded p-2 mb-1 border border-purple-100">
                      <Text className="text-xs text-neutral-800">
                        {stamp.paisEmoji || '🌍'} {stamp.pais} - {stamp.fechaEntrada}
                      </Text>
                    </View>
                  ))}
                  {passportStamps.length > 2 && (
                    <Text className="text-xs text-purple-600 italic">
                      ...y {passportStamps.length - 2} más
                    </Text>
                  )}
                </View>
              ) : (
                <Text className="text-xs text-purple-700 mb-3">Aún no has añadido sellos</Text>
              )}
              <TouchableOpacity
                onPress={() => setStampsModalVisible(true)}
                className="bg-purple-200 rounded-lg p-3 items-center"
              >
                <Text className="text-purple-800 font-semibold">
                  {passportStamps.length > 0 ? '✏️ Gestionar Sellos' : '➕ Añadir Sellos'}
                </Text>
              </TouchableOpacity>
            </View>
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

      {/* Modal de sellos de pasaporte */}
      <PassportStampsModal
        visible={stampsModalVisible}
        stamps={passportStamps}
        onClose={() => setStampsModalVisible(false)}
        onSave={(stamps) => {
          console.log('🔵 Recibiendo', stamps.length, 'sellos en EditModal');
          setPassportStamps(stamps);
          setStampsModalVisible(false);
        }}
      />
    </Modal>
  );
}

