import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChallengeCategory, categoryConfig, ChallengeDifficulty, difficultyConfig } from '../types';
import { useTheme } from '../contexts/ThemeContext';

export default function CreateChallengeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ChallengeCategory | '',
    difficulty: '' as ChallengeDifficulty | '',
    instructions: '',
    points: '10',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!formData.difficulty) {
      Alert.alert('Error', 'Please select a difficulty');
      return;
    }
    if (!formData.instructions.trim()) {
      Alert.alert('Error', 'Please enter instructions');
      return;
    }

    setLoading(true);
    try {
      Alert.alert('Success', 'Challenge created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  const categories = Object.keys(categoryConfig) as ChallengeCategory[];
  const difficulties = Object.keys(difficultyConfig) as ChallengeDifficulty[];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>Create Challenge</Text>

      <Text style={[styles.label, { color: colors.text }]}>Title</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
        placeholder="Enter challenge title"
        placeholderTextColor={colors.inputPlaceholder}
        value={formData.title}
        onChangeText={(text) => updateField('title', text)}
      />

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
        placeholder="Describe what this challenge is about"
        placeholderTextColor={colors.inputPlaceholder}
        value={formData.description}
        onChangeText={(text) => updateField('description', text)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text style={[styles.label, { color: colors.text }]}>Category</Text>
      <View style={styles.optionsRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.optionButton,
              { borderColor: colors.inputBorder, backgroundColor: colors.cardBackground },
              formData.category === cat && {
                borderColor: categoryConfig[cat].color,
                backgroundColor: categoryConfig[cat].color + '20',
              },
            ]}
            onPress={() => updateField('category', cat)}
          >
            <Text
              style={[
                styles.optionText,
                { color: colors.textSecondary },
                formData.category === cat && { color: categoryConfig[cat].color },
              ]}
            >
              {categoryConfig[cat].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Difficulty</Text>
      <View style={styles.difficultyRow}>
        {difficulties.map((diff) => (
          <TouchableOpacity
            key={diff}
            style={[
              styles.difficultyButton,
              { borderColor: colors.inputBorder, backgroundColor: colors.cardBackground },
              formData.difficulty === diff && {
                borderColor: difficultyConfig[diff].color,
                backgroundColor: difficultyConfig[diff].color + '20',
              },
            ]}
            onPress={() => updateField('difficulty', diff)}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: colors.textSecondary },
                formData.difficulty === diff && {
                  color: difficultyConfig[diff].color,
                },
              ]}
            >
              {difficultyConfig[diff].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Instructions</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
        placeholder="Step-by-step instructions for completing this challenge"
        placeholderTextColor={colors.inputPlaceholder}
        value={formData.instructions}
        onChangeText={(text) => updateField('instructions', text)}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={[styles.label, { color: colors.text }]}>Points</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
        placeholder="10"
        placeholderTextColor={colors.inputPlaceholder}
        value={formData.points}
        onChangeText={(text) => updateField('points', text)}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>Create Challenge</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
