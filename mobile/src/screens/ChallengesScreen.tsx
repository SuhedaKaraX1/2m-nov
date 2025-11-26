import React, { useEffect, useState } from 'react';
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
import { Challenge, ChallengeCategory, categoryConfig, difficultyConfig } from '../types';

export default function ChallengesScreen({ route, navigation }: any) {
  const initialCategory = route.params?.category;
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | 'all'>(
    initialCategory || 'all'
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChallenges = async () => {
    try {
      const data = await apiService.getChallenges(
        selectedCategory !== 'all' ? selectedCategory : undefined
      );
      setChallenges(data || []);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChallenges();
  };

  const handleChallengePress = (id: string) => {
    navigation.navigate('ChallengeDetail', { id });
  };

  const categories = ['all', ...Object.keys(categoryConfig)] as const;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              selectedCategory === cat && styles.filterChipSelected,
            ]}
            onPress={() => setSelectedCategory(cat as ChallengeCategory | 'all')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === cat && styles.filterChipTextSelected,
              ]}
            >
              {cat === 'all'
                ? 'All'
                : categoryConfig[cat as ChallengeCategory]?.label || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No challenges found</Text>
            <Text style={styles.emptyText}>
              Try selecting a different category
            </Text>
          </View>
        ) : (
          challenges.map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeCard}
              onPress={() => handleChallengePress(challenge.id)}
            >
              <View style={styles.challengeHeader}>
                <View
                  style={[
                    styles.categoryDot,
                    {
                      backgroundColor:
                        categoryConfig[challenge.category as ChallengeCategory]
                          ?.color || '#3b82f6',
                    },
                  ]}
                />
                <Text style={styles.challengeCategory}>
                  {categoryConfig[challenge.category as ChallengeCategory]
                    ?.label || challenge.category}
                </Text>
                <View
                  style={[
                    styles.difficultyBadge,
                    {
                      backgroundColor:
                        difficultyConfig[challenge.difficulty as keyof typeof difficultyConfig]
                          ?.color + '20' || '#3b82f620',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      {
                        color:
                          difficultyConfig[challenge.difficulty as keyof typeof difficultyConfig]
                            ?.color || '#3b82f6',
                      },
                    ]}
                  >
                    {challenge.difficulty}
                  </Text>
                </View>
              </View>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDescription} numberOfLines={2}>
                {challenge.description}
              </Text>
              <View style={styles.challengeFooter}>
                <Text style={styles.pointsText}>+{challenge.points} pts</Text>
                <Text style={styles.startText}>Start →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  challengeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  challengeCategory: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  startText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
});
