import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useGroups } from '../../src/hooks/useGroups';
import { Button } from '../../src/components/Button';
import { isGroupExpired } from '../../src/services/groups.service';

export default function GroupsScreen() {
  const router = useRouter();
  const { groups, loading, error, refreshGroups } = useGroups();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Grupos</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshGroups} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && groups.length === 0 ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes grupos aún</Text>
            <Text style={styles.emptySubtext}>Crea tu primer grupo o viaje</Text>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => {
              const expired = isGroupExpired(group);
              return (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.groupCard, expired && styles.groupCardExpired]}
                  onPress={() => router.push(`/(authenticated)/group-detail?id=${group.id}`)}
                >
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={[styles.groupType, group.type === 'trip' && styles.groupTypeTrip]}>
                      {group.type === 'trip' ? '✈️ Viaje' : '👥 Grupo'}
                    </Text>
                  </View>
                  
                  {group.destination && (
                    <Text style={styles.groupDestination}>📍 {group.destination}</Text>
                  )}
                  
                  <View style={styles.groupDates}>
                    <Text style={styles.groupDate}>
                      Inicio: {new Date(group.start_date).toLocaleDateString()}
                    </Text>
                    {group.end_date && (
                      <Text style={styles.groupDate}>
                        Fin: {new Date(group.end_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  {expired && (
                    <Text style={styles.expiredBadge}>⏰ Finalizado</Text>
                  )}

                  {group.members && (
                    <Text style={styles.groupMembers}>
                      {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Button
          title="+ Crear Grupo/Viaje"
          onPress={() => router.push('/(authenticated)/create-group')}
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
  loader: {
    marginTop: 40,
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
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  groupsList: {
    marginBottom: 20,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupCardExpired: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  groupType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  groupTypeTrip: {
    backgroundColor: '#E3F2FD',
    color: '#007AFF',
  },
  groupDestination: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  groupDates: {
    marginBottom: 8,
  },
  groupDate: {
    fontSize: 13,
    color: '#999',
  },
  groupMembers: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  expiredBadge: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 4,
  },
  createButton: {
    marginTop: 20,
  },
});

