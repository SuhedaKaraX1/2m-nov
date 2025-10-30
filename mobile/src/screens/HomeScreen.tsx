import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/MainNavigator';
import { colors, typography } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  const { data: randomChallenge, isLoading } = useQuery({
    queryKey: ['/api/challenges/random'],
  });

  const { data: progress } = useQuery({
    queryKey: ['/api/progress'],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>2Mins Challenge</Text>
        <Text style={styles.subtitle}>Your daily 2-minute habits</Text>
      </View>

      {progress && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progress.totalChallengesCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{progress.currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.categories.learning }]}>{progress.totalPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Challenge</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : randomChallenge ? (
          <TouchableOpacity
            style={styles.challengeCard}
            onPress={() => navigation.navigate('ChallengeDetail', { id: randomChallenge.id })}
          >
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeCategory}>{randomChallenge.category}</Text>
              <View style={styles.pointsBadge}>
                <Ionicons name="flash" size={16} color={colors.categories.learning} />
                <Text style={styles.pointsText}>{randomChallenge.points}</Text>
              </View>
            </View>
            <Text style={styles.challengeTitle}>{randomChallenge.title}</Text>
            <Text style={styles.challengeDescription} numberOfLines={2}>
              {randomChallenge.description}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.heading,
    color: colors.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedForeground,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.foreground,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedForeground,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.semibold,
    color: colors.foreground,
    marginBottom: 12,
  },
  challengeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeCategory: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.categories.learning,
  },
  challengeTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.foreground,
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedForeground,
  },
});
