import React, { useEffect, useState } from 'react';
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

export default function FriendsScreen() {
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(false);
  };

  const handleSendRequest = async () => {
    if (!friendEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    setSending(true);
    try {
      Alert.alert('Success', 'Friend request sent!');
      setFriendEmail('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Friends</Text>

      <View style={styles.addFriendCard}>
        <Text style={styles.addFriendTitle}>Add a Friend</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor="#94a3b8"
            value={friendEmail}
            onChangeText={setFriendEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.buttonDisabled]}
            onPress={handleSendRequest}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending Requests ({pendingRequests.length})
          </Text>
          {pendingRequests.map((request: any) => (
            <View key={request.id} style={styles.friendCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {request.firstName?.[0] || '?'}
                </Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>
                  {request.firstName} {request.lastName}
                </Text>
                <Text style={styles.friendEmail}>{request.email}</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity style={styles.acceptButton}>
                  <Text style={styles.acceptText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineButton}>
                  <Text style={styles.declineText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Your Friends ({friends.length})
        </Text>
        {friends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyText}>
              Send a friend request to get started!
            </Text>
          </View>
        ) : (
          friends.map((friend: any) => (
            <View key={friend.id} style={styles.friendCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {friend.firstName?.[0] || '?'}
                </Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>
                  {friend.firstName} {friend.lastName}
                </Text>
                <Text style={styles.friendEmail}>{friend.email}</Text>
              </View>
            </View>
          ))
        )}
      </View>
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
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
  },
  addFriendCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addFriendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  friendEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
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
  },
});
