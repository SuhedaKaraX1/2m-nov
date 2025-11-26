import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
}

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    tags: '',
  });

  const handleCreateEntry = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    const entry: JournalEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      content: newEntry.content,
      date: new Date().toISOString(),
      tags: newEntry.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    setEntries([entry, ...entries]);
    setNewEntry({ title: '', content: '', tags: '' });
    setShowNewEntry(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.subtitle}>
            Record your thoughts and reflections
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newEntryButton}
          onPress={() => setShowNewEntry(!showNewEntry)}
        >
          <Text style={styles.newEntryButtonIcon}>
            {showNewEntry ? '✕' : '➕'}
          </Text>
          <Text style={styles.newEntryButtonText}>
            {showNewEntry ? 'Cancel' : 'New Entry'}
          </Text>
        </TouchableOpacity>

        {showNewEntry && (
          <View style={styles.newEntryForm}>
            <Text style={styles.formLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Entry title"
              placeholderTextColor="#94a3b8"
              value={newEntry.title}
              onChangeText={(text) =>
                setNewEntry({ ...newEntry, title: text })
              }
            />

            <Text style={styles.formLabel}>Date</Text>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>

            <Text style={styles.formLabel}>Tags (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="wellness, mindfulness, goals"
              placeholderTextColor="#94a3b8"
              value={newEntry.tags}
              onChangeText={(text) => setNewEntry({ ...newEntry, tags: text })}
            />

            <Text style={styles.formLabel}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write your thoughts..."
              placeholderTextColor="#94a3b8"
              value={newEntry.content}
              onChangeText={(text) =>
                setNewEntry({ ...newEntry, content: text })
              }
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleCreateEntry}
            >
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Your Entries</Text>

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📓</Text>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptySubtitle}>
                Start journaling to track your wellness journey
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                </View>
                <Text style={styles.entryContent} numberOfLines={3}>
                  {entry.content}
                </Text>
                {entry.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {entry.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  newEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  newEntryButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  newEntryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  newEntryForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 120,
  },
  dateDisplay: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateText: {
    fontSize: 16,
    color: '#1e293b',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  entriesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  entryDate: {
    fontSize: 12,
    color: '#64748b',
  },
  entryContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
