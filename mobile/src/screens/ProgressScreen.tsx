import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { apiService } from '../services/api';
import { UserProgress, AchievementWithProgress, ChallengeWithDetails, categoryConfig, ChallengeCategory } from '../types';

const { width } = Dimensions.get('window');

const tierColors: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#00ffff',
};

export default function ProgressScreen() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [history, setHistory] = useState<ChallengeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [progressData, achievementsData, historyData] = await Promise.all([
        apiService.getProgress(),
        apiService.getAchievements(),
        apiService.getHistory(),
      ]);
      setProgress(progressData);
      setAchievements(achievementsData || []);
      setHistory(historyData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.screenTitle}>Your Progress</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{progress?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>{progress?.longestStreak || 0}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>{progress?.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={styles.statValue}>
            {progress?.totalChallengesCompleted || 0}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Achievements ({unlockedAchievements.length}/{achievements.length})
        </Text>

        {unlockedAchievements.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.achievementsScroll}
          >
            {unlockedAchievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  { borderColor: tierColors[achievement.tier] || '#3b82f6' },
                ]}
              >
                <Text style={styles.achievementIcon}>🏅</Text>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementTier}>{achievement.tier}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {lockedAchievements.length > 0 && (
          <>
            <Text style={styles.subSectionTitle}>In Progress</Text>
            {lockedAchievements.slice(0, 3).map((achievement) => (
              <View key={achievement.id} style={styles.lockedAchievementCard}>
                <View style={styles.lockedAchievementInfo}>
                  <Text style={styles.lockedAchievementIcon}>🔒</Text>
                  <View style={styles.lockedAchievementText}>
                    <Text style={styles.lockedAchievementName}>
                      {achievement.name}
                    </Text>
                    <Text style={styles.lockedAchievementDesc}>
                      {achievement.description}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${achievement.progressPercent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {achievement.progress}/{achievement.requirementValue}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No completed challenges yet</Text>
          </View>
        ) : (
          history.slice(0, 10).map((item, index) => (
            <View key={index} style={styles.historyCard}>
              <View
                style={[
                  styles.historyDot,
                  {
                    backgroundColor:
                      categoryConfig[item.category as ChallengeCategory]?.color ||
                      '#3b82f6',
                  },
                ]}
              />
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyDate}>
                  {item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString()
                    : ''}
                </Text>
              </View>
              <Text style={styles.historyPoints}>+{item.pointsEarned}</Text>
            </View>
          ))
        )}
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 12,
  },
  achievementsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 100,
    borderWidth: 2,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  achievementTier: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  lockedAchievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  lockedAchievementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedAchievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  lockedAchievementText: {
    flex: 1,
  },
  lockedAchievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  lockedAchievementDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  historyPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});
