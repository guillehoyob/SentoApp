import { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback as useCallbackReact } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useGroup } from '../../src/hooks/useGroup';
import { useGroupDocuments } from '../../src/hooks/useGroupDocuments';
import { Button } from '../../src/components/Button';
import { TextInputComponent } from '../../src/components/TextInput';
import { ShareInviteModal } from '../../src/components/ShareInviteModal';
import { RequestDocumentsModal } from '../../src/components/RequestDocumentsModal';
import { supabase } from '../../src/services/supabase';
import { getSectionsForDocumentType, FIELD_LABELS } from '../../src/constants/documentFieldsSections';
import { getDocumentTypeLabel, formatFileSize, daysUntilExpiration, downloadAndOpenDocument } from '../../src/services/documents.service';

const FIELD_TEMPLATES: Record<string, string[]> = {
  // Tipos antiguos
  passport: ['numero', 'apellidos', 'nombres', 'fechaNacimiento', 'nacionalidad', 'fechaExpedicion', 'fechaCaducidad'],
  id_card: ['Número', 'Fecha Expedición', 'Fecha Caducidad'],
  insurance: ['Nº Póliza', 'Proveedor', 'Fecha Caducidad', 'Tel. Emergencia'],
  license: ['Número', 'Clase', 'Fecha Caducidad', 'País'],
  // Nuevos tipos (DNI/NIE/TIE)
  DNI: ['numero', 'nombre', 'apellido1', 'apellido2', 'sexo', 'fechaNacimiento', 'nacionalidad', 'numeroSoporte', 'fechaExpedicion', 'fechaCaducidad', 'domicilio', 'municipio', 'provincia'],
  NIE: ['numero', 'nombre', 'apellido1', 'apellido2', 'sexo', 'fechaNacimiento', 'nacionalidad', 'numeroSoporte', 'fechaExpedicion', 'fechaCaducidad', 'domicilio', 'municipio', 'provincia'],
  TIE: ['numero', 'nombre', 'apellido1', 'apellido2', 'sexo', 'fechaNacimiento', 'nacionalidad', 'tipoAutorizacion', 'numeroSoporte', 'fechaExpedicion', 'fechaCaducidad', 'fechaInicioAutorizacion', 'fechaFinAutorizacion', 'domicilio', 'municipio', 'provincia'],
  // Otros
  health: [],
  driving: [],
  financial: [],
  education: [],
  professional: [],
  travel: [],
  legal: [],
  property: [],
  identification: [],
  other: [],
};

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { group, loading, error, expired, updateGroup, deleteGroup } = useGroup(id || '');
  const { documents: groupDocuments, loading: loadingDocs, reload: reloadDocs } = useGroupDocuments(id || '');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Recargar documentos al volver a la pantalla
  useFocusEffect(
    useCallbackReact(() => {
      if (id) {
        reloadDocs();
        // Cargar requisitos
        supabase.rpc('get_group_requirements', { p_group_id: id }).then(({ data, error }) => {
          if (error) {
            console.error('Error loading requirements:', error);
          } else {
            console.log('Requirements loaded:', data);
            setRequirements(data || []);
          }
        });
      }
    }, [id, reloadDocs])
  );

  // Real-time subscription para cambios en document_shares
  useEffect(() => {
    if (!id) return;

    console.log('🔴 Suscribiéndose a cambios en tiempo real para grupo:', id);
    
    const channel = supabase
      .channel(`group-${id}-documents`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'document_shares',
          filter: `group_id=eq.${id}`
        },
        (payload) => {
          console.log('📡 Cambio detectado en document_shares:', payload.eventType, payload);
          
          // Recargar documentos automáticamente
          reloadDocs();
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción:', status);
      });

    // Cleanup al desmontar
    return () => {
      console.log('🔴 Desuscribiéndose de cambios en tiempo real');
      supabase.removeChannel(channel);
    };
  }, [id, reloadDocs]);

  // Pull-to-refresh handler
  const onRefresh = useCallbackReact(async () => {
    setRefreshing(true);
    try {
      // Recargar documentos
      await reloadDocs();
      
      // Recargar requisitos
      const { data, error } = await supabase.rpc('get_group_requirements', { p_group_id: id });
      if (!error) {
        setRequirements(data || []);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [id, reloadDocs]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setStartDate(group.start_date);
      setEndDate(group.end_date || '');
      setDestination(group.destination || '');
      setNotes(group.notes || '');
    }
  }, [group]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      await updateGroup({
        name,
        start_date: startDate,
        end_date: group?.type === 'trip' ? endDate : null,
        destination: destination.trim() || null,
        notes: notes.trim() || null,
      });
      setIsEditing(false);
      Alert.alert('Éxito', 'Grupo actualizado correctamente');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup();
              Alert.alert('Éxito', 'Grupo eliminado', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Error al eliminar');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#FF5050" />
      </View>
    );
  }

  if (!group) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-lg">
        <Text className="font-body-semibold text-lg text-danger mb-lg">
          Grupo no encontrado
        </Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card pt-[50px] pb-lg px-lg border-b border-neutral-100">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mb-md"
          activeOpacity={0.7}
        >
          <Text className="font-body-medium text-base text-primary">← Volver</Text>
        </TouchableOpacity>
        <View className="flex-row justify-between items-center">
              <View className="flex-1">
                  <View className="flex-row items-center mb-xs">
                    <Text className="text-[32px] mr-sm">
                      {group.type === 'trip' ? '✈️' : '👥'}
                    </Text>
                    <Text className="font-display text-[28px] text-text-primary flex-1 leading-[36px]">
                      {isEditing ? 'Editar' : group.name}
                    </Text>
                  </View>
                  {!isEditing && group.destination && (
                    <Text className="font-body text-sm text-neutral-500">
                      📍 {group.destination}
                    </Text>
                  )}
                </View>
                {!isEditing && (
                  <View className="flex-row gap-sm">
                    <TouchableOpacity
                      onPress={() => setShowInviteModal(true)}
                      className="bg-primary px-md py-sm rounded-lg"
                      activeOpacity={0.7}
                    >
                      <Text className="font-body-medium text-sm text-white">👥 Invitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      className="bg-primary/10 px-md py-sm rounded-lg"
                      activeOpacity={0.7}
                    >
                      <Text className="font-body-medium text-sm text-primary">✏️ Editar</Text>
                    </TouchableOpacity>
                  </View>
                )}
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF5050']}
            tintColor="#FF5050"
          />
        }
      >
        {error && (
          <View className="bg-danger/10 p-md rounded-lg mb-md">
            <Text className="font-body text-base text-danger">{error}</Text>
          </View>
        )}

        {expired && (
          <View className="bg-warning/20 p-md rounded-lg mb-md border-l-4 border-warning">
            <Text className="font-body-semibold text-base text-warning">
              ⏰ Este viaje ha finalizado
            </Text>
          </View>
        )}

        {isEditing ? (
          <View>
            <TextInputComponent
              label="Nombre *"
              value={name}
              onChangeText={setName}
            />

            <TextInputComponent
              label="Fecha de inicio (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
            />

            {group.type === 'trip' && (
              <TextInputComponent
                label="Fecha de fin (YYYY-MM-DD)"
                value={endDate}
                onChangeText={setEndDate}
              />
            )}

            <TextInputComponent
              label="Destino/Ubicación"
              value={destination}
              onChangeText={setDestination}
            />

            <TextInputComponent
              label="Notas"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View className="flex-row gap-sm">
              <View className="flex-1">
                <Button
                  title="Cancelar"
                  onPress={() => {
                    setIsEditing(false);
                    if (group) {
                      setName(group.name);
                      setStartDate(group.start_date);
                      setEndDate(group.end_date || '');
                      setDestination(group.destination || '');
                      setNotes(group.notes || '');
                    }
                  }}
                  variant="secondary"
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Guardar"
                  onPress={handleSave}
                  loading={saving}
                />
              </View>
            </View>
          </View>
        ) : (
          <View className="gap-md">
            {/* Card principal con info */}
            <View className="bg-card rounded-2xl p-lg shadow-md">
              <View className="mb-lg">
                <Text className="font-body-medium text-sm text-neutral-500 mb-xs">Nombre del {group.type === 'trip' ? 'viaje' : 'grupo'}</Text>
                <Text className="font-body-semibold text-xl text-text-primary">{group.name}</Text>
              </View>

              {group.destination && (
                <View className="mb-lg">
                  <Text className="font-body-medium text-sm text-neutral-500 mb-xs">Destino</Text>
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-sm">📍</Text>
                    <Text className="font-body-semibold text-lg text-text-primary flex-1">
                      {group.destination}
                    </Text>
                  </View>
                </View>
              )}

              <View>
                <Text className="font-body-medium text-sm text-neutral-500 mb-xs">Fechas</Text>
                <View className="flex-row items-center mb-xs">
                  <Text className="text-base mr-sm">📅</Text>
                  <Text className="font-body text-base text-neutral-700">
                    {new Date(group.start_date).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                {group.end_date && (
                  <View className="flex-row items-center">
                    <Text className="text-base mr-sm">🏁</Text>
                    <Text className="font-body text-base text-neutral-700">
                      {new Date(group.end_date).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Card de miembros */}
            {group.members && (
              <View className="bg-primary/10 rounded-2xl p-lg border-2 border-primary/20">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-body-medium text-sm text-primary/70 mb-xs">Participantes</Text>
                    <Text className="font-body-semibold text-2xl text-primary">
                      {group.members.length}
                    </Text>
                  </View>
                  <Text className="text-[48px]">👥</Text>
                </View>
                <Text className="font-body text-sm text-primary/70 mt-xs">
                  miembro{group.members.length !== 1 ? 's' : ''} en el grupo
                </Text>
              </View>
            )}

            {/* Requisitos de documentos */}
            <View className="bg-yellow-50 rounded-2xl p-lg border-2 border-yellow-200">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-2">📋</Text>
                  <Text className="font-body-semibold text-base text-neutral-900">Documentos Requeridos</Text>
                </View>
                {group.is_owner && (
                  <TouchableOpacity
                    onPress={() => Alert.alert('Editar requisitos', 'Próximamente')}
                    className="bg-yellow-200 px-3 py-1 rounded"
                  >
                    <Text className="text-xs font-semibold text-yellow-800">✏️ Editar</Text>
                  </TouchableOpacity>
                )}
              </View>
              {requirements.length === 0 ? (
                <Text className="text-sm text-neutral-600 text-center py-2">
                  No hay requisitos configurados
                </Text>
              ) : (
                requirements.map((req: any, idx: number) => (
                  <View key={idx} className="flex-row items-center py-2 border-b border-yellow-100">
                    <Text className="text-xl mr-2">
                      {req.doc_type === 'passport' ? '🛂' : 
                       req.doc_type === 'id_card' ? '🪪' : 
                       req.doc_type === 'insurance' ? '🏥' : 
                       req.doc_type === 'license' ? '🚗' : '📄'}
                    </Text>
                    <Text className="flex-1 text-sm text-neutral-700">
                      {req.doc_type === 'passport' ? 'Pasaporte' : 
                       req.doc_type === 'id_card' ? 'DNI/Cédula' : 
                       req.doc_type === 'insurance' ? 'Seguro' : 
                       req.doc_type === 'license' ? 'Licencia' : 'Documento'}
                    </Text>
                    <View className={`px-2 py-1 rounded ${req.is_required ? 'bg-red-100' : 'bg-yellow-100'}`}>
                      <Text className={`text-xs font-semibold ${req.is_required ? 'text-red-700' : 'text-yellow-700'}`}>
                        {req.is_required ? 'Obligatorio' : 'Opcional'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Card de documentos compartidos */}
            <View className="bg-card rounded-2xl p-lg shadow-md">
              <View className="flex-row items-center justify-between mb-md">
                <View className="flex-1">
                  <Text className="font-body-medium text-sm text-neutral-500 mb-xs">Documentos Compartidos</Text>
                  <Text className="font-body-semibold text-xl text-text-primary">
                    {groupDocuments?.length || 0}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setRequestModalVisible(true)}
                  className="bg-primary-100 px-3 py-2 rounded-lg ml-2"
                >
                  <Text className="text-xs font-semibold text-primary-700">📥 Solicitar</Text>
                </TouchableOpacity>
                <Text className="text-[32px] ml-2">📄</Text>
              </View>
              
              {loadingDocs ? (
                <ActivityIndicator color="#FF5050" className="my-md" />
              ) : groupDocuments && groupDocuments.length > 0 ? (
                <View className="gap-sm">
                  {groupDocuments.map((doc) => {
                    const daysLeft = daysUntilExpiration(doc.expires_at);
                    const isVisible = doc.is_visible && (daysLeft === null || daysLeft > 0);
                    const canAccess = doc.can_access && (daysLeft === null || daysLeft > 0);
                    const isExpanded = expandedDocId === doc.id;
                    
                    return (
                      <View 
                        key={doc.id}
                        className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden"
                      >
                        {/* Header - Clickeable */}
                        <TouchableOpacity
                          onPress={() => setExpandedDocId(isExpanded ? null : doc.id)}
                          className="p-4"
                        >
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1 mr-3">
                              <View className="flex-row items-center mb-1">
                                <Text className="text-2xl mr-2">
                                  {doc.type === 'passport' ? '🛂' : 
                                   doc.type === 'DNI' || doc.type === 'NIE' || doc.type === 'TIE' ? '🪪' :
                                   doc.type === 'id_card' ? '🪪' : 
                                   doc.type === 'health' ? '🏥' :
                                   doc.type === 'insurance' ? '🏥' : 
                                   doc.type === 'driving' ? '🚗' :
                                   doc.type === 'license' ? '🚗' :
                                   doc.type === 'financial' ? '💳' :
                                   doc.type === 'education' ? '🎓' :
                                   doc.type === 'professional' ? '💼' :
                                   doc.type === 'travel' ? '✈️' :
                                   doc.type === 'legal' ? '⚖️' :
                                   doc.type === 'property' ? '🏠' :
                                   doc.type === 'identification' ? '🆔' : '📄'}
                                </Text>
                                <Text className="text-base font-semibold text-neutral-900 flex-1">
                                  {doc.title}
                                </Text>
                              </View>
                              <Text className="text-sm text-neutral-600 font-body">
                                {doc.owner_name || 'Usuario'}
                              </Text>
                              <Text className="text-sm text-neutral-600 font-body">
                                {getDocumentTypeLabel(doc.type)}
                              </Text>
                            </View>
                            <View className={`px-2 py-1 rounded ${isVisible ? 'bg-green-100' : 'bg-neutral-200'}`}>
                              <Text className={`text-xs font-semibold ${isVisible ? 'text-green-700' : 'text-neutral-600'}`}>
                                {isVisible ? '✓ Visible' : '🔒 Oculto'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Detalles expandidos */}
                        {isExpanded && (
                          <View className="border-t border-neutral-200 p-4 bg-neutral-50">
                            {daysLeft !== null && daysLeft > 0 && (
                              <Text className="font-body text-xs text-neutral-500 mb-3">
                                ⏳ Expira en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                              </Text>
                            )}

                            {/* Campos del documento organizados por secciones */}
                            {canAccess && (() => {
                              const sections = getSectionsForDocumentType(doc.type);
                              if (sections) {
                                return sections.map((section, sectionIdx) => (
                                  <View key={sectionIdx} className="mb-3 bg-white rounded-lg p-3 border border-neutral-200">
                                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                                      {section.emoji} {section.title}
                                    </Text>
                                    {section.fields.map((fieldName) => {
                                      const value = doc.fields?.[fieldName] || '';
                                      const label = FIELD_LABELS[fieldName] || fieldName;
                                      return (
                                        <View key={fieldName} className="flex-row items-center justify-between py-2 border-b border-neutral-100">
                                          <View className="flex-1 mr-3">
                                            <Text className="text-xs text-neutral-500">{label}</Text>
                                            <Text className="text-sm text-neutral-800">{value || '(vacío)'}</Text>
                                          </View>
                                          {value && (
                                            <TouchableOpacity
                                              onPress={async () => {
                                                await Clipboard.setStringAsync(value);
                                                Alert.alert('Copiado', `${label} copiado`);
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
                                ));
                              }
                              // Fallback para tipos antiguos
                              if (FIELD_TEMPLATES[doc.type]?.length > 0) {
                                return (
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
                                );
                              }
                              return null;
                            })()}

                        {/* Campos personalizados (para documentos sin plantilla) */}
                        {canAccess && doc.fields && Object.keys(doc.fields).length > 0 && (!FIELD_TEMPLATES[doc.type] || FIELD_TEMPLATES[doc.type].length === 0) && (
                          <View className="mb-3 bg-white rounded-lg p-3 border border-neutral-200">
                            <Text className="text-sm font-semibold text-neutral-700 mb-2">📋 Campos Personalizados</Text>
                            {Object.entries(doc.fields).map(([fieldName, value]) => (
                              <View key={fieldName} className="flex-row items-center justify-between py-2 border-b border-neutral-100">
                                <View className="flex-1 mr-3">
                                  <Text className="text-xs text-neutral-500">{fieldName}</Text>
                                  <Text className="text-sm text-neutral-800">{value || '(vacío)'}</Text>
                                </View>
                                {value && (
                                  <TouchableOpacity
                                    onPress={async () => {
                                      await Clipboard.setStringAsync(String(value));
                                      Alert.alert('Copiado', `${fieldName} copiado`);
                                    }}
                                    className="bg-neutral-100 px-3 py-2 rounded"
                                  >
                                    <Text className="text-xs">📋</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Archivos */}
                        {canAccess && doc.files && doc.files.length > 0 && (
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

                        {/* Sellos de Pasaporte (solo para passport) */}
                        {canAccess && doc.type === 'passport' && doc.fields?.stamps && Array.isArray(doc.fields.stamps) && doc.fields.stamps.length > 0 && (
                          <View className="mb-3 bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <Text className="text-sm font-semibold text-purple-700 mb-2">
                              ✈️ Países Visitados ({new Set(doc.fields.stamps.map((s: any) => s.pais.toLowerCase().trim())).size}) • {doc.fields.stamps.length} sello{doc.fields.stamps.length !== 1 ? 's' : ''}
                            </Text>
                            {doc.fields.stamps.map((stamp: any, idx: number) => (
                              <View key={idx} className="bg-white rounded-lg p-3 mb-2 border border-purple-100">
                                <View className="flex-row items-center mb-1">
                                  <Text className="text-lg mr-2">{stamp.paisEmoji || '🌍'}</Text>
                                  <Text className="text-sm font-semibold text-neutral-900 flex-1">{stamp.pais}</Text>
                                  <Text className="text-xs text-purple-600 font-medium">
                                    {stamp.tipoSello || 'entrada'}
                                  </Text>
                                </View>
                                <View className="flex-row items-center mt-1">
                                  <Text className="text-xs text-neutral-600">
                                    📅 {stamp.fechaEntrada}
                                    {stamp.fechaSalida && ` → ${stamp.fechaSalida}`}
                                  </Text>
                                </View>
                                {stamp.puestoFronterizo && (
                                  <Text className="text-xs text-neutral-500 mt-1">
                                    🛃 {stamp.puestoFronterizo}
                                  </Text>
                                )}
                                {stamp.observaciones && (
                                  <Text className="text-xs text-neutral-500 mt-1 italic">
                                    {stamp.observaciones}
                                  </Text>
                                )}
                              </View>
                            ))}
                          </View>
                        )}

                            {!canAccess && (
                              <TouchableOpacity
                                onPress={() => Alert.alert('Solicitar acceso', 'Función en desarrollo')}
                                className="mt-sm bg-primary-100 py-2 rounded items-center"
                              >
                                <Text className="font-body-medium text-xs text-primary-700">
                                  Solicitar acceso
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="py-md">
                  <Text className="font-body text-sm text-neutral-600 text-center">
                    No hay documentos compartidos en este grupo
                  </Text>
                </View>
              )}
            </View>

            {/* Card de notas */}
            {group.notes && (
              <View className="bg-card rounded-2xl p-lg shadow-md">
                <Text className="font-body-medium text-sm text-neutral-500 mb-md">Notas</Text>
                <Text className="font-body text-base text-neutral-700 leading-6">
                  {group.notes}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Botón eliminar */}
        <View className="mt-3xl">
          <View className="bg-danger/5 rounded-2xl p-md mb-md">
            <Text className="font-body text-sm text-neutral-600 text-center">
              ⚠️ Esta acción no se puede deshacer
            </Text>
          </View>
          <Button
            title="Eliminar grupo"
            onPress={handleDelete}
            variant="danger"
          />
        </View>
            </ScrollView>

            {/* Modal de invitación */}
            <ShareInviteModal
              groupId={id || ''}
              groupName={group.name}
              visible={showInviteModal}
              onClose={() => setShowInviteModal(false)}
            />

            {/* Modal solicitar documentos */}
            <RequestDocumentsModal
              visible={requestModalVisible}
              groupId={id || ''}
              groupName={group.name}
              onClose={() => setRequestModalVisible(false)}
              onSuccess={() => {
                setRequestModalVisible(false);
                Alert.alert('¡Enviado!', 'Solicitudes enviadas');
              }}
            />
          </View>
        );
      }
