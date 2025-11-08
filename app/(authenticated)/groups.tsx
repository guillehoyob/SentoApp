import { Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useGroups } from '../../src/hooks/useGroups';
import { Button } from '../../src/components/Button';
import { isGroupExpired } from '../../src/services/groups.service';

export default function GroupsScreen() {
  const router = useRouter();
  const { groups, loading, error, refreshGroups } = useGroups();

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card pt-[50px] pb-lg px-lg border-b border-neutral-100">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mb-md"
          activeOpacity={0.7}
        >
          <Text className="font-body-medium text-base text-primary">← Volver al inicio</Text>
        </TouchableOpacity>
        <Text className="font-display text-[32px] text-text-primary leading-[40px]">
          Mis Grupos
        </Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshGroups} />
        }
      >
        {error && (
          <View className="bg-danger/10 p-lg rounded-xl mb-md border border-danger/30">
            <Text className="font-body-medium text-base text-danger">{error}</Text>
          </View>
        )}

        {loading && groups.length === 0 ? (
          <View className="items-center mt-3xl">
            <ActivityIndicator size="large" color="#FF5050" />
            <Text className="font-body text-base text-neutral-500 mt-md">
              Cargando grupos...
            </Text>
          </View>
        ) : groups.length === 0 ? (
          <View className="items-center mt-3xl mb-xl bg-card rounded-2xl p-xl">
            <Text className="text-[64px] mb-md">🌍</Text>
            <Text className="font-body-semibold text-xl text-neutral-700 mb-xs text-center">
              No tienes grupos aún
            </Text>
            <Text className="font-body text-base text-neutral-500 text-center mb-xl">
              Crea tu primer grupo o viaje y{'\n'}comienza a organizar
            </Text>
            <Button
              title="✨ Crear mi primer grupo"
              onPress={() => router.push('/(authenticated)/create-group')}
            />
          </View>
        ) : (
          <>
            <View className="gap-md mb-md">
              {groups.map((group) => {
                const expired = isGroupExpired(group);
                return (
                  <TouchableOpacity
                    key={group.id}
                    className={`bg-card rounded-2xl p-lg shadow-md ${
                      expired ? 'opacity-70 border-2 border-warning/30' : 'border-2 border-transparent'
                    }`}
                    onPress={() => router.push(`/(authenticated)/group-detail?id=${group.id}`)}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row justify-between items-start mb-md">
                      <View className="flex-1 mr-md">
                        <Text className="font-body-semibold text-xl text-text-primary mb-xs">
                          {group.name}
                        </Text>
                        {group.destination && (
                          <Text className="font-body text-base text-neutral-600">
                            📍 {group.destination}
                          </Text>
                        )}
                      </View>
                      <View className={`px-md py-xs rounded-full ${
                        group.type === 'trip' ? 'bg-primary/15' : 'bg-neutral-200'
                      }`}>
                        <Text className={`font-body-semibold text-sm ${
                          group.type === 'trip' ? 'text-primary' : 'text-neutral-600'
                        }`}>
                          {group.type === 'trip' ? '✈️' : '👥'}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center gap-lg mb-sm">
                      <View className="flex-1">
                        <Text className="font-body text-sm text-neutral-500">
                          📅 {new Date(group.start_date).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                          {group.end_date && ` - ${new Date(group.end_date).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short' 
                          })}`}
                        </Text>
                      </View>
                      {group.members && (
                        <View className="bg-primary/10 px-md py-xs rounded-full">
                          <Text className="font-body-semibold text-sm text-primary">
                            {group.members.length} 👤
                          </Text>
                        </View>
                      )}
                    </View>

                    {expired && (
                      <View className="bg-warning/15 px-md py-xs rounded-lg mt-sm">
                        <Text className="font-body-medium text-sm text-warning">
                          ⏰ Finalizado
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="+ Crear nuevo grupo"
              onPress={() => router.push('/(authenticated)/create-group')}
              variant="secondary"
              className="mt-lg"
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
