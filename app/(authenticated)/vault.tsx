// ===================================================================
// PANTALLA: MI VAULT - Gestión de documentos personales
// ===================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useDocuments } from '../../src/hooks/useDocuments';
import { useAccessRequests } from '../../src/hooks/useAccessRequests';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { UploadDocumentModal } from '../../src/components/UploadDocumentModal';
import { ShareDocumentModal } from '../../src/components/ShareDocumentModal';
import { EditDocumentModalFull } from '../../src/components/EditDocumentModalFull';
import * as Clipboard from 'expo-clipboard';
import {
  getDocumentTypeLabel,
  getShareTypeLabel,
  formatFileSize,
  daysUntilExpiration,
  downloadAndOpenDocument,
  hideDocumentFromGroup,
  showDocumentInGroup,
  deletePersonalDocument,
} from '../../src/services/documents.service';

const FIELD_TEMPLATES: Record<string, string[]> = {
  passport: ['Número', 'Fecha Expedición', 'Fecha Caducidad', 'País'],
  id_card: ['Número', 'Fecha Expedición', 'Fecha Caducidad'],
  insurance: ['Nº Póliza', 'Proveedor', 'Fecha Caducidad', 'Tel. Emergencia'],
  license: ['Número', 'Clase', 'Fecha Caducidad', 'País'],
  other: [],
};

