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

export default function MyChallengesScreen({ navigation }: any) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Challenges</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateChallenge')}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No custom challenges</Text>
            <Text style={styles.emptyText}>
              Create your own challenges to personalize your journey
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateChallenge')}
            >
              <Text style={styles.createButtonText}>Create Challenge</Text>
            </TouchableOpacity>
          </View>
        ) : (
          challenges.map((challenge) => (
            <View key={challenge.id} style={styles.challengeCard}>
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
                <Text style={styles.pointsBadge}>+{challenge.points} pts</Text>
              </View>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDescription} numberOfLines={2}>
                {challenge.description}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(challenge)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
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
    backgroundColor: '#f8fafc',
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
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
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
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  pointsBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fef2f2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
});
