import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Badge, BadgeText } from '@/components/ui/badge';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Image URLs from Figma
const img2 = 'https://www.figma.com/api/mcp/asset/f4a67cfe-f942-4b73-8774-39580028f1a3';
const imgFrame1 = 'https://www.figma.com/api/mcp/asset/235a463f-735b-4bbe-a18c-51322cd67e08';
const imgAvatar = 'https://www.figma.com/api/mcp/asset/a3e28812-73b1-4d42-83fe-18caa3478c15';
const imgAvatar1 = 'https://www.figma.com/api/mcp/asset/bb9b79b0-89a6-418c-8334-22f03e57f913';
const imgGroup = 'https://www.figma.com/api/mcp/asset/2d3e3218-c87e-41ad-94c1-7f59e0f1045f';
const imgIconFrame = 'https://www.figma.com/api/mcp/asset/6173a8d3-4bb8-4bec-a69e-be1346e78e9d';
const imgPlus = 'https://www.figma.com/api/mcp/asset/070037b4-64c5-4e14-a295-62ac54166967';
const imgCalendar = 'https://www.figma.com/api/mcp/asset/b0f24a1f-b738-43ea-bc80-a044a7722573';
const imgUser = 'https://www.figma.com/api/mcp/asset/685e2621-0a7e-4b9b-9edd-decdc25f4586';
const imgCheck = 'https://www.figma.com/api/mcp/asset/d2c6cb34-0471-4da7-8ee0-8fce239c3217';
const imgPlusWhite = 'https://www.figma.com/api/mcp/asset/e8b3bc13-f19f-46cf-9d41-c86176f4adb4';
const imgUnion = 'https://www.figma.com/api/mcp/asset/ad5bcbbb-4881-4dd3-b64a-ad932f7a2e59';

// Avatar Component
type AvatarProps = {
  source?: string;
  size?: number;
  style?: any;
};

function Avatar({ source, size = 24, style }: AvatarProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#333333',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#333333',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Image
            source={{ uri: imgUser }}
            style={{ width: size * 0.6, height: size * 0.6 }}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}

// Trip Card Component
type TripCardProps = {
  title: string;
  location: string;
  dates: string;
  participants: number;
  image?: string;
};

function TripCard({ title, location, dates, participants, image = img2 }: TripCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.tripCard}
    >
      <Image
        source={{ uri: image }}
        style={styles.tripCardImage}
        resizeMode="cover"
      />
      <View style={styles.tripCardContent}>
        <View style={styles.tripCardLeft}>
          <View style={styles.tripCardTextContainer}>
            <Text style={styles.tripCardTitle}>{title}</Text>
            <Text style={styles.tripCardLocation}>{location}</Text>
          </View>
          <Text style={styles.tripCardDates}>{dates}</Text>
        </View>
        <Badge
          action="muted"
          variant="outline"
          size="sm"
        >
          <Image
            source={{ uri: imgUser }}
            style={{ width: 12, height: 12, marginRight: 4 }}
            resizeMode="contain"
          />
          <BadgeText size="sm">
            {participants} personas
          </BadgeText>
        </Badge>
      </View>
    </TouchableOpacity>
  );
}

// Group Card Component
type GroupCardProps = {
  name: string;
  image?: string;
};

function GroupCard({ name, image = img2 }: GroupCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.groupCard}
    >
      <Image
        source={{ uri: image }}
        style={styles.groupCardImage}
        resizeMode="cover"
      />
      <Text style={styles.groupCardName}>{name}</Text>
    </TouchableOpacity>
  );
}

