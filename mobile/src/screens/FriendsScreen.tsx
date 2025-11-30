import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from '../contexts/ThemeContext';

export default function FriendsScreen() {
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(false);
  };

  const handleSendRequest = async () => {
    if (!friendEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }
    setSending(true);
    try {
      Alert.alert("Success", "Friend request sent!");
      setFriendEmail("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.addFriendCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.addFriendTitle, { color: colors.text }]}>Add a Friend</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText }]}
            placeholder="Enter email address"
            placeholderTextColor={colors.inputPlaceholder}
            value={friendEmail}
            onChangeText={setFriendEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }, sending && styles.buttonDisabled]}
            onPress={handleSendRequest}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={[styles.sendButtonText, { color: colors.textInverse }]}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Pending Requests ({pendingRequests.length})
          </Text>
          {pendingRequests.map((request: any) => (
            <View key={request.id} style={[styles.friendCard, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.textInverse }]}>
                  {request.firstName?.[0] || "?"}
                </Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={[styles.friendName, { color: colors.text }]}>
                  {request.firstName} {request.lastName}
                </Text>
                <Text style={[styles.friendEmail, { color: colors.textSecondary }]}>{request.email}</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity style={[styles.acceptButton, { backgroundColor: colors.success }]}>
                  <Text style={[styles.acceptText, { color: colors.textInverse }]}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.declineButton, { backgroundColor: colors.error }]}>
                  <Text style={[styles.declineText, { color: colors.textInverse }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Friends ({friends.length})</Text>
        {friends.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No friends yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Send a friend request to get started!
            </Text>
          </View>
        ) : (
          friends.map((friend: any) => (
            <View key={friend.id} style={[styles.friendCard, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.textInverse }]}>
                  {friend.firstName?.[0] || "?"}
                </Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={[styles.friendName, { color: colors.text }]}>
                  {friend.firstName} {friend.lastName}
                </Text>
                <Text style={[styles.friendEmail, { color: colors.textSecondary }]}>{friend.email}</Text>
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
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  addFriendCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addFriendTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "500",
  },
  friendEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  declineText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
