import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
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

    // Validar formato de fecha (YYYY-MM-DD)
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

      // Navegar de vuelta y refrescar la lista
      router.back();
      
      // Mostrar mensaje de éxito después de navegar
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crear Grupo/Viaje</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ErrorMessage message={error} />

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'trip' && styles.typeButtonActive]}
            onPress={() => setType('trip')}
          >
            <Text style={[styles.typeButtonText, type === 'trip' && styles.typeButtonTextActive]}>
              ✈️ Viaje
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'group' && styles.typeButtonActive]}
            onPress={() => setType('group')}
          >
            <Text style={[styles.typeButtonText, type === 'group' && styles.typeButtonTextActive]}>
              👥 Grupo
            </Text>
          </TouchableOpacity>
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
          style={styles.createButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  createButton: {
    marginTop: 20,
  },
});