// Menu Mobile Component
function MenuMobile() {
  const router = useRouter();

  return (
    <View style={styles.menuMobile}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.menuItem}
        onPress={() => router.push('/(authenticated)/home')}
      >
        <Image
          source={{ uri: imgCheck }}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
        <Text style={styles.menuItemText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.menuItem}
        onPress={() => router.push('/(authenticated)/profile')}
      >
        <Avatar size={24} />
        <Text style={styles.menuItemText}>Perfil</Text>
      </TouchableOpacity>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.fab}
        onPress={() => router.push('/(authenticated)/create-group')}
      >
        <Image
          source={{ uri: imgPlusWhite }}
          style={{ width: 18, height: 18 }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

export function ProductionHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.welcomeTitle}>Bienvenido</Text>
          
          <View style={styles.nextTripSection}>
            <Text style={styles.nextTripLabel}>Tu próximo viaje a</Text>
            
            {/* Next Trip Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.nextTripCard}
              onPress={() => router.push('/(authenticated)/group-detail')}
            >
              <Image
                source={{ uri: imgFrame1 }}
                style={styles.nextTripBackground}
                resizeMode="cover"
              />
              <View style={styles.nextTripOverlay} />
              
              {/* Date Badge */}
              <View style={styles.nextTripTopRight}>
                <Badge
                  action="info"
                  variant="solid"
                  size="sm"
                >
                  <Image
                    source={{ uri: imgCalendar }}
                    style={{ width: 12, height: 12, marginRight: 4 }}
                    resizeMode="contain"
                  />
                  <BadgeText size="sm">
                    12 Feb - 04 Mar 2026
                  </BadgeText>
                </Badge>
              </View>
              
              {/* Trip Info */}
              <View style={styles.nextTripBottom}>
                <View style={styles.nextTripInfo}>
                  <Text style={styles.nextTripTitle}>Marruecos</Text>
                  <Text style={styles.nextTripSubtitle}>Pekín, China</Text>
                </View>
                
                {/* Avatars */}
                <View style={styles.avatarsContainer}>
                  <Avatar source={imgAvatar} size={24} style={styles.avatarOverlap} />
                  <Avatar source={imgAvatar1} size={24} style={styles.avatarOverlap} />
                  <View style={[styles.avatarOverlap, styles.avatarPlus]}>
                    <Text style={styles.avatarPlusText}>+5</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Groups Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus grupos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupsScroll}
          >
            <GroupCard name="Casa" />
            <GroupCard name="Casa" />
            <GroupCard name="Casa" />
            <GroupCard name="Casa" />
            <GroupCard name="Casa" />
          </ScrollView>
        </View>

        {/* Upcoming Trips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleSmall}>Viajes próximos</Text>
          <View style={styles.tripsList}>
            <TripCard
              title="Menhinos Chinos"
              location="Pekín, China"
              dates="12 Oct - 21 Oct 2026"
              participants={5}
            />
            <TripCard
              title="Menhinos Chinos"
              location="Pekín, China"
              dates="12 Oct - 21 Oct 2026"
              participants={5}
            />
            <TripCard
              title="Menhinos Chinos"
              location="Pekín, China"
              dates="12 Oct - 21 Oct 2026"
              participants={5}
            />
            <TripCard
              title="Menhinos Chinos"
              location="Pekín, China"
              dates="12 Oct - 21 Oct 2026"
              participants={5}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Menu */}
      <MenuMobile />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 108, // Space for bottom menu + FAB
  },
  headerSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#181718',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  nextTripSection: {
    gap: 8,
  },
  nextTripLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A5A4A4',
  },
  nextTripCard: {
    height: 173,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  nextTripBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  nextTripOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  nextTripTopRight: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  nextTripBottom: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextTripInfo: {
    gap: 4,
  },
  nextTripTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  nextTripSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9D9D9D',
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    marginLeft: -16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlus: {
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlusText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#181718',
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  sectionTitleSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181718',
    letterSpacing: 0.2,
    marginBottom: 16,
  },
  groupsScroll: {
    gap: 8,
  },
  groupCard: {
    width: 80,
    backgroundColor: '#FDFDFD',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    gap: 8,
  },
  groupCardImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  groupCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#181718',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  tripsList: {
    gap: 8,
  },
  tripCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F3F3',
    padding: 8,
    flexDirection: 'row',
    gap: 8,
  },
  tripCardImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  tripCardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripCardLeft: {
    flex: 1,
    justifyContent: 'space-between',
    height: 64,
  },
  tripCardTextContainer: {
    gap: 4,
  },
  tripCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#181718',
    letterSpacing: 0.2,
  },
  tripCardLocation: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9D9D9D',
  },
  tripCardDates: {
    fontSize: 12,
    fontWeight: '400',
    color: '#181718',
  },
  menuMobile: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#333333',
  },
  fab: {
    position: 'absolute',
    bottom: 63,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#262626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
});
