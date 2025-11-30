import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { apiService } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import {
  Challenge,
  UserProgress,
  categoryConfig,
  ChallengeCategory,
} from "../types";
import Logo from "../../assets/logo.jpg";

export default function HomeScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [featuredChallenge, setFeaturedChallenge] = useState<Challenge | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [progressData, challengeData] = await Promise.all([
        apiService.getProgress(),
        apiService.getRandomChallenge(),
      ]);
      setProgress(progressData);
      setFeaturedChallenge(challengeData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStartChallenge = () => {
    if (featuredChallenge) {
      navigation.navigate("ChallengeDetail", { id: featuredChallenge.id });
    }
  };

  const handleCategoryPress = (category: ChallengeCategory) => {
    navigation.navigate("AllChallenges", { category });
  };

  // Explore Categories alt yazıları – web ile birebir
  const categorySubtitles: { [key: string]: string } = {
    physical: "Move your body and boost energy",
    mental: "Clear your mind and find focus",
    learning: "Discover something new",
    finance: "Build better money habits",
    relationships: "Strengthen your connections",
    extreme: "Test your limits",
  };

  // assets klasöründeki ikonlar (HomeScreen.tsx => src/screens, assets => proje kökü)
  const getCategoryIconSource = (category: string) => {
    switch (category) {
      case "physical":
        return require("../../assets/physical.png");
      case "mental":
        return require("../../assets/mental.jpg");
      case "learning":
        return require("../../assets/learning.jpg");
      case "finance":
        return require("../../assets/finance.png");
      case "relationships":
        return require("../../assets/relationships.jpg");
      case "extreme":
        return require("../../assets/extreme.png");
      default:
        return require("../../assets/physical.png");
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "physical":
        return "#bfdbfe";
      case "mental":
        return "#f3e8ff";
      case "learning":
        return "#fef3c7";
      case "finance":
        return "#dcfce7";
      case "relationships":
        return "#fce7f3";
      case "extreme":
        return "#ffbf8b";
      default:
        return "#f0f4f8";
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoIcon} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>2Mins</Text>
      </View>

      {/* STATS ROW - Modern Tasarım */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Image
              source={require("../../assets/fire.png")}
              style={styles.statIconImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.text }]}>{progress?.currentStreak || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Image
              source={require("../../assets/trophy.png")}
              style={styles.statIconImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.text }]}>{progress?.totalPoints || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points</Text>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={[styles.statIconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Image
              source={require("../../assets/bullseye.png")}
              style={styles.statIconImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {progress?.totalChallengesCompleted || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
        </View>
      </View>

      <View style={styles.featuredHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Challenge</Text>
        <TouchableOpacity>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>

      {featuredChallenge && (
        <View style={[styles.featuredCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={styles.featuredTitleRow}>
            <View style={styles.featuredIconContainer}>
              <Image
                source={getCategoryIconSource(featuredChallenge.category)}
                style={styles.featuredIconImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.featuredTitleSection}>
              <Text style={[styles.featuredTitle, { color: colors.text }]}>
                {featuredChallenge.title}
              </Text>
              <Text style={[styles.featuredCategory, { color: colors.textSecondary }]}>
                {categoryConfig[featuredChallenge.category as ChallengeCategory]
                  ?.label || featuredChallenge.category}
              </Text>
            </View>
            <View
              style={[
                styles.difficultyBadge,
                styles[`difficulty${featuredChallenge.difficulty}`],
              ]}
            >
              <Text style={styles.difficultyText}>
                {featuredChallenge.difficulty}
              </Text>
            </View>
          </View>
          <Text style={[styles.featuredDescription, { color: colors.textSecondary }]}>
            {featuredChallenge.description}
          </Text>
          <View style={styles.featuredMeta}>
            <Text style={[styles.featuredMetaItem, { color: colors.textMuted }]}>
              {featuredChallenge.points} points
            </Text>
            <Text style={[styles.featuredMetaSeparator, { color: colors.textMuted }]}>•</Text>
            <Text style={[styles.featuredMetaItem, { color: colors.textMuted }]}>2 minutes</Text>
          </View>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleStartChallenge}
          >
            <Text style={styles.startButtonText}>Start Challenge</Text>
            <Text style={styles.startButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* EXPLORE CATEGORIES – assets ikonları */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore Categories</Text>
      <View style={styles.categoriesGrid}>
        {Object.entries(categoryConfig).map(([key, config]) => {
          const subtitle = categorySubtitles[key] || "";
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryCard,
                { 
                  backgroundColor: isDark ? colors.surfaceSecondary : getCategoryColor(key),
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={() => handleCategoryPress(key as ChallengeCategory)}
            >
              <View style={[styles.categoryIconWrapper, { backgroundColor: isDark ? colors.background : 'transparent' }]}>
                <Image
                  source={getCategoryIconSource(key)}
                  style={styles.categoryIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.categoryName, { color: colors.text }]}>{config.label}</Text>
              {!!subtitle && (
                <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>{subtitle}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden", // ✔ en kritik kısım
    marginRight: 12,
  },
  logoIcon: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
  },

  /* STATS */
  /* STATS */
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e7ff",
    shadowColor: "#667eea",
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#c7d2fe",
  },
  statIconImage: {
    width: 28,
    height: 28,
  },
  statContent: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#5B4DC3",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    textAlign: "center",
  },

  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    color: "#3c7c82",
    fontWeight: "600",
  },
  featuredCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  featuredTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  featuredIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  featuredIconImage: {
    width: 26,
    height: 26,
  },
  featuredTitleSection: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  featuredCategory: {
    fontSize: 12,
    color: "#64748b",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyEasy: {
    backgroundColor: "#d1fae5",
  },
  difficultyMedium: {
    backgroundColor: "#fef3c7",
  },
  difficultyHard: {
    backgroundColor: "#fee2e2",
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1e293b",
    textTransform: "capitalize",
  },
  featuredDescription: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 12,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  featuredMetaItem: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  featuredMetaSeparator: {
    color: "#cbd5e1",
  },
  startButton: {
    backgroundColor: "#3c7c82",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  startButtonArrow: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  /* EXPLORE CATEGORIES */
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  categoryCard: {
    width: "48%",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 14,
  },
  categoryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  categoryIconImage: {
    width: 30,
    height: 30,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
    textAlign: "center",
  },
  categoryDescription: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
});
