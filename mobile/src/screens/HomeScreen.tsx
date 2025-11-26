import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '../services/api';
import { Challenge, UserProgress, categoryConfig, ChallengeCategory } from '../types';

export default function HomeScreen({ navigation }: any) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [featuredChallenge, setFeaturedChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [progressData, challengeData] = await Promise.all([
        apiService.getProgress(),
        apiService.getRandomChallenge(),
      ]);
      setProgress(progressData);
      setFeaturedChallenge(challengeData);
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

  const handleStartChallenge = () => {
    if (featuredChallenge) {
      navigation.navigate('ChallengeDetail', { id: featuredChallenge.id });
    }
  };

  const handleCategoryPress = (category: ChallengeCategory) => {
    navigation.navigate('AllChallenges', { category });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <Text style={styles.title}>2Mins</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{progress?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>{progress?.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={styles.statValue}>
            {progress?.totalChallengesCompleted || 0}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {featuredChallenge && (
        <View style={styles.featuredCard}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredLabel}>Featured Challenge</Text>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor:
                    categoryConfig[featuredChallenge.category as ChallengeCategory]
                      ?.color || '#3b82f6',
                },
              ]}
            >
              <Text style={styles.categoryBadgeText}>
                {categoryConfig[featuredChallenge.category as ChallengeCategory]
                  ?.label || featuredChallenge.category}
              </Text>
            </View>
          </View>
          <Text style={styles.featuredTitle}>{featuredChallenge.title}</Text>
          <Text style={styles.featuredDescription}>
            {featuredChallenge.description}
          </Text>
          <View style={styles.featuredMeta}>
            <Text style={styles.featuredPoints}>
              +{featuredChallenge.points} pts
            </Text>
            <Text style={styles.featuredDifficulty}>
              {featuredChallenge.difficulty}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartChallenge}
          >
            <Text style={styles.startButtonText}>Start Challenge</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.categoriesGrid}>
        {Object.entries(categoryConfig).map(([key, config]) => (
          <TouchableOpacity
            key={key}
            style={[styles.categoryCard, { borderColor: config.color }]}
            onPress={() => handleCategoryPress(key as ChallengeCategory)}
          >
            <View
              style={[styles.categoryIcon, { backgroundColor: config.color }]}
            >
              <Text style={styles.categoryEmoji}>
                {key === 'physical'
                  ? '🏃'
                  : key === 'mental'
                  ? '🧠'
                  : key === 'learning'
                  ? '📚'
                  : key === 'finance'
                  ? '💰'
                  : key === 'relationships'
                  ? '❤️'
                  : '⚡'}
              </Text>
            </View>
            <Text style={styles.categoryName}>{config.label}</Text>
          </TouchableOpacity>
        ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
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
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  featuredPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  featuredDifficulty: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
});
