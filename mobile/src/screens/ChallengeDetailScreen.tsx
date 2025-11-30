import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import { Challenge, categoryConfig, difficultyConfig, ChallengeCategory } from '../types';

export default function ChallengeDetailScreen({ route, navigation }: any) {
  const { colors, isDark } = useTheme();
  const { id } = route.params;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isComplete, setIsComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadChallenge();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [id]);

  const loadChallenge = async () => {
    try {
      const data = await apiService.getChallenge(id);
      setChallenge(data);
    } catch (error) {
      console.error('Failed to load challenge:', error);
      Alert.alert('Error', 'Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setTimerRunning(true);
    setTimeLeft(120);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 120000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerRunning(false);
    progressAnim.stopAnimation();
  };

  const handleComplete = async () => {
    stopTimer();
    setCompleting(true);
    const timeSpent = 120 - timeLeft;

    try {
      const result = await apiService.completeChallenge(id, timeSpent);
      setPointsEarned(result.pointsEarned || challenge?.points || 0);
      setIsComplete(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete challenge');
    } finally {
      setCompleting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Challenge not found</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.textInverse }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={[styles.completeContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.completeIcon}>🎉</Text>
        <Text style={[styles.completeTitle, { color: colors.text }]}>Challenge Complete!</Text>
        <Text style={[styles.completePoints, { color: colors.success }]}>+{pointsEarned} points</Text>
        <Text style={[styles.completeMessage, { color: colors.textSecondary }]}>
          Great job! You've completed "{challenge.title}"
        </Text>
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.doneButtonText, { color: colors.textInverse }]}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor:
                categoryConfig[challenge.category as ChallengeCategory]?.color ||
                colors.primary,
            },
          ]}
        >
          <Text style={[styles.categoryText, { color: colors.textInverse }]}>
            {categoryConfig[challenge.category as ChallengeCategory]?.label ||
              challenge.category}
          </Text>
        </View>
        <View
          style={[
            styles.difficultyBadge,
            {
              backgroundColor:
                (difficultyConfig[challenge.difficulty as keyof typeof difficultyConfig]
                  ?.color || colors.primary) + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.difficultyText,
              {
                color:
                  difficultyConfig[challenge.difficulty as keyof typeof difficultyConfig]
                    ?.color || colors.primary,
              },
            ]}
          >
            {challenge.difficulty}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{challenge.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{challenge.description}</Text>

      <View style={styles.timerContainer}>
        <View style={[styles.timerCircle, { backgroundColor: colors.cardBackground, borderColor: colors.primary, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(timeLeft)}</Text>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
            {timerRunning ? 'Time Left' : 'Ready?'}
          </Text>
        </View>
        <View style={[styles.progressBarContainer, { backgroundColor: colors.progressBackground }]}>
          <Animated.View style={[styles.progressBar, { width: progress, backgroundColor: colors.primary }]} />
        </View>
      </View>

      <View style={[styles.instructionsCard, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.instructionsTitle, { color: colors.text }]}>Instructions</Text>
        <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>{challenge.instructions}</Text>
      </View>

      <View style={[styles.pointsCard, { backgroundColor: colors.successLight }]}>
        <Text style={[styles.pointsLabel, { color: colors.success }]}>Points on completion</Text>
        <Text style={[styles.pointsValue, { color: colors.success }]}>+{challenge.points}</Text>
      </View>

      {!timerRunning ? (
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: colors.primary }]} 
          onPress={startTimer}
        >
          <Text style={[styles.startButtonText, { color: colors.textInverse }]}>Start Challenge</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: colors.success }, completing && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={[styles.completeButtonText, { color: colors.textInverse }]}>Complete Challenge</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  timerLabel: {
    fontSize: 14,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  instructionsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  pointsCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsLabel: {
    fontSize: 14,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  startButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  completeButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  completePoints: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  completeMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 48,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
