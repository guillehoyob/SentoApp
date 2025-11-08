import { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useGroups } from '../../src/hooks/useGroups';
import { Button } from '../../src/components/Button';
import { TextInputComponent } from '../../src/components/TextInput';
import { ErrorMessage } from '../../src/components/ErrorMessage';

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
      await createGroup({
        name,
        type,
        start_date: startDate,
        end_date: type === 'trip' ? endDate : undefined,
        destination: destination.trim() || undefined,
        notes: notes.trim() || undefined,
      });

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
