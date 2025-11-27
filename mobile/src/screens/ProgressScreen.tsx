import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import { apiService } from "../services/api";
import {
  UserProgress,
  AchievementWithProgress,
  ChallengeWithDetails,
  categoryConfig,
  ChallengeCategory,
} from "../types";

const { width } = Dimensions.get("window");

const tierColors: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#facc15",
  platinum: "#22d3ee",
};

// assets klasöründeki kategori ikonları
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

type AnalyticsTab = "daily" | "trends" | "categories";

export default function ProgressScreen() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(
    [],
  );
  const [history, setHistory] = useState<ChallengeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>("daily");

  const loadData = async () => {
    try {
      const [progressData, achievementsData, historyData] = await Promise.all([
        apiService.getProgress(),
        apiService.getAchievements(),
        apiService.getHistory(),
      ]);
      setProgress(progressData);
      setAchievements(achievementsData || []);
      setHistory(historyData || []);
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

  // --- Achievements helpers ---
  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);
  const overallAchievementProgress =
    achievements.length > 0
      ? Math.round((unlockedAchievements.length / achievements.length) * 100)
      : 0;

  // --- Analytics: last 30 days aggregates ---
  const last30DaysData = useMemo(() => {
    const days: { date: Date; label: string; count: number; points: number }[] =
      [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      days.push({ date: d, label, count: 0, points: 0 });
    }

    history.forEach((h) => {
      if (!h.completedAt) return;
      const d = new Date(h.completedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const idx = days.findIndex(
        (x) =>
          x.date.getFullYear() === d.getFullYear() &&
          x.date.getMonth() === d.getMonth() &&
          x.date.getDate() === d.getDate(),
      );
      if (idx >= 0) {
        days[idx].count += 1;
        days[idx].points += h.pointsEarned || 0;
      }
    });

    return days;
  }, [history]);

  const maxDailyCount = Math.max(1, ...last30DaysData.map((d) => d.count || 0));
  const maxDailyPoints = Math.max(
    1,
    ...last30DaysData.map((d) => d.points || 0),
  );

  // Analytics – categories distribution (last 30 days)
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    history.forEach((h) => {
      if (!h.completedAt) return;
      const d = new Date(h.completedAt);
      const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (diff > 30) return;
      const key = h.category || "other";
      stats[key] = (stats[key] || 0) + 1;
    });
    return stats;
  }, [history]);

  // Challenge history tap → expanded item
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.screenSubtitle}>
          Track your journey and celebrate your achievements
        </Text>
      </View>

      {/* OVERVIEW TOP CARDS */}
      <View style={styles.topStatsRow}>
        <View style={styles.topStatCard}>
          <Text style={styles.topStatLabel}>Current Streak</Text>
          <Text style={styles.topStatValue}>
            {progress?.currentStreak || 0}{" "}
            <Text style={styles.topStatValueSuffix}>days</Text>
          </Text>
          <Text style={styles.topStatHint}>
            Consecutive days with challenges
          </Text>
        </View>
        <View style={styles.topStatCard}>
          <Text style={styles.topStatLabel}>Total Points</Text>
          <Text style={styles.topStatValue}>{progress?.totalPoints || 0}</Text>
          <Text style={styles.topStatHint}>All-time points earned</Text>
        </View>
        <View style={styles.topStatCard}>
          <Text style={styles.topStatLabel}>Challenges Completed</Text>
          <Text style={styles.topStatValue}>
            {progress?.totalChallengesCompleted || 0}
          </Text>
          <Text style={styles.topStatHint}>Total challenges finished</Text>
        </View>
      </View>

      {/* PERSONAL BEST + ACTIVITY SUMMARY */}
      <View style={styles.middleRow}>
        <View style={styles.largeCard}>
          <Text style={styles.largeCardTitle}>Personal Best</Text>
          <View style={styles.largeCardRow}>
            <View>
              <Text style={styles.largeCardLabel}>Longest Streak</Text>
              <Text style={styles.largeCardValue}>
                {progress?.longestStreak || 0} days
              </Text>
            </View>
          </View>
          <View style={styles.largeCardRow}>
            <View>
              <Text style={styles.largeCardLabel}>
                Avg. Points Per Challenge
              </Text>
              <Text style={styles.largeCardValue}>
                {progress?.averagePointsPerChallenge
                  ? Math.round(progress.averagePointsPerChallenge)
                  : 0}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.largeCard}>
          <Text style={styles.largeCardTitle}>Activity Summary</Text>
          <View style={styles.largeCardRow}>
            <View>
              <Text style={styles.largeCardLabel}>Total Challenges</Text>
              <Text style={styles.largeCardValue}>
                {progress?.totalChallengesCompleted || 0}
              </Text>
            </View>
          </View>
          <View style={styles.largeCardRow}>
            <View>
              <Text style={styles.largeCardLabel}>Last Completed</Text>
              <Text style={styles.largeCardValue}>
                {history[0]?.completedAt
                  ? new Date(history[0].completedAt).toLocaleDateString()
                  : "-"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ACHIEVEMENTS */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionSubText}>
            {unlockedAchievements.length} of {achievements.length} unlocked
          </Text>
        </View>

        {/* Overall progress bar */}
        <View style={styles.overallProgressCard}>
          <View style={styles.overallHeaderRow}>
            <Text style={styles.overallTitle}>Overall Progress</Text>
            <Text style={styles.overallPercent}>
              {overallAchievementProgress}%
            </Text>
          </View>
          <Text style={styles.overallHint}>
            Keep completing challenges to unlock more achievements
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${overallAchievementProgress}%` },
              ]}
            />
          </View>
        </View>

        {/* Unlocked */}
        <Text style={styles.subSectionTitle}>Unlocked</Text>
        {unlockedAchievements.length === 0 ? (
          <Text style={styles.emptyTextSmall}>
            You haven't unlocked any achievements yet.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.achievementsScroll}
          >
            {unlockedAchievements.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.achievementCard,
                  {
                    borderColor: tierColors[a.tier] || "#e2e8f0",
                    backgroundColor: "rgba(148,163,184,0.08)",
                  },
                ]}
              >
                <View style={styles.achievementIconCircle}>
                  <Text style={styles.achievementIconText}>🏅</Text>
                </View>
                <View style={styles.achievementTextBlock}>
                  <Text style={styles.achievementName}>{a.name}</Text>
                  <Text style={styles.achievementDesc}>{a.description}</Text>
                  <Text
                    style={[
                      styles.achievementTierBadge,
                      { color: tierColors[a.tier] || "#64748b" },
                    ]}
                  >
                    {a.tier.charAt(0).toUpperCase() + a.tier.slice(1)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Locked */}
        {lockedAchievements.length > 0 && (
          <>
            <Text style={[styles.subSectionTitle, { marginTop: 20 }]}>
              Locked
            </Text>
            <View style={styles.lockedGrid}>
              {lockedAchievements.map((a) => (
                <View key={a.id} style={styles.lockedAchievementCard}>
                  <View style={styles.lockedHeaderRow}>
                    <View style={styles.lockedIconCircle}>
                      <Text style={styles.lockedIconText}>🔒</Text>
                    </View>
                    <Text style={styles.lockedTierLabel}>
                      {a.tier.charAt(0).toUpperCase() + a.tier.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.lockedAchievementName}>{a.name}</Text>
                  <Text style={styles.lockedAchievementDesc}>
                    {a.description}
                  </Text>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <View style={styles.progressBarContainerMini}>
                    <View
                      style={[
                        styles.progressBarMini,
                        { width: `${a.progressPercent || 0}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressMiniText}>
                    {a.progress}/{a.requirementValue}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* ANALYTICS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analytics</Text>
        <Text style={styles.sectionSubText}>
          Track your progress and insights over time
        </Text>

        {/* Analytics summary cards */}
        <View style={styles.analyticsSummaryRow}>
          <View style={styles.analyticsSummaryCard}>
            <Text style={styles.analyticsSummaryLabel}>Total Challenges</Text>
            <Text style={styles.analyticsSummaryValue}>
              {progress?.totalChallengesCompleted || 0}
            </Text>
            <Text style={styles.analyticsSummaryHint}>
              Completed challenges
            </Text>
          </View>
          <View style={styles.analyticsSummaryCard}>
            <Text style={styles.analyticsSummaryLabel}>Last 30 Days</Text>
            <Text style={styles.analyticsSummaryValue}>
              {
                last30DaysData.reduce((acc, d) => acc + (d.count || 0), 0) // sum
              }
            </Text>
            <Text style={styles.analyticsSummaryHint}>
              Challenges completed
            </Text>
          </View>
          <View style={styles.analyticsSummaryCard}>
            <Text style={styles.analyticsSummaryLabel}>Categories</Text>
            <Text style={styles.analyticsSummaryValue}>
              {Object.keys(categoryStats).length}
            </Text>
            <Text style={styles.analyticsSummaryHint}>Categories explored</Text>
          </View>
        </View>

        {/* Analytics tabs */}
        <View style={styles.tabsRow}>
          {(["daily", "trends", "categories"] as AnalyticsTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                analyticsTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setAnalyticsTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  analyticsTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === "daily"
                  ? "Daily"
                  : tab === "trends"
                    ? "Trends"
                    : "Categories"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab contents */}
        {analyticsTab === "daily" && (
          <>
            <Text style={styles.analyticsChartTitle}>
              Daily Activity (Last 30 Days)
            </Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartBarsRow}>
                {last30DaysData.map((d, idx) => {
                  const h = (d.count / maxDailyCount) * 100 || 2;
                  return (
                    <View key={idx} style={styles.chartBarWrapper}>
                      <View style={[styles.chartBar, { height: `${h}%` }]} />
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartBottomAxis} />
            </View>

            <Text style={[styles.analyticsChartTitle, { marginTop: 16 }]}>
              Points Earned (Last 30 Days)
            </Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartBarsRow}>
                {last30DaysData.map((d, idx) => {
                  const h = (d.points / maxDailyPoints) * 100 || 2;
                  return (
                    <View key={idx} style={styles.chartBarWrapper}>
                      <View
                        style={[
                          styles.chartBar,
                          { height: `${h}%`, backgroundColor: "#38bdf8" },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartBottomAxis} />
            </View>
          </>
        )}

        {analyticsTab === "trends" && (
          <View style={styles.trendsContainer}>
            <Text style={styles.trendTitle}>Streak Comparison</Text>
            <View style={styles.trendBarsRow}>
              <View style={styles.trendBarItem}>
                <Text style={styles.trendLabel}>Current</Text>
                <View style={styles.trendBarBg}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        width: `${
                          ((progress?.currentStreak || 0) /
                            Math.max(
                              progress?.longestStreak || 1,
                              progress?.currentStreak || 1,
                            )) *
                          100
                        }%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendValue}>
                  {progress?.currentStreak || 0} days
                </Text>
              </View>
              <View style={styles.trendBarItem}>
                <Text style={styles.trendLabel}>Longest</Text>
                <View style={styles.trendBarBg}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        width: "100%",
                        backgroundColor: "#22c55e",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendValue}>
                  {progress?.longestStreak || 0} days
                </Text>
              </View>
            </View>
          </View>
        )}

        {analyticsTab === "categories" && (
          <View style={styles.categoriesAnalyticsContainer}>
            {Object.keys(categoryStats).length === 0 ? (
              <Text style={styles.emptyTextSmall}>
                No category data yet. Complete some challenges first.
              </Text>
            ) : (
              Object.entries(categoryStats).map(([cat, count]) => {
                const color =
                  categoryConfig[cat as ChallengeCategory]?.color || "#3b82f6";
                const label =
                  categoryConfig[cat as ChallengeCategory]?.label || cat;
                const maxCat = Math.max(...Object.values(categoryStats), 1);
                return (
                  <View key={cat} style={styles.categoryAnalyticsRow}>
                    <View style={styles.categoryAnalyticsLeft}>
                      <Image
                        source={getCategoryIconSource(cat)}
                        style={styles.categoryAnalyticsIcon}
                      />
                      <View>
                        <Text style={styles.categoryAnalyticsLabel}>
                          {label}
                        </Text>
                        <Text style={styles.categoryAnalyticsCount}>
                          {count} challenges
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryAnalyticsBarBg}>
                      <View
                        style={[
                          styles.categoryAnalyticsBarFill,
                          {
                            width: `${(count / maxCat) * 100}%`,
                            backgroundColor: color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </View>

      {/* CHALLENGE HISTORY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Challenge History</Text>
        <Text style={styles.sectionSubText}>
          Review your completed challenges and achievements
        </Text>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No completed challenges yet</Text>
          </View>
        ) : (
          history.map((item) => {
            const isExpanded = expandedId === item.id;
            const category = categoryConfig[item.category as ChallengeCategory];
            const diffBadgeStyle =
              item.difficulty === "Hard"
                ? styles.difficultyBadgeHard
                : item.difficulty === "Medium"
                  ? styles.difficultyBadgeMedium
                  : styles.difficultyBadgeEasy;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() =>
                  setExpandedId(isExpanded ? null : (item.id as string))
                }
                activeOpacity={0.8}
              >
                <View style={styles.historyLeft}>
                  <Image
                    source={getCategoryIconSource(item.category)}
                    style={styles.historyIcon}
                  />
                  <View style={styles.historyMainInfo}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historyCategory}>
                      {category?.label || item.category}
                    </Text>
                    <View style={styles.historyMetaRow}>
                      <Text style={styles.historyMetaText}>
                        {item.completedAt
                          ? new Date(item.completedAt).toLocaleDateString()
                          : ""}
                      </Text>
                      <Text style={styles.historyMetaDot}>•</Text>
                      <Text style={styles.historyMetaText}>
                        Time: {item.estimatedMinutes || 2}:00
                      </Text>
                      <Text style={styles.historyMetaDot}>•</Text>
                      <Text style={styles.historyMetaText}>
                        {item.pointsEarned} points
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.historyRight}>
                  <View style={[styles.difficultyBadge, diffBadgeStyle]}>
                    <Text style={styles.difficultyBadgeText}>
                      {item.difficulty}
                    </Text>
                  </View>
                </View>

                {isExpanded && item.description && (
                  <View style={styles.historyExpanded}>
                    <Text style={styles.historyExpandedText}>
                      {item.description}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },

  // Top overview cards
  topStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  topStatCard: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  topStatLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  topStatValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  topStatValueSuffix: {
    fontSize: 16,
    fontWeight: "500",
  },
  topStatHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },

  // Middle row cards
  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  largeCard: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  largeCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  largeCardRow: {
    marginBottom: 8,
  },
  largeCardLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  largeCardValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },

  // Section generic
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  sectionSubText: {
    fontSize: 12,
    color: "#6b7280",
  },

  // Overall achievement progress
  overallProgressCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 8,
    marginBottom: 16,
  },
  overallHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  overallTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  overallPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  overallHint: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },

  progressBarContainer: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 999,
  },

  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptyTextSmall: {
    fontSize: 12,
    color: "#9ca3af",
  },

  achievementsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  achievementCard: {
    flexDirection: "row",
    width: width * 0.8,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1.5,
  },
  achievementIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  achievementIconText: {
    fontSize: 22,
  },
  achievementTextBlock: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  achievementTierBadge: {
    fontSize: 11,
    fontWeight: "600",
  },

  lockedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
  },
  lockedAchievementCard: {
    width: (width - 52) / 2,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  lockedHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  lockedIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  lockedIconText: {
    fontSize: 16,
  },
  lockedTierLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },
  lockedAchievementName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  lockedAchievementDesc: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
  },
  progressBarContainerMini: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarMini: {
    height: "100%",
    backgroundColor: "#3b82f6",
  },
  progressMiniText: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },

  // Analytics
  analyticsSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
  },
  analyticsSummaryCard: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  analyticsSummaryLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
  },
  analyticsSummaryValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  analyticsSummaryHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },

  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    padding: 2,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
  },
  tabText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#0f172a",
    fontWeight: "600",
  },

  analyticsChartTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chartBarsRow: {
    height: 120,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  chartBarWrapper: {
    flex: 1,
    marginHorizontal: 1,
    justifyContent: "flex-end",
  },
  chartBar: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: "#3b82f6",
  },
  chartBottomAxis: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 6,
  },

  // Trends tab
  trendsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 10,
  },
  trendBarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trendBarItem: {
    flex: 1,
    marginRight: 10,
  },
  trendLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  trendBarBg: {
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
  },
  trendBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 999,
  },
  trendValue: {
    fontSize: 12,
    color: "#111827",
    marginTop: 4,
  },

  // Categories analytics
  categoriesAnalyticsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryAnalyticsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryAnalyticsLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryAnalyticsIcon: {
    width: 26,
    height: 26,
    marginRight: 8,
  },
  categoryAnalyticsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  categoryAnalyticsCount: {
    fontSize: 11,
    color: "#6b7280",
  },
  categoryAnalyticsBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
    marginLeft: 8,
  },
  categoryAnalyticsBarFill: {
    height: "100%",
    borderRadius: 999,
  },

  // History
  historyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  historyIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  historyMainInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  historyCategory: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  historyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  historyMetaText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  historyMetaDot: {
    fontSize: 10,
    color: "#cbd5e1",
    marginHorizontal: 4,
  },
  historyRight: {
    position: "absolute",
    top: 12,
    right: 14,
  },
  historyExpanded: {
    marginTop: 8,
  },
  historyExpandedText: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },

  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  difficultyBadgeEasy: {
    backgroundColor: "#dcfce7",
  },
  difficultyBadgeMedium: {
    backgroundColor: "#fef3c7",
  },
  difficultyBadgeHard: {
    backgroundColor: "#fee2e2",
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },

  // Empty states
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
  },
});
