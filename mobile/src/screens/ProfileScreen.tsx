import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const data = await apiService.getProgress();
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout failed:', error);
          }
        },
      },
    ]);
  };

  const preferredCategories = user?.preferredCategories || [];
  const preferredDays = user?.preferredDays || [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0] || user?.username?.[0] || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.firstName
                  ? `${user.firstName} ${user.lastName || ''}`
                  : user?.username || 'User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              {user?.username && (
                <Text style={styles.userHandle}>@{user.username}</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Your Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>
              {loading ? '-' : progress?.totalChallengesCompleted || 0}
            </Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>
              {loading ? '-' : progress?.currentStreak || 0}
            </Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>
              {loading ? '-' : progress?.longestStreak || 0}
            </Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>
              {loading ? '-' : progress?.totalPoints || 0}
            </Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>
      </View>

      {/* Your Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Preferences</Text>
        <View style={styles.card}>
          <Text style={styles.preferenceLabel}>Preferred Categories</Text>
          <View style={styles.tagsContainer}>
            {preferredCategories.length > 0 ? (
              preferredCategories.map((cat: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{cat}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noPreference}>No categories selected</Text>
            )}
          </View>

          <Text style={[styles.preferenceLabel, { marginTop: 16 }]}>
            Challenge Days
          </Text>
          <View style={styles.daysContainer}>
            {dayNames.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.dayBadge,
                  preferredDays.includes(index) && styles.dayBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    preferredDays.includes(index) && styles.dayTextActive,
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>2Mins Challenge</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  userHandle: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  noPreference: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  dayBadgeActive: {
    backgroundColor: '#3b82f6',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  dayTextActive: {
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
