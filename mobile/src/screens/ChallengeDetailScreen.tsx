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
import { apiService } from '../services/api';
import { Challenge, categoryConfig, difficultyConfig, ChallengeCategory } from '../types';

export default function ChallengeDetailScreen({ route, navigation }: any) {
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Challenge not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeIcon}>🎉</Text>
        <Text style={styles.completeTitle}>Challenge Complete!</Text>
        <Text style={styles.completePoints}>+{pointsEarned} points</Text>
        <Text style={styles.completeMessage}>
          Great job! You've completed "{challenge.title}"
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor:
                categoryConfig[challenge.category as ChallengeCategory]?.color ||
                '#3b82f6',
            },
          ]}
        >
          <Text style={styles.categoryText}>
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
                  ?.color || '#3b82f6') + '20',
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

      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.description}>{challenge.description}</Text>

      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.timerLabel}>
            {timerRunning ? 'Time Left' : 'Ready?'}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: progress }]} />
        </View>
      </View>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Instructions</Text>
        <Text style={styles.instructionsText}>{challenge.instructions}</Text>
      </View>

      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Points on completion</Text>
        <Text style={styles.pointsValue}>+{challenge.points}</Text>
      </View>

      {!timerRunning ? (
        <TouchableOpacity style={styles.startButton} onPress={startTimer}>
          <Text style={styles.startButtonText}>Start Challenge</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.completeButton, completing && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.completeButtonText}>Complete Challenge</Text>
          )}
        </TouchableOpacity>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  backButtonText: {
    color: '#fff',
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
    color: '#fff',
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
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
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
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#3b82f6',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timerLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  pointsCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#059669',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  startButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  completeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  completePoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 16,
  },
  completeMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 48,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
