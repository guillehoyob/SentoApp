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
import { useDocuments } from '../../src/hooks/useDocuments';
import { useAccessRequests } from '../../src/hooks/useAccessRequests';
import { Button } from '../../src/components/Button';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { UploadDocumentModal } from '../../src/components/UploadDocumentModal';
import { ShareDocumentModal } from '../../src/components/ShareDocumentModal';
import {
  getDocumentTypeLabel,
  getShareTypeLabel,
  formatFileSize,
  daysUntilExpiration,
} from '../../src/services/documents.service';

export default function VaultScreen() {
  const { documents, loading, error, refreshing, refresh, reload } = useDocuments();
  const { requests, pendingCount } = useAccessRequests();
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState<{ id: string; title: string } | null>(null);

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
                                className="flex-row items-center justify-between py-2 border-b border-neutral-200"
                              >
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
                            );
                          })}
                        </View>
                      ) : (
                        <Text className="text-sm text-neutral-600 mb-3">
                          No compartido en ningún grupo
                        </Text>
                      )}

                      {/* Acciones */}
                      <View className="flex-row space-x-2">
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
    </View>
  );
}