export default function VaultScreen() {
  const { documents, loading, error, refreshing, refresh, reload } = useDocuments();
  const { requests, pendingCount } = useAccessRequests();
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState<{ id: string; title: string } | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<any>(null);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-neutral-50 items-center justify-center">
        <ActivityIndicator size="large" color="#FF5050" />
        <Text className="mt-4 text-neutral-600 font-body">
          Cargando tu vault...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Header */}
      <View className="bg-white border-b border-neutral-200 px-6 pt-16 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-h2 font-display font-bold text-neutral-900">
            Mi Vault
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Text className="text-xl text-neutral-600">✕</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm font-body text-neutral-600">
          {documents.length} documento{documents.length !== 1 && 's'}
        </Text>

      {/* Botón Logs */}
      <TouchableOpacity
        onPress={() => router.push('/(authenticated)/document-logs')}
        className="mt-3 bg-neutral-100 px-4 py-2 rounded-lg flex-row items-center"
      >
        <Text className="text-xl mr-2">📊</Text>
        <Text className="text-sm font-body text-neutral-700 flex-1">Ver logs de acceso</Text>
        <Text className="text-sm font-semibold text-neutral-600">→</Text>
      </TouchableOpacity>

      {/* Botón Solicitudes */}
      <TouchableOpacity
        onPress={() => router.push('/(authenticated)/access-requests')}
        className="mt-2 bg-primary-100 px-4 py-2 rounded-lg flex-row items-center"
      >
        <Text className="text-xl mr-2">📥</Text>
        <Text className="text-sm font-body text-primary-700 flex-1">Ver solicitudes pendientes</Text>
        <Text className="text-sm font-semibold text-primary-600">→</Text>
      </TouchableOpacity>

        {/* Badge de solicitudes pendientes */}
        {pendingCount > 0 && (
          <View className="mt-3 bg-primary-50 px-4 py-2 rounded-lg flex-row items-center">
            <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center mr-2">
              <Text className="text-xs text-white font-bold">{pendingCount}</Text>
            </View>
            <Text className="text-sm font-body text-primary-700 flex-1">
              Tienes solicitudes pendientes
            </Text>
            <TouchableOpacity
              onPress={() => {
                /* TODO: Ir a pantalla de solicitudes */
                Alert.alert('Solicitudes', 'Pantalla en desarrollo');
              }}
            >
              <Text className="text-sm font-semibold text-primary-600">Ver →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {error && (
        <View className="px-6 pt-4">
          <ErrorMessage message={error} />
        </View>
      )}

      {/* Lista de documentos */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {documents.length === 0 ? (
          <View className="items-center justify-center px-6 py-12">
            <Text className="text-6xl mb-4">📄</Text>
            <Text className="text-h3 font-display font-bold text-neutral-800 mb-2">
              Tu vault está vacío
            </Text>
            <Text className="text-center text-neutral-600 font-body mb-6">
              Sube tus documentos personales para compartirlos de forma segura con tus
              grupos.
            </Text>
            <Button
              title="Subir primer documento"
              onPress={() => setUploadModalVisible(true)}
            />
          </View>
        ) : (
          <View className="px-6 pt-4 space-y-3">
            {documents.map((doc) => {
              const isExpanded = expandedDoc === doc.id;
              const sharedCount = doc.shared_in?.length || 0;

              return (
                <View
                  key={doc.id}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
                >
                  {/* Header del documento */}
                  <TouchableOpacity
                    onPress={() => setExpandedDoc(isExpanded ? null : doc.id)}
                    className="p-4"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-2xl mr-2">
                            {doc.type === 'passport'
                              ? '🛂'
                              : doc.type === 'id_card'
                              ? '🪪'
                              : doc.type === 'insurance'
                              ? '🏥'
                              : doc.type === 'license'
                              ? '🚗'
                              : '📄'}
                          </Text>
                          <Text className="text-base font-semibold text-neutral-900 flex-1">
                            {doc.title}
                          </Text>
                        </View>
                        <Text className="text-sm text-neutral-600 font-body">
                          {getDocumentTypeLabel(doc.type)} • {formatFileSize(doc.size_bytes)}
                        </Text>
                      </View>

                      {/* Badge de compartido */}
                      {sharedCount > 0 && (
                        <View className="bg-primary-100 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-primary-700">
                            {sharedCount} grupo{sharedCount !== 1 && 's'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Detalles expandidos */}
                  {isExpanded && (
                    <View className="border-t border-neutral-200 p-4 bg-neutral-50">
                      {/* Grupos compartidos */}
                      {sharedCount > 0 ? (
                        <View className="mb-3">
                          <Text className="text-sm font-semibold text-neutral-700 mb-2">
                            Compartido en:
                          </Text>
                          {doc.shared_in?.map((share, idx) => {
                            const daysLeft = daysUntilExpiration(share.expires_at);
                            const isVisible = share.is_visible && (daysLeft === null || daysLeft > 0);

                            return (
                              <View
                                key={idx}
                                className="py-2 border-b border-neutral-200"
                              >
                                <View className="flex-row items-center justify-between mb-2">
                                  <View className="flex-1">
                                    <Text className="text-sm font-medium text-neutral-800">
                                      {share.group_name}
                                    </Text>
                                    <Text className="text-xs text-neutral-600">
                                      {getShareTypeLabel(share.share_type)}
                                      {daysLeft !== null && ` • ${daysLeft}d restantes`}
                                    </Text>
                                  </View>
                                  <View
                                    className={`px-2 py-1 rounded ${
                                      isVisible ? 'bg-green-100' : 'bg-neutral-200'
                                    }`}
                                  >
                                    <Text
                                      className={`text-xs font-semibold ${
                                        isVisible ? 'text-green-700' : 'text-neutral-600'
                                      }`}
                                    >
                                      {isVisible ? 'Visible' : 'Oculto'}
                                    </Text>
                                  </View>
                                </View>
                                {/* Botón para ocultar/mostrar */}
                                {isVisible ? (
                                  <TouchableOpacity
                                    onPress={async () => {
                                      Alert.alert(
                                        'Ocultar documento',
                                        `¿Ocultar "${doc.title}" del grupo "${share.group_name}"?`,
                                        [
                                          { text: 'Cancelar', style: 'cancel' },
                                          {
                                            text: 'Ocultar',
                                            style: 'destructive',
                                            onPress: async () => {
                                              try {
                                                await hideDocumentFromGroup(doc.id, share.group_id);
                                                Alert.alert('¡Éxito!', 'Documento ocultado');
                                                reload();
                                              } catch (error) {
                                                Alert.alert(
                                                  'Error',
                                                  error instanceof Error
                                                    ? error.message
                                                    : 'Error al ocultar'
                                                );
                                              }
                                            },
                                          },
                                        ]
                                      );
                                    }}
                                    className="bg-orange-50 px-3 py-2 rounded border border-orange-200"
                                  >
                                    <Text className="text-xs font-semibold text-orange-700 text-center">
                                      👁️‍🗨️ Ocultar de este grupo
                                    </Text>
                                  </TouchableOpacity>
                                ) : (
                                  <TouchableOpacity
                                    onPress={async () => {
                                      try {
                                        await showDocumentInGroup(doc.id, share.group_id);
                                        Alert.alert('¡Éxito!', 'Documento visible de nuevo');
                                        reload();
                                      } catch (error) {
                                        Alert.alert(
                                          'Error',
                                          error instanceof Error
                                            ? error.message
                                            : 'Error al mostrar'
                                        );
                                      }
                                    }}
                                    className="bg-green-50 px-3 py-2 rounded border border-green-200"
                                  >
                                    <Text className="text-xs font-semibold text-green-700 text-center">
                                      👁️ Mostrar de nuevo
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <Text className="text-sm text-neutral-600 mb-3">
                          No compartido en ningún grupo
                        </Text>
                      )}

                      {/* Campos del documento */}
                      {FIELD_TEMPLATES[doc.type]?.length > 0 && (
                        <View className="mb-3 bg-white rounded-lg p-3 border border-neutral-200">
                          <Text className="text-sm font-semibold text-neutral-700 mb-2">📋 Campos</Text>
                          {FIELD_TEMPLATES[doc.type].map((fieldName) => {
                            const value = doc.fields?.[fieldName] || '';
                            return (
                              <View key={fieldName} className="flex-row items-center justify-between py-2 border-b border-neutral-100">
                                <View className="flex-1 mr-3">
                                  <Text className="text-xs text-neutral-500">{fieldName}</Text>
                                  <Text className="text-sm text-neutral-800">{value || '(vacío)'}</Text>
                                </View>
                                {value && (
                                  <TouchableOpacity
                                    onPress={async () => {
                                      await Clipboard.setStringAsync(value);
                                      Alert.alert('Copiado', `${fieldName} copiado`);
                                    }}
                                    className="bg-neutral-100 px-3 py-2 rounded"
                                  >
                                    <Text className="text-xs">📋</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Archivos */}
                      {doc.files && doc.files.length > 0 && (
                        <View className="mb-3 bg-white rounded-lg p-3 border border-neutral-200">
                          <Text className="text-sm font-semibold text-neutral-700 mb-2">📎 Archivos ({doc.files.length})</Text>
                          {doc.files.map((file: any) => (
                            <TouchableOpacity
                              key={file.id}
                              onPress={async () => {
                                try {
                                  const WebBrowser = require('expo-web-browser');
                                  const { data } = await supabase.storage
                                    .from('documents')
                                    .createSignedUrl(file.storage_path, 3600);
                                  if (!data?.signedUrl) throw new Error('Error');
                                  await WebBrowser.openBrowserAsync(data.signedUrl);
                                } catch (error) {
                                  Alert.alert('Error', error instanceof Error ? error.message : 'Error');
                                }
                              }}
                              className="flex-row items-center py-2 border-b border-neutral-100"
                            >
                              <Text className="text-2xl mr-3">
                                {file.mime_type.includes('pdf') ? '📄' : '🖼️'}
                              </Text>
                              <View className="flex-1">
                                <Text className="text-sm font-medium text-neutral-800">{file.file_name}</Text>
                                <Text className="text-xs text-neutral-500">{formatFileSize(file.size_bytes)}</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* Editar */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedDocForEdit(doc);
                          setEditModalVisible(true);
                        }}
                        className="bg-neutral-200 py-3 rounded-lg items-center mb-3"
                      >
                        <Text className="text-neutral-700 font-semibold">✏️ Editar Todo</Text>
                      </TouchableOpacity>

                      {/* Acciones */}
                      <View className="flex-row space-x-2 mb-3">
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedDocForShare({ id: doc.id, title: doc.title });
                            setShareModalVisible(true);
                          }}
                          className="flex-1 bg-primary-500 py-3 rounded-lg items-center"
                        >
                          <Text className="text-white font-semibold">Compartir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert('Próximamente', 'Función en desarrollo')
                          }
                          className="flex-1 bg-neutral-200 py-3 rounded-lg items-center"
                        >
                          <Text className="text-neutral-700 font-semibold">Ver logs</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Botón: Eliminar documento */}
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            'Eliminar documento',
                            `¿Estás seguro de eliminar "${doc.title}"?\n\n⚠️ Esta acción:\n• Eliminará el documento de TODOS los grupos\n• Borrará el archivo permanentemente\n• NO se puede deshacer`,
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Eliminar',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await deletePersonalDocument(doc.id);
                                    Alert.alert('¡Eliminado!', 'Documento eliminado correctamente');
                                    reload();
                                    setExpandedDoc(null); // Colapsar
                                  } catch (error) {
                                    Alert.alert(
                                      'Error',
                                      error instanceof Error
                                        ? error.message
                                        : 'Error al eliminar'
                                    );
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        className="bg-red-100 py-3 rounded-lg items-center border border-red-300"
                      >
                        <Text className="text-red-700 font-semibold">🗑️ Eliminar Documento</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Botón flotante para subir */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => setUploadModalVisible(true)}
          className="w-16 h-16 bg-primary-500 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text className="text-3xl text-white">+</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de upload */}
      <UploadDocumentModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={() => reload()}
      />

      {/* Modal de compartir */}
      {selectedDocForShare && (
        <ShareDocumentModal
          visible={shareModalVisible}
          documentId={selectedDocForShare.id}
          documentTitle={selectedDocForShare.title}
          onClose={() => {
            setShareModalVisible(false);
            setSelectedDocForShare(null);
          }}
          onSuccess={() => reload()}
        />
      )}

      {/* Modal de editar completo */}
      {selectedDocForEdit && (
        <EditDocumentModalFull
          visible={editModalVisible}
          document={selectedDocForEdit}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedDocForEdit(null);
          }}
          onSuccess={() => reload()}
        />
      )}
    </View>
  );
}

