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

export default function CreateChallengeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Create Challenge</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter challenge title"
        placeholderTextColor="#94a3b8"
        value={formData.title}
        onChangeText={(text) => updateField('title', text)}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what this challenge is about"
        placeholderTextColor="#94a3b8"
        value={formData.description}
        onChangeText={(text) => updateField('description', text)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.optionsRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.optionButton,
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
                formData.category === cat && { color: categoryConfig[cat].color },
              ]}
            >
              {categoryConfig[cat].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.difficultyRow}>
        {difficulties.map((diff) => (
          <TouchableOpacity
            key={diff}
            style={[
              styles.difficultyButton,
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

      <Text style={styles.label}>Instructions</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Step-by-step instructions for completing this challenge"
        placeholderTextColor="#94a3b8"
        value={formData.instructions}
        onChangeText={(text) => updateField('instructions', text)}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Points</Text>
      <TextInput
        style={styles.input}
        placeholder="10"
        placeholderTextColor="#94a3b8"
        value={formData.points}
        onChangeText={(text) => updateField('points', text)}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Challenge</Text>
        )}
      </TouchableOpacity>
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
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
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
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
