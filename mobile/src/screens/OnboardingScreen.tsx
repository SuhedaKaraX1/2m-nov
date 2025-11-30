import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ChallengeCategory } from '../types';

const categories: { value: ChallengeCategory; label: string; icon: string }[] = [
  { value: 'physical', label: 'Physical', icon: '🏃' },
  { value: 'mental', label: 'Mental', icon: '🧠' },
  { value: 'learning', label: 'Learning', icon: '📚' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'relationships', label: 'Relationships', icon: '❤️' },
];

const daysOfWeek = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { updateOnboarding } = useAuth();
  const { colors, isDark } = useTheme();

  const [preferences, setPreferences] = useState<{
    preferredCategories: ChallengeCategory[];
    hasMentalHealthConcerns: string;
    mentalHealthDetails: string;
    preferredDays: number[];
  }>({
    preferredCategories: [],
    hasMentalHealthConcerns: 'no',
    mentalHealthDetails: '',
    preferredDays: [],
  });

  const toggleCategory = (category: ChallengeCategory) => {
    setPreferences(prev => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(category)
        ? prev.preferredCategories.filter(c => c !== category)
        : [...prev.preferredCategories, category],
    }));
  };

  const toggleDay = (day: number) => {
    setPreferences(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day],
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateOnboarding(preferences);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>⚡</Text>
          <Text style={[styles.title, { color: colors.text }]}>Personalize Your Journey</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Step {step} of 3</Text>
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.progressBackground }]}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%`, backgroundColor: colors.primary }]} />
        </View>

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>What areas interest you?</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Select the categories you'd like to focus on
            </Text>
            <View style={styles.grid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    preferences.preferredCategories.includes(cat.value) && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryLight,
                    },
                  ]}
                  onPress={() => toggleCategory(cat.value)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: colors.textSecondary },
                      preferences.preferredCategories.includes(cat.value) && {
                        color: colors.primary,
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>When would you like to be reminded?</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Select your preferred days for challenges
            </Text>
            <View style={styles.daysRow}>
              {daysOfWeek.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayButton,
                    { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    preferences.preferredDays.includes(day.value) && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => toggleDay(day.value)}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: colors.textSecondary },
                      preferences.preferredDays.includes(day.value) && {
                        color: colors.textInverse,
                      },
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>You're all set!</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Get ready to start your 2-minute challenge journey
            </Text>
            <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Your Preferences</Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                Categories:{' '}
                {preferences.preferredCategories.length > 0
                  ? preferences.preferredCategories.join(', ')
                  : 'All'}
              </Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                Days:{' '}
                {preferences.preferredDays.length > 0
                  ? preferences.preferredDays
                      .map(d => daysOfWeek.find(day => day.value === d)?.label)
                      .join(', ')
                  : 'Every day'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
        {step > 1 && (
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.backgroundSecondary }]} onPress={handleBack}>
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={[styles.nextButtonText, { color: colors.textInverse }]}>
              {step === 3 ? 'Get Started' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  logo: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
