import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";

export default function ProfileScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const data = await apiService.getProgress();
      setProgress(data);
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Logout failed:", error);
          }
        },
      },
    ]);
  };

  const preferredCategories = user?.preferredCategories || [];
  const preferredDays = user?.preferredDays || [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.content}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PERSONAL INFORMATION</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.textInverse }]}>
                {user?.firstName?.[0] || user?.username?.[0] || "?"}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.firstName
                  ? `${user.firstName} ${user.lastName || ""}`
                  : user?.username || "User"}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || ""}</Text>
              {user?.username && (
                <Text style={[styles.userHandle, { color: colors.primary }]}>@{user.username}</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
            <Image
              source={require("../../assets/bullseye.png")}
              style={styles.statIconImage}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {loading ? "-" : progress?.totalChallengesCompleted || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Challenges</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
            <Image
              source={require("../../assets/fire.png")}
              style={styles.statIconImage}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {loading ? "-" : progress?.currentStreak || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
            <Image
              source={require("../../assets/trophy.png")}
              style={styles.statIconImage}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {loading ? "-" : progress?.longestStreak || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Longest Streak</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
            <Image
              source={require("../../assets/star.png")}
              style={styles.statIconImage}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {loading ? "-" : progress?.totalPoints || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Points</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Your Preferences</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.preferenceLabel, { color: colors.text }]}>Preferred Categories</Text>
          <View style={styles.tagsContainer}>
            {preferredCategories.length > 0 ? (
              preferredCategories.map((cat: string, index: number) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{cat}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noPreference, { color: colors.textMuted }]}>No categories selected</Text>
            )}
          </View>

          <Text style={[styles.preferenceLabel, { marginTop: 16, color: colors.text }]}>
            Challenge Days
          </Text>
          <View style={styles.daysContainer}>
            {dayNames.map((day, index) => (
              <View
                key={index}
                style={[
                  styles.dayBadge,
                  { backgroundColor: colors.backgroundSecondary },
                  preferredDays.includes(index) && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: colors.textSecondary },
                    preferredDays.includes(index) && { color: colors.textInverse },
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: colors.errorLight }]} 
        onPress={handleLogout}
      >
        <Image
          source={require("../../assets/logout.png")}
          style={styles.logoutIcon}
          resizeMode="contain"
        />
        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>2Mins Challenge</Text>
        <Text style={[styles.versionText, { color: colors.textMuted }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  userHandle: {
    fontSize: 14,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconImage: {
    width: 32,
    height: 32,
    marginBottom: 8,
    resizeMode: "contain",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  noPreference: {
    fontSize: 14,
    fontStyle: "italic",
  },
  daysContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 12,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  logoutIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
  },
});
