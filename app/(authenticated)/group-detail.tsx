import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroup } from '../../src/hooks/useGroup';
import { Button } from '../../src/components/Button';
import { TextInputComponent } from '../../src/components/TextInput';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { group, loading, error, expired, updateGroup, deleteGroup } = useGroup(id || '');
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Grupo no encontrado</Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {group.type === 'trip' ? '✈️ Viaje' : '👥 Grupo'}
          </Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editButton}>✏️ Editar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {expired && (
          <View style={styles.expiredBanner}>
            <Text style={styles.expiredBannerText}>⏰ Este viaje ha finalizado</Text>
          </View>
        )}

        {isEditing ? (
          <View style={styles.form}>
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

            <View style={styles.buttonRow}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setIsEditing(false);
                  // Restaurar valores originales
                  if (group) {
                    setName(group.name);
                    setStartDate(group.start_date);
                    setEndDate(group.end_date || '');
                    setDestination(group.destination || '');
                    setNotes(group.notes || '');
                  }
                }}
                variant="secondary"
                style={styles.buttonHalf}
              />
              <Button
                title="Guardar"
                onPress={handleSave}
                loading={saving}
                style={styles.buttonHalf}
              />
            </View>
          </View>
        ) : (
          <View style={styles.details}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Nombre</Text>
              <Text style={styles.detailValue}>{group.name}</Text>
            </View>

            {group.destination && (
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>📍 Destino</Text>
                <Text style={styles.detailValue}>{group.destination}</Text>
              </View>
            )}

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>📅 Fechas</Text>
              <Text style={styles.detailValue}>
                Inicio: {new Date(group.start_date).toLocaleDateString()}
              </Text>
              {group.end_date && (
                <Text style={styles.detailValue}>
                  Fin: {new Date(group.end_date).toLocaleDateString()}
                </Text>
              )}
            </View>

            {group.notes && (
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>📝 Notas</Text>
                <Text style={styles.detailValue}>{group.notes}</Text>
              </View>
            )}

            {group.members && group.members.length > 0 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>👥 Miembros ({group.members.length})</Text>
                {group.members.map((member) => (
                  <View key={member.user_id} style={styles.memberRow}>
                    <Text style={styles.memberName}>
                      {member.user?.full_name || member.user?.email || 'Usuario'}
                    </Text>
                    <Text style={styles.memberRole}>
                      {member.role === 'owner' ? '👑 Admin' : '👤 Miembro'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Button
              title="Eliminar Grupo"
              onPress={handleDelete}
              variant="danger"
              style={styles.deleteButton}
            />
          </View>
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  editButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    padding: 20,
  },
  loader: {
    marginTop: 100,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  expiredBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  expiredBannerText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  buttonHalf: {
    flex: 1,
  },
  details: {
    gap: 12,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 4,
  },
  memberName: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    marginTop: 20,
  },
});

