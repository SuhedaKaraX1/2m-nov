import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { apiService } from "../services/api";
import {
  Challenge,
  ChallengeCategory,
  categoryConfig,
  difficultyConfig,
} from "../types";

export default function ChallengesScreen({ route, navigation }: any) {
  const { colors, isDark } = useTheme();
  const initialCategory = route.params?.category;
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    ChallengeCategory | "all"
  >(initialCategory || "all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChallenges = async () => {
    try {
      const data = await apiService.getChallenges(
        selectedCategory !== "all" ? selectedCategory : undefined,
      );
      setChallenges(data || []);
    } catch (error) {
      console.error("Failed to load challenges:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChallenges();
  };

  const handleChallengePress = (id: string) => {
    navigation.navigate("ChallengeDetail", { id });
  };

  const categories = ["all", ...Object.keys(categoryConfig)] as const;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              { backgroundColor: colors.backgroundSecondary },
              selectedCategory === cat && { backgroundColor: colors.primary },
            ]}
            onPress={() =>
              setSelectedCategory(cat as ChallengeCategory | "all")
            }
          >
            <Text
              style={[
                styles.filterChipText,
                { color: colors.textSecondary },
                selectedCategory === cat && { color: colors.textInverse },
              ]}
            >
              {cat === "all"
                ? "All"
                : categoryConfig[cat as ChallengeCategory]?.label || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No challenges found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try selecting a different category
            </Text>
          </View>
        ) : (
          challenges.map((challenge) => (
            <TouchableOpacity
              key={challenge.id}
              style={[styles.challengeCard, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}
              onPress={() => handleChallengePress(challenge.id)}
            >
              <View style={styles.challengeHeader}>
                <View
                  style={[
                    styles.categoryDot,
                    {
                      backgroundColor:
                        categoryConfig[challenge.category as ChallengeCategory]
                          ?.color || colors.primary,
                    },
                  ]}
                />
                <Text style={[styles.challengeCategory, { color: colors.textSecondary }]}>
                  {categoryConfig[challenge.category as ChallengeCategory]
                    ?.label || challenge.category}
                </Text>
                <View
                  style={[
                    styles.difficultyBadge,
                    {
                      backgroundColor:
                        difficultyConfig[
                          challenge.difficulty as keyof typeof difficultyConfig
                        ]?.color + "20" || colors.primary + "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      {
                        color:
                          difficultyConfig[
                            challenge.difficulty as keyof typeof difficultyConfig
                          ]?.color || colors.primary,
                      },
                    ]}
                  >
                    {challenge.difficulty}
                  </Text>
                </View>
              </View>
              <Text style={[styles.challengeTitle, { color: colors.text }]}>{challenge.title}</Text>
              <Text style={[styles.challengeDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {challenge.description}
              </Text>
              <View style={styles.challengeFooter}>
                <Text style={[styles.pointsText, { color: colors.success }]}>+{challenge.points} pts</Text>
                <Text style={[styles.startText, { color: colors.primary }]}>Start →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    borderBottomWidth: 1,
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 40,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  challengeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  challengeCategory: {
    fontSize: 12,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsText: {
    fontSize: 14,
    fontWeight: "600",
  },
  startText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
