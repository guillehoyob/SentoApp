// ===================================================================
// UPLOAD DOCUMENT MODAL V2 - Dinámico con campos específicos
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
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabase';
import {
  DocumentCategory,
  IdentityCardSubtype,
  OtherDocType,
  getFieldsForDocumentType,
  getDocumentTypeLabel,
  OTHER_DOCUMENT_CATEGORIES,
  DocumentField,
} from '../constants/documentTypes';
import { PassportStampsModal, PassportStamp } from './PassportStampsModal';

interface UploadDocumentModalV2Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'category' | 'subtype' | 'form';

export function UploadDocumentModalV2({ visible, onClose, onSuccess }: UploadDocumentModalV2Props) {
  // Estado del wizard
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<DocumentCategory | null>(null);
  const [subtype, setSubtype] = useState<IdentityCardSubtype | null>(null);
  const [otherType, setOtherType] = useState<OtherDocType | null>(null);
  
  // Datos del formulario
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);
  
  // Sellos de pasaporte
  const [passportStamps, setPassportStamps] = useState<PassportStamp[]>([]);
  const [stampsModalVisible, setStampsModalVisible] = useState(false);
  
  // Archivo
  const [selectedFiles, setSelectedFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  
  // UI
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const reset = () => {
    setStep('category');
    setCategory(null);
    setSubtype(null);
    setOtherType(null);
    setTitle('');
    setFields({});
    setCustomFields([]);
    setPassportStamps([]);
    setSelectedFiles([]);
    setUploading(false);
    setUploadProgress('');
  };

  const handleClose = () => {
    if (!uploading) {
      reset();
      onClose();
    }
  };

  // ============================================================
  // PASO 1: Seleccionar categoría
  // ============================================================
  const renderCategoryStep = () => (
    <View className="p-6">
      <Text className="text-2xl font-bold mb-6 text-center">¿Qué tipo de documento?</Text>
      
      <TouchableOpacity
        className="bg-blue-100 rounded-xl p-5 mb-4 border-2 border-blue-300"
        onPress={() => {
          setCategory('identity_card');
          setStep('subtype');
        }}
      >
        <View className="flex-row items-center">
          <Text className="text-4xl mr-4">🪪</Text>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-blue-900">Tarjetas de Identidad</Text>
            <Text className="text-sm text-blue-700">DNI, NIE, TIE</Text>
          </View>
          <Text className="text-blue-500 text-2xl">→</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-purple-100 rounded-xl p-5 mb-4 border-2 border-purple-300"
        onPress={() => {
          setCategory('passport');
          setStep('form');
        }}
      >
        <View className="flex-row items-center">
          <Text className="text-4xl mr-4">🛂</Text>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-purple-900">Pasaporte</Text>
            <Text className="text-sm text-purple-700">Pasaporte español o extranjero</Text>
          </View>
          <Text className="text-purple-500 text-2xl">→</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-neutral-100 rounded-xl p-5 mb-4 border-2 border-neutral-300"
        onPress={() => {
          setCategory('other');
          setStep('subtype');
        }}
      >
        <View className="flex-row items-center">
          <Text className="text-4xl mr-4">📄</Text>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-neutral-900">Otros Documentos</Text>
            <Text className="text-sm text-neutral-700">Seguros, licencias, contratos...</Text>
          </View>
          <Text className="text-neutral-500 text-2xl">→</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-red-100 rounded-xl p-3 mt-4"
        onPress={handleClose}
      >
        <Text className="text-center text-red-700 font-semibold">Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  // ============================================================
  // PASO 2: Seleccionar subtipo (DNI/NIE/TIE u Otros)
  // ============================================================
  const renderSubtypeStep = () => {
    if (category === 'identity_card') {
      return (
        <View className="p-6">
          <TouchableOpacity onPress={() => setStep('category')} className="mb-4">
            <Text className="text-blue-600">← Volver</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold mb-6 text-center">Tipo de Tarjeta</Text>

          <TouchableOpacity
            className="bg-blue-100 rounded-xl p-4 mb-3 border border-blue-300"
            onPress={() => {
              setSubtype('DNI');
              setTitle('DNI');
              setStep('form');
            }}
          >
            <Text className="text-lg font-semibold text-blue-900">🇪🇸 DNI</Text>
            <Text className="text-sm text-blue-700">Documento Nacional de Identidad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-blue-100 rounded-xl p-4 mb-3 border border-blue-300"
            onPress={() => {
              setSubtype('NIE');
              setTitle('NIE');
              setStep('form');
            }}
          >
            <Text className="text-lg font-semibold text-blue-900">🌍 NIE</Text>
            <Text className="text-sm text-blue-700">Número de Identidad de Extranjero</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-blue-100 rounded-xl p-4 mb-3 border border-blue-300"
            onPress={() => {
              setSubtype('TIE');
              setTitle('TIE');
              setStep('form');
            }}
          >
            <Text className="text-lg font-semibold text-blue-900">🆔 TIE</Text>
            <Text className="text-sm text-blue-700">Tarjeta de Identidad de Extranjero</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (category === 'other') {
      return (
        <ScrollView className="p-6">
          <TouchableOpacity onPress={() => setStep('category')} className="mb-4">
            <Text className="text-blue-600">← Volver</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold mb-6 text-center">Categoría de Documento</Text>

          {OTHER_DOCUMENT_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              className="bg-neutral-100 rounded-xl p-4 mb-3 border border-neutral-300"
              onPress={() => {
                setOtherType(cat.value);
                setTitle(cat.label);
                setStep('form');
              }}
            >
              <Text className="text-lg font-semibold text-neutral-900">
                {cat.emoji} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }

    return null;
  };

  // ============================================================
  // PASO 3: Formulario con campos dinámicos
  // ============================================================
  const renderFormStep = () => {
    const templateFields = category === 'other' 
      ? [] 
      : getFieldsForDocumentType(category!, subtype || undefined);

    return (
      <ScrollView className="p-6">
        <TouchableOpacity 
          onPress={() => setStep(category === 'passport' ? 'category' : 'subtype')} 
          className="mb-4"
        >
          <Text className="text-blue-600">← Volver</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold mb-2 text-center">
          {getDocumentTypeLabel(category!, subtype || otherType || undefined)}
        </Text>
        
        <Text className="text-sm text-neutral-600 mb-6 text-center">
          {category === 'other' ? 'Campos personalizables' : 'Completa todos los campos requeridos'}
        </Text>

        {/* Título (solo para "other") */}
        {category === 'other' && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-neutral-700 mb-1">
              Título del Documento *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Seguro IATI Medical"
              className="bg-white border border-neutral-300 rounded-lg p-3"
            />
          </View>
        )}

        {/* Campos de plantilla (DNI/NIE/TIE/Pasaporte) */}
        {templateFields.map(field => renderField(field))}

        {/* Campos personalizables (solo "other") */}
        {category === 'other' && (
          <>
            <Text className="text-lg font-semibold mb-3 mt-4">Campos Personalizados</Text>
            {customFields.map((cf, idx) => (
              <View key={idx} className="bg-neutral-50 border border-neutral-300 rounded-lg p-3 mb-3">
                <View className="flex-row items-center mb-2">
                  <TextInput
                    value={cf.key}
                    onChangeText={text => {
                      const updated = [...customFields];
                      updated[idx].key = text;
                      setCustomFields(updated);
                    }}
                    placeholder="Nombre del campo"
                    className="flex-1 bg-white border border-neutral-300 rounded p-2 mr-2"
                    maxLength={50}
                  />
                  <TouchableOpacity
                    onPress={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                    className="bg-red-100 px-3 py-2 rounded"
                  >
                    <Text className="text-red-700">🗑️</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={cf.value}
                  onChangeText={text => {
                    const updated = [...customFields];
                    updated[idx].value = text;
                    setCustomFields(updated);
                  }}
                  placeholder="Valor"
                  className="bg-white border border-neutral-300 rounded p-2"
                  maxLength={500}
                />
              </View>
            ))}
            
            {customFields.length < 20 && (
              <TouchableOpacity
                onPress={() => setCustomFields([...customFields, { key: '', value: '' }])}
                className="bg-neutral-200 rounded-lg p-3 items-center mb-4"
              >
                <Text className="text-neutral-700 font-semibold">➕ Añadir Campo</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Sellos de Pasaporte (solo para passport) */}
        {category === 'passport' && (
          <View className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 mt-6">
            <Text className="text-sm font-semibold text-purple-900 mb-2">✈️ Países Visitados</Text>
            <Text className="text-xs text-purple-700 mb-3">
              Añade los países que has visitado con este pasaporte
            </Text>
            
            {passportStamps.length > 0 && (
              <View className="mb-3">
                <Text className="text-sm text-purple-800 font-semibold mb-2">
                  {passportStamps.length} sello{passportStamps.length !== 1 ? 's' : ''} añadido{passportStamps.length !== 1 ? 's' : ''}
                </Text>
                {passportStamps.slice(0, 3).map((stamp, idx) => (
                  <View key={idx} className="bg-white rounded p-2 mb-1 border border-purple-100">
                    <Text className="text-xs text-neutral-800">
                      {stamp.paisEmoji || '🌍'} {stamp.pais} - {stamp.fechaEntrada}
                    </Text>
                  </View>
                ))}
                {passportStamps.length > 3 && (
                  <Text className="text-xs text-purple-600 italic">
                    ...y {passportStamps.length - 3} más
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={() => setStampsModalVisible(true)}
              className="bg-purple-200 rounded-lg p-3 items-center"
            >
              <Text className="text-purple-800 font-semibold">
                {passportStamps.length > 0 ? '✏️ Gestionar Sellos' : '➕ Añadir Países Visitados'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Archivos (OPCIONAL) */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 mt-6">
          <Text className="text-sm font-semibold text-blue-900 mb-2">📎 Archivos (Opcional)</Text>
          <Text className="text-xs text-blue-700 mb-3">
            Puedes añadir fotos o PDFs. Máximo 10MB por archivo.
          </Text>
          
          {selectedFiles.length > 0 && (
            <View className="mb-3">
              {selectedFiles.map((file, idx) => (
                <View key={idx} className="flex-row items-center bg-white rounded p-2 mb-2">
                  <Text className="flex-1 text-sm">{file.name}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                  >
                    <Text className="text-red-500">✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={handlePickDocument}
            className="bg-blue-200 rounded-lg p-3 items-center"
          >
            <Text className="text-blue-800 font-semibold">
              {selectedFiles.length > 0 ? '➕ Añadir otro archivo' : '📁 Seleccionar archivos'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={uploading}
          className={`rounded-xl p-4 items-center mb-6 ${uploading ? 'bg-neutral-400' : 'bg-green-500'}`}
        >
          {uploading ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" className="mr-2" />
              <Text className="text-white font-bold">{uploadProgress}</Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-lg">💾 Guardar Documento</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClose}
          disabled={uploading}
          className="bg-neutral-200 rounded-xl p-3 items-center mb-4"
        >
          <Text className="text-neutral-700 font-semibold">Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderField = (field: DocumentField) => {
    const value = fields[field.key] || '';
    
    return (
      <View key={field.key} className="mb-4">
        <Text className="text-sm font-semibold text-neutral-700 mb-1">
          {field.label} {field.required && <Text className="text-red-500">*</Text>}
        </Text>
        
        {field.type === 'select' ? (
          <View className="flex-row">
            {field.options?.map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => setFields({ ...fields, [field.key]: opt })}
                className={`flex-1 mr-2 p-3 rounded-lg border-2 ${
                  value === opt ? 'bg-blue-100 border-blue-500' : 'bg-white border-neutral-300'
                }`}
              >
                <Text className={`text-center font-semibold ${value === opt ? 'text-blue-700' : 'text-neutral-600'}`}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput
            value={value}
            onChangeText={text => setFields({ ...fields, [field.key]: text })}
            placeholder={field.placeholder || field.format || field.label}
            className="bg-white border border-neutral-300 rounded-lg p-3"
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            maxLength={field.maxLength}
          />
        )}
        
        {field.format && (
          <Text className="text-xs text-neutral-500 mt-1">Formato: {field.format}</Text>
        )}
      </View>
    );
  };

  // ============================================================
  // LÓGICA DE SUBIDA
  // ============================================================
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) return;

      // Validar tamaño (10MB max por archivo)
      for (const file of result.assets) {
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('Error', `${file.name} es demasiado grande. Máximo 10MB por archivo.`);
          return;
        }
      }

      setSelectedFiles([...selectedFiles, ...result.assets]);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleSubmit = async () => {
    // Validación
    if (category === 'other' && !title.trim()) {
      Alert.alert('Error', 'Ingresa un título para el documento');
      return;
    }

    // Validar campos requeridos de plantilla
    const templateFields = category === 'other' 
      ? [] 
      : getFieldsForDocumentType(category!, subtype || undefined);

    for (const field of templateFields) {
      if (field.required && !fields[field.key]?.trim()) {
        Alert.alert('Error', `El campo "${field.label}" es obligatorio`);
        return;
      }
    }

    try {
      console.log('🚀 Iniciando subida de documento...');
      setUploading(true);
      setUploadProgress('Preparando...');

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuario no autenticado');
      console.log(`👤 Usuario: ${userData.user.id}`);

      const documentId = Crypto.randomUUID();
      console.log(`📋 Document ID generado: ${documentId}`);
      
      // Preparar metadata
      let documentType = category!;
      if (category === 'identity_card') {
        documentType = subtype as string;
      } else if (category === 'other') {
        documentType = otherType!;
      }

      // Combinar fields con customFields para "other" y añadir stamps para "passport"
      let finalFields: Record<string, any> = category === 'other' 
        ? customFields.reduce((acc, cf) => ({ ...acc, [cf.key]: cf.value }), {})
        : { ...fields };
      
      // Añadir sellos si es pasaporte
      if (category === 'passport' && passportStamps.length > 0) {
        finalFields.stamps = passportStamps;
      }

      // 1. Crear documento en BD
      setUploadProgress('Guardando metadatos...');
      console.log(`💾 Guardando en BD con tipo: ${documentType}`);
      console.log(`📝 Campos:`, finalFields);
      
      const { error: docError } = await supabase
        .from('user_documents')
        .insert({
          id: documentId,
          owner_id: userData.user.id,
          title: title || getDocumentTypeLabel(category!, subtype || otherType || undefined),
          type: documentType,
          fields: finalFields,
        });

      if (docError) {
        console.error('❌ Error guardando documento en BD:', docError);
        throw docError;
      }
      console.log(`✅ Documento guardado en BD`);

      // 2. Subir archivos (si los hay)
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setUploadProgress(`Subiendo archivo ${i + 1}/${selectedFiles.length}...`);

          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${i}.${fileExt}`;
          const storagePath = `${userData.user.id}/${documentId}/${fileName}`;

          // Leer archivo como base64
          console.log(`📂 Leyendo archivo ${i + 1}: ${file.name} desde ${file.uri}`);
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log(`✅ Archivo leído, tamaño base64: ${base64.length} chars`);
          
          // Convertir base64 a Uint8Array
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          console.log(`✅ Convertido a bytes: ${bytes.length} bytes`);

          // Subir a Storage
          console.log(`☁️ Subiendo a Storage: ${storagePath}`);
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(storagePath, bytes, {
              contentType: file.mimeType || 'application/octet-stream',
              upsert: false,
            });

          if (uploadError) {
            console.error(`❌ Error subiendo archivo:`, uploadError);
            throw uploadError;
          }
          console.log(`✅ Archivo subido exitosamente`);

          // Registrar en document_files
          console.log(`📝 Registrando archivo en document_files...`);
          const { error: fileRecordError } = await supabase
            .from('document_files')
            .insert({
              document_id: documentId,
              file_name: file.name,
              storage_path: storagePath,
              mime_type: file.mimeType || 'application/octet-stream',
              size_bytes: file.size || 0,
            });

          if (fileRecordError) {
            console.error(`❌ Error registrando archivo:`, fileRecordError);
            throw fileRecordError;
          }
          console.log(`✅ Archivo registrado en BD`);
        }
      }

      setUploadProgress('¡Completado!');
      console.log('🎉 ¡Documento guardado exitosamente!');
      Alert.alert('✅ Éxito', 'Documento guardado correctamente');
      
      reset();
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('❌❌❌ Error uploading document:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el documento');
      setUploading(false);
      setUploadProgress('');
    }
  };

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View className="flex-1 bg-white pt-12">
          {step === 'category' && renderCategoryStep()}
          {step === 'subtype' && renderSubtypeStep()}
          {step === 'form' && renderFormStep()}
        </View>
      </Modal>

      {/* Modal de sellos de pasaporte */}
      <PassportStampsModal
        visible={stampsModalVisible}
        stamps={passportStamps}
        onClose={() => setStampsModalVisible(false)}
        onSave={(stamps) => {
          setPassportStamps(stamps);
          setStampsModalVisible(false);
        }}
      />
    </>
  );
}

