// ===================================================================
// PASSPORT STAMPS MODAL - Gestión de sellos de pasaporte
// ===================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

export interface PassportStamp {
  pais: string;
  paisEmoji?: string;
  fechaEntrada: string;
  fechaSalida?: string;
  tipoSello?: 'entrada' | 'salida' | 'transito';
  puestoFronterizo?: string;
  observaciones?: string;
  penalizaciones?: string;
}

interface PassportStampsModalProps {
  visible: boolean;
  stamps: PassportStamp[];
  onClose: () => void;
  onSave: (stamps: PassportStamp[]) => void;
}

export function PassportStampsModal({ visible, stamps, onClose, onSave }: PassportStampsModalProps) {
  const [localStamps, setLocalStamps] = useState<PassportStamp[]>(stamps);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Estado del formulario de nuevo sello
  const [newStamp, setNewStamp] = useState<PassportStamp>({
    pais: '',
    paisEmoji: '',
    fechaEntrada: '',
    fechaSalida: '',
    tipoSello: 'entrada',
    puestoFronterizo: '',
    observaciones: '',
    penalizaciones: '',
  });

  // Sincronizar localStamps con props cuando el modal se abre o stamps cambia
  useEffect(() => {
    if (visible) {
      console.log('🟢 PassportStampsModal abierto con', stamps.length, 'sellos');
      setLocalStamps(stamps);
      setEditingIndex(null);
      setShowAddForm(false);
    }
  }, [visible, stamps]);

  const resetForm = () => {
    setNewStamp({
      pais: '',
      paisEmoji: '',
      fechaEntrada: '',
      fechaSalida: '',
      tipoSello: 'entrada',
      puestoFronterizo: '',
      observaciones: '',
      penalizaciones: '',
    });
    setEditingIndex(null);
    setShowAddForm(false);
  };

  const handleAddStamp = () => {
    if (!newStamp.pais.trim()) {
      Alert.alert('Error', 'El país es obligatorio');
      return;
    }
    if (!newStamp.fechaEntrada.trim()) {
      Alert.alert('Error', 'La fecha de entrada es obligatoria');
      return;
    }

    if (editingIndex !== null) {
      // Editar sello existente
      const updated = [...localStamps];
      updated[editingIndex] = { ...newStamp };
      setLocalStamps(updated);
    } else {
      // Añadir nuevo sello
      setLocalStamps([...localStamps, { ...newStamp }]);
    }

    resetForm();
  };

  const handleEditStamp = (index: number) => {
    setNewStamp({ ...localStamps[index] });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleDeleteStamp = (index: number) => {
    Alert.alert(
      'Eliminar sello',
      `¿Eliminar sello de ${localStamps[index].pais}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setLocalStamps(localStamps.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const handleSave = () => {
    console.log('🟢 Guardando', localStamps.length, 'sellos');
    onSave(localStamps);
    onClose();
  };

  // Contar países únicos (no sellos totales)
  const uniqueCountries = new Set(localStamps.map(s => s.pais.toLowerCase().trim())).size;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white pt-12">
        {/* Header */}
        <View className="bg-purple-500 p-6 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl font-bold">✈️ Sellos de Viaje</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-white text-2xl">✕</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center mt-1">
            <Text className="text-white text-sm">
              {uniqueCountries} país{uniqueCountries !== 1 ? 'es' : ''} visitado{uniqueCountries !== 1 ? 's' : ''}
            </Text>
            <Text className="text-white/70 text-sm ml-2">• {localStamps.length} sello{localStamps.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        <ScrollView className="flex-1 p-6">
          {/* Lista de sellos */}
          {!showAddForm && localStamps.length > 0 && (
            <View className="mb-4">
              {localStamps.map((stamp, idx) => (
                <View key={idx} className="bg-white rounded-xl border-2 border-purple-200 p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-2xl mr-2">{stamp.paisEmoji || '🌍'}</Text>
                      <Text className="text-lg font-semibold text-neutral-900">{stamp.pais}</Text>
                    </View>
                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={() => handleEditStamp(idx)}
                        className="bg-blue-100 px-3 py-1 rounded mr-2"
                      >
                        <Text className="text-xs text-blue-700">✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteStamp(idx)}
                        className="bg-red-100 px-3 py-1 rounded"
                      >
                        <Text className="text-xs text-red-700">🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="bg-purple-50 rounded p-2 mb-2">
                    <Text className="text-xs text-purple-700 font-semibold mb-1">
                      {stamp.tipoSello === 'entrada' ? '🛬 Entrada' : stamp.tipoSello === 'salida' ? '🛫 Salida' : '🔄 Tránsito'}
                    </Text>
                    <Text className="text-sm text-neutral-700">
                      📅 {stamp.fechaEntrada}
                      {stamp.fechaSalida && ` → ${stamp.fechaSalida}`}
                    </Text>
                  </View>

                  {stamp.puestoFronterizo && (
                    <Text className="text-xs text-neutral-600 mb-1">
                      🛃 {stamp.puestoFronterizo}
                    </Text>
                  )}

                  {stamp.observaciones && (
                    <Text className="text-xs text-neutral-600 italic mb-1">
                      💬 {stamp.observaciones}
                    </Text>
                  )}

                  {stamp.penalizaciones && (
                    <View className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                      <Text className="text-xs text-red-700 font-semibold">⚠️ Penalizaciones:</Text>
                      <Text className="text-xs text-red-600">{stamp.penalizaciones}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Formulario de añadir/editar */}
          {showAddForm && (
            <View className="bg-purple-50 rounded-xl p-4 mb-4">
              <Text className="text-lg font-bold text-purple-900 mb-4">
                {editingIndex !== null ? '✏️ Editar Sello' : '➕ Nuevo Sello'}
              </Text>

              {/* País */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-neutral-700 mb-1">País *</Text>
                <TextInput
                  value={newStamp.pais}
                  onChangeText={(text) => setNewStamp({ ...newStamp, pais: text })}
                  placeholder="Ej: Francia"
                  className="bg-white border border-neutral-300 rounded-lg p-3"
                />
              </View>

              {/* Emoji */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-neutral-700 mb-1">Emoji (opcional)</Text>
                <TextInput
                  value={newStamp.paisEmoji}
                  onChangeText={(text) => setNewStamp({ ...newStamp, paisEmoji: text })}
                  placeholder="🇫🇷"
                  className="bg-white border border-neutral-300 rounded-lg p-3"
                  maxLength={2}
                />
              </View>

              {/* Tipo de sello */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-neutral-700 mb-1">Tipo de Sello</Text>
                <View className="flex-row">
                  {['entrada', 'salida', 'transito'].map((tipo) => (
                    <TouchableOpacity
                      key={tipo}
                      onPress={() => setNewStamp({ ...newStamp, tipoSello: tipo as any })}
                      className={`flex-1 mr-2 p-3 rounded-lg border-2 ${
                        newStamp.tipoSello === tipo
                          ? 'bg-purple-100 border-purple-500'
                          : 'bg-white border-neutral-300'
                      }`}
                    >
                      <Text className={`text-center font-semibold text-xs ${
                        newStamp.tipoSello === tipo ? 'text-purple-700' : 'text-neutral-600'
                      }`}>
                        {tipo === 'entrada' ? '🛬 Entrada' : tipo === 'salida' ? '🛫 Salida' : '🔄 Tránsito'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fecha de entrada */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-neutral-700 mb-1">Fecha de Entrada *</Text>
                <TextInput
                  value={newStamp.fechaEntrada}
                  onChangeText={(text) => setNewStamp({ ...newStamp, fechaEntrada: text })}
                  placeholder="DD/MM/YYYY"
                  className="bg-white border border-neutral-300 rounded-lg p-3"
                />
              </View>

              {/* Fecha de salida */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-neutral-700 mb-1">Fecha de Salida (opcional)</Text>
                <TextInput
                  value={newStamp.fechaSalida}
                  onChangeText={(text) => setNewStamp({ ...newStamp, fechaSalida: text })}
                  placeholder="DD/MM/YYYY"
                  className="bg-white border border-neutral-300 rounded-lg p-3"
                />
              </View>

              {/* Puesto fronterizo */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-neutral-700 mb-1">Puesto Fronterizo (opcional)</Text>
                <TextInput
                  value={newStamp.puestoFronterizo}
                  onChangeText={(text) => setNewStamp({ ...newStamp, puestoFronterizo: text })}
                  placeholder="Ej: Aeropuerto Charles de Gaulle"
                  className="bg-white border border-neutral-300 rounded-lg p-3"
                />
              </View>

              {/* Observaciones */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-neutral-700 mb-1">Observaciones (opcional)</Text>
                <TextInput
                  value={newStamp.observaciones}
                  onChangeText={(text) => setNewStamp({ ...newStamp, observaciones: text })}
                  placeholder="Ej: Turismo, vacaciones"
                  className="bg-white border border-neutral-300 rounded-lg p-3"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Penalizaciones */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-red-700 mb-1">⚠️ Penalizaciones / Multas (opcional)</Text>
                <TextInput
                  value={newStamp.penalizaciones}
                  onChangeText={(text) => setNewStamp({ ...newStamp, penalizaciones: text })}
                  placeholder="Ej: Multa por exceso de equipaje"
                  className="bg-red-50 border border-red-300 rounded-lg p-3"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Botones del formulario */}
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleAddStamp}
                  className="flex-1 bg-purple-500 p-3 rounded-lg items-center"
                >
                  <Text className="text-white font-bold">
                    {editingIndex !== null ? '💾 Guardar Cambios' : '➕ Añadir Sello'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={resetForm}
                  className="bg-neutral-200 px-4 p-3 rounded-lg items-center"
                >
                  <Text className="text-neutral-700 font-semibold">✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Botón añadir nuevo */}
          {!showAddForm && (
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              className="bg-purple-500 p-4 rounded-xl items-center mb-4"
            >
              <Text className="text-white font-bold text-lg">➕ Añadir País Visitado</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Footer: Guardar */}
        {!showAddForm && (
          <View className="p-6 border-t border-neutral-200">
            <TouchableOpacity
              onPress={handleSave}
              className="bg-green-500 p-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-lg">💾 Guardar Sellos</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

