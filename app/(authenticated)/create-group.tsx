import { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useGroups } from '../../src/hooks/useGroups';
import { Button } from '../../src/components/Button';
import { TextInputComponent } from '../../src/components/TextInput';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { supabase } from '../../src/services/supabase';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { createGroup } = useGroups();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'trip' | 'group'>('trip');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [documentRequirements, setDocumentRequirements] = useState<{
    [key: string]: { required: boolean; optional: boolean };
  }>({
    passport: { required: false, optional: false },
    id_card: { required: false, optional: false },
    insurance: { required: false, optional: false },
    license: { required: false, optional: false },
  });

  const handleCreate = async () => {
    setError('');

    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!startDate.trim()) {
      setError('La fecha de inicio es obligatoria');
      return;
    }

    if (type === 'trip' && !endDate.trim()) {
      setError('La fecha de fin es obligatoria para viajes');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      setError('Formato de fecha de inicio inválido (usar YYYY-MM-DD)');
      return;
    }

    if (type === 'trip' && endDate && !dateRegex.test(endDate)) {
      setError('Formato de fecha de fin inválido (usar YYYY-MM-DD)');
      return;
    }

    try {
      setLoading(true);
      const newGroup = await createGroup({
        name,
        type,
        start_date: startDate,
        end_date: type === 'trip' ? endDate : undefined,
        destination: destination.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Guardar requisitos de documentos si hay alguno seleccionado
      const requirements = Object.entries(documentRequirements)
        .filter(([_, value]) => value.required || value.optional)
        .map(([docType, value]) => ({
          type: docType,
          required: value.required,
        }));

      if (requirements.length > 0 && newGroup?.id) {
        await supabase.rpc('set_group_requirements', {
          p_group_id: newGroup.id,
          p_requirements: requirements,
        });
      }

      router.back();
      
      setTimeout(() => {
        Alert.alert('Éxito', `${type === 'trip' ? 'Viaje' : 'Grupo'} creado correctamente`);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setLoading(false);
    }
  };

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
        <Text className="font-display text-[32px] text-text-primary leading-[40px] mb-xs">
          Nuevo {type === 'trip' ? 'Viaje' : 'Grupo'}
        </Text>
        <Text className="font-body text-base text-neutral-600">
          Completa la información básica
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <ErrorMessage message={error} />

        {/* Selector de tipo mejorado */}
        <View className="mb-xl">
          <Text className="font-body-semibold text-base text-neutral-900 mb-md">
            Tipo de grupo
          </Text>
          <View className="flex-row gap-md">
            <TouchableOpacity
              className={`flex-1 py-lg rounded-2xl border-2 ${
                type === 'trip' 
                  ? 'bg-primary border-primary' 
                  : 'bg-white border-neutral-200'
              }`}
              onPress={() => setType('trip')}
              activeOpacity={0.8}
            >
              <Text className="text-[32px] text-center mb-xs">✈️</Text>
              <Text className={`font-body-semibold text-base text-center ${
                type === 'trip' ? 'text-white' : 'text-neutral-700'
              }`}>
                Viaje
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-lg rounded-2xl border-2 ${
                type === 'group' 
                  ? 'bg-primary border-primary' 
                  : 'bg-white border-neutral-200'
              }`}
              onPress={() => setType('group')}
              activeOpacity={0.8}
            >
              <Text className="text-[32px] text-center mb-xs">👥</Text>
              <Text className={`font-body-semibold text-base text-center ${
                type === 'group' ? 'text-white' : 'text-neutral-700'
              }`}>
                Grupo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInputComponent
          label="Nombre *"
          placeholder={type === 'trip' ? 'Viaje a París' : 'Grupo de amigos'}
          value={name}
          onChangeText={setName}
        />

        <TextInputComponent
          label="Fecha de inicio * (YYYY-MM-DD)"
          placeholder="2025-12-01"
          value={startDate}
          onChangeText={setStartDate}
        />

        {type === 'trip' && (
          <TextInputComponent
            label="Fecha de fin * (YYYY-MM-DD)"
            placeholder="2025-12-10"
            value={endDate}
            onChangeText={setEndDate}
          />
        )}

        <TextInputComponent
          label={type === 'trip' ? 'Destino' : 'Ubicación'}
          placeholder={type === 'trip' ? 'París, Francia' : 'Madrid, España'}
          value={destination}
          onChangeText={setDestination}
        />

        <TextInputComponent
          label="Notas"
          placeholder="Descripción, itinerario, etc."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {/* Requisitos de documentos */}
        <View className="mt-6 mb-4">
          <Text className="font-body-semibold text-base text-neutral-900 mb-2">
            Documentos requeridos (opcional)
          </Text>
          <Text className="text-sm text-neutral-600 mb-4">
            Los miembros verán qué documentos necesitan compartir
          </Text>

          {[
            { key: 'passport', label: 'Pasaporte', emoji: '🛂' },
            { key: 'id_card', label: 'DNI/Cédula', emoji: '🪪' },
            { key: 'insurance', label: 'Seguro', emoji: '🏥' },
            { key: 'license', label: 'Licencia', emoji: '🚗' },
          ].map((doc) => (
            <View key={doc.key} className="flex-row items-center justify-between bg-white rounded-lg p-3 mb-2 border border-neutral-200">
              <View className="flex-row items-center flex-1">
                <Text className="text-2xl mr-2">{doc.emoji}</Text>
                <Text className="text-sm font-medium">{doc.label}</Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => {
                    const isCurrentlyRequired = documentRequirements[doc.key].required;
                    setDocumentRequirements({
                      ...documentRequirements,
                      [doc.key]: {
                        required: !isCurrentlyRequired,
                        optional: false, // Desactivar opcional siempre
                      },
                    });
                  }}
                  className={`px-3 py-1 rounded ${
                    documentRequirements[doc.key].required ? 'bg-red-100 border-red-300' : 'bg-neutral-100'
                  } border`}
                >
                  <Text className={`text-xs font-semibold ${documentRequirements[doc.key].required ? 'text-red-700' : 'text-neutral-600'}`}>
                    Obligatorio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const isCurrentlyOptional = documentRequirements[doc.key].optional;
                    setDocumentRequirements({
                      ...documentRequirements,
                      [doc.key]: {
                        required: false, // Desactivar obligatorio siempre
                        optional: !isCurrentlyOptional,
                      },
                    });
                  }}
                  className={`px-3 py-1 rounded ${
                    documentRequirements[doc.key].optional ? 'bg-yellow-100 border-yellow-300' : 'bg-neutral-100'
                  } border`}
                >
                  <Text className={`text-xs font-semibold ${documentRequirements[doc.key].optional ? 'text-yellow-700' : 'text-neutral-600'}`}>
                    Opcional
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <Button
          title={`Crear ${type === 'trip' ? 'Viaje' : 'Grupo'}`}
          onPress={handleCreate}
          loading={loading}
          className="mt-md"
        />
      </ScrollView>
    </View>
  );
}
