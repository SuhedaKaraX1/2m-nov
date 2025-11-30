import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { categoryConfig, ChallengeCategory, Challenge } from '../types';
import { useTheme } from '../contexts/ThemeContext';

export default function MyChallengesScreen({ navigation }: any) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, isDark } = useTheme();

  const loadChallenges = async () => {
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadChallenges();
  };

  const handleDelete = (challenge: Challenge) => {
    Alert.alert(
      'Delete Challenge',
      `Are you sure you want to delete "${challenge.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
            Alert.alert('Success', 'Challenge deleted');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>My Challenges</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateChallenge')}
        >
          <Text style={[styles.addButtonText, { color: colors.textInverse }]}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {challenges.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No custom challenges</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Create your own challenges to personalize your journey
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('CreateChallenge')}
            >
              <Text style={[styles.createButtonText, { color: colors.textInverse }]}>Create Challenge</Text>
            </TouchableOpacity>
          </View>
        ) : (
          challenges.map((challenge) => (
            <View key={challenge.id} style={[styles.challengeCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
              <View style={styles.challengeHeader}>
                <View
                  style={[
                    styles.categoryDot,
                    {
                      backgroundColor:
                        categoryConfig[challenge.category as ChallengeCategory]
                          ?.color || colors.primary,
                    },
                  ]}
                />
                <Text style={[styles.challengeCategory, { color: colors.textSecondary }]}>
                  {categoryConfig[challenge.category as ChallengeCategory]
                    ?.label || challenge.category}
                </Text>
                <Text style={[styles.pointsBadge, { color: colors.success }]}>+{challenge.points} pts</Text>
              </View>
              <Text style={[styles.challengeTitle, { color: colors.text }]}>{challenge.title}</Text>
              <Text style={[styles.challengeDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {challenge.description}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.errorLight }]}
                  onPress={() => handleDelete(challenge)}
                >
                  <Text style={[styles.deleteButtonText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    fontWeight: '600',
  },
  challengeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    flex: 1,
  },
  pointsBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontWeight: '600',
  },
});
