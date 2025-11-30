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
import Svg, { Polyline, Circle } from "react-native-svg";

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

/** Helpers for pie chart */
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const d = [
    `M ${x} ${y}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
  return d;
};

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
    const days: {
      date: Date;
      label: string; // x-ekseni için kısa gün label'ı (2, 4, 6...)
      fullLabel: string; // istersen tooltip vs için tam tarih
      count: number;
      points: number;
    }[] = [];

    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const label = d.getDate().toString(); // SADECE GÜN
      const fullLabel = d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      });

      days.push({ date: d, label, fullLabel, count: 0, points: 0 });
    }

    history.forEach((h) => {
      if (!h.completedAt) return;
      const d = new Date(h.completedAt);
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

  

  // Y-ticks for Daily Activity (0,2,4,...)
  // --- Daily charts Y axis ticks ---

  // Daily grafikleri için sabit eksen değerleri (web ile aynı)
  const DAILY_MAX_Y = 8;
  const POINTS_MAX_Y = 60;

  const dailyYAxisTicks = [0, 2, 4, 6, 8];

  const pointsYAxisTicks = [0, 10, 20, 30, 40, 50, 60];


  // --- Weekly trend: last 12 weeks ---
  const weeklyTrendData = useMemo(() => {
    const weeks: {
      start: Date;
      end: Date;
      label: string;
      challenges: number;
      points: number;
    }[] = [];
    const today = new Date();
    // Hafta başlangıcı: pazartesi kabul edelim
    const todayDay = (today.getDay() + 6) % 7; // 0: Pazartesi
    const currentWeekStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - todayDay,
    );

    for (let i = 11; i >= 0; i--) {
      const start = new Date(currentWeekStart);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const label = `${start.getDate()}/${start.getMonth() + 1}`;
      weeks.push({ start, end, label, challenges: 0, points: 0 });
    }

    history.forEach((h) => {
      if (!h.completedAt) return;
      const d = new Date(h.completedAt);
      weeks.forEach((w) => {
        if (d >= w.start && d <= w.end) {
          w.challenges += 1;
          w.points += h.pointsEarned || 0;
        }
      });
    });

    return weeks;
  }, [history]);

  const maxWeeklyChallenges = Math.max(
    1,
    ...weeklyTrendData.map((w) => w.challenges || 0),
  );
  const maxWeeklyPoints = Math.max(
    1,
    ...weeklyTrendData.map((w) => w.points || 0),
  );

  // --- Monthly trend: last 12 months ---
  const monthlyTrendData = useMemo(() => {
    const months: {
      year: number;
      month: number;
      label: string;
      challenges: number;
      points: number;
    }[] = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const label = date.toLocaleString(undefined, { month: "short" });
      months.push({ year, month, label, challenges: 0, points: 0 });
    }

    history.forEach((h) => {
      if (!h.completedAt) return;
      const d = new Date(h.completedAt);
      months.forEach((m) => {
        if (d.getFullYear() === m.year && d.getMonth() === m.month) {
          m.challenges += 1;
          m.points += h.pointsEarned || 0;
        }
      });
    });

    return months;
  }, [history]);

  const maxMonthlyChallenges = Math.max(
    1,
    ...monthlyTrendData.map((m) => m.challenges || 0),
  );
  const maxMonthlyPoints = Math.max(
    1,
    ...monthlyTrendData.map((m) => m.points || 0),
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

  const categoryEntries = Object.entries(categoryStats);
  const categoryTotal = categoryEntries.reduce(
    (acc, [, count]) => acc + count,
    0,
  );

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
        <Text style={styles.screenTitle}>Progress</Text>
        <Text style={styles.screenSubtitle}>
          Track your journey and celebrate your achievements
        </Text>
      </View>

      {/* OVERVIEW TOP CARDS */}
      <View style={styles.topStatsRow}>
        {/* Current Streak */}
        <View style={styles.topStatCard}>
          <View style={styles.topStatIconRow}>
            <View
              style={[
                styles.topStatIconContainer,
                { backgroundColor: "#fee2e2" },
              ]}
            >
              <Image
                source={require("../../assets/alarm.png")}
                style={styles.topStatIcon}
              />
            </View>
          </View>
          <Text style={styles.topStatLabel}>Current Streak</Text>
          <Text style={styles.topStatValue}>
            {progress?.currentStreak || 0}{" "}
            <Text style={styles.topStatValueSuffix}>days</Text>
          </Text>
          <Text style={styles.topStatHint}>
            Consecutive days with challenges
          </Text>
        </View>

        {/* Total Points */}
        <View style={styles.topStatCard}>
          <View style={styles.topStatIconRow}>
            <View
              style={[
                styles.topStatIconContainer,
                { backgroundColor: "#fef3c7" },
              ]}
            >
              <Image
                source={require("../../assets/progress.png")}
                style={styles.topStatIcon}
              />
            </View>
          </View>
          <Text style={styles.topStatLabel}>Total Points</Text>
          <Text style={styles.topStatValue}>{progress?.totalPoints || 0}</Text>
          <Text style={styles.topStatHint}>All-time points earned</Text>
        </View>

        {/* Challenges Completed */}
        <View style={styles.topStatCardLast}>
          <View style={styles.topStatIconRow}>
            <View
              style={[
                styles.topStatIconContainer,
                { backgroundColor: "#dbeafe" },
              ]}
            >
              <Image
                source={require("../../assets/nocolorbullseye.png")}
                style={styles.topStatIcon}
              />
            </View>
          </View>
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
            <View style={styles.largeCardIconRow}>
              <View
                style={[
                  styles.largeCardIconContainer,
                  { backgroundColor: "#dcfce7" },
                ]}
              >
                <Image
                  source={require("../../assets/progress.png")}
                  style={styles.largeCardIcon}
                />
              </View>
              <View>
                <Text style={styles.largeCardLabel}>Longest Streak</Text>
                <Text style={styles.largeCardValue}>
                  {progress?.longestStreak || 0} days
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.largeCardRow}>
            <Text style={styles.largeCardLabel}>Avg. Points Per Challenge</Text>
            <Text style={styles.largeCardValue}>
              {progress?.averagePointsPerChallenge
                ? Math.round(progress.averagePointsPerChallenge)
                : 0}
            </Text>
          </View>
        </View>

        <View style={styles.largeCardLast}>
          <Text style={styles.largeCardTitle}>Activity Summary</Text>
          <View style={styles.largeCardRow}>
            <View style={styles.largeCardIconRow}>
              <View
                style={[
                  styles.largeCardIconContainer,
                  { backgroundColor: "#e0f2fe" },
                ]}
              >
                <Image
                  source={require("../../assets/home.png")}
                  style={styles.largeCardIcon}
                />
              </View>
              <View>
                <Text style={styles.largeCardLabel}>Total Challenges</Text>
                <Text style={styles.largeCardValue}>
                  {progress?.totalChallengesCompleted || 0}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.largeCardRow}>
            <Text style={styles.largeCardLabel}>Last Completed</Text>
            <Text style={styles.largeCardValue}>
              {history[0]?.completedAt
                ? new Date(history[0].completedAt).toLocaleDateString()
                : "-"}
            </Text>
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
            <View style={styles.analyticsSummaryHeaderRow}>
              <View
                style={[
                  styles.analyticsSummaryIconContainer,
                  { backgroundColor: "#e0f2fe" },
                ]}
              >
                <Image
                  source={require("../../assets/progress.png")}
                  style={styles.analyticsSummaryIcon}
                />
              </View>
            </View>
            <Text style={styles.analyticsSummaryLabel}>Total Challenges</Text>
            <Text style={styles.analyticsSummaryValue}>
              {progress?.totalChallengesCompleted || 0}
            </Text>
            <Text style={styles.analyticsSummaryHint}>
              Completed challenges
            </Text>
          </View>

          <View style={styles.analyticsSummaryCard}>
            <View style={styles.analyticsSummaryHeaderRow}>
              <View
                style={[
                  styles.analyticsSummaryIconContainer,
                  { backgroundColor: "#fef3c7" },
                ]}
              >
                <Image
                  source={require("../../assets/journal.png")}
                  style={styles.analyticsSummaryIcon}
                />
              </View>
            </View>
            <Text style={styles.analyticsSummaryLabel}>Last 30 Days</Text>
            <Text style={styles.analyticsSummaryValue}>
              {last30DaysData.reduce((acc, d) => acc + (d.count || 0), 0)}
            </Text>
            <Text style={styles.analyticsSummaryHint}>
              Challenges completed
            </Text>
          </View>

          <View style={styles.analyticsSummaryCardLast}>
            <View style={styles.analyticsSummaryHeaderRow}>
              <View
                style={[
                  styles.analyticsSummaryIconContainer,
                  { backgroundColor: "#fee2e2" },
                ]}
              >
                <Image
                  source={require("../../assets/settings.png")}
                  style={styles.analyticsSummaryIcon}
                />
              </View>
            </View>
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
            {/* DAILY ACTIVITY */}
            <Text style={styles.analyticsChartTitle}>
              Daily Activity (Last 30 Days)
            </Text>
            <Text style={styles.analyticsChartSubtitle}>
              Number of challenges completed each day
            </Text>

            <View style={styles.chartContainer}>
              <View style={styles.chartRow}>
                {/* Y Axis */}
                <View style={styles.chartYAxis}>
                  {dailyYAxisTicks
                    .slice()
                    .reverse()
                    .map((v) => (
                      <Text key={v} style={styles.chartYAxisLabel}>
                        {v}
                      </Text>
                    ))}
                </View>

                {/* Bars + X Axis */}
                <View style={styles.chartMainArea}>
                  {/* barlar */}
                  <View style={styles.chartBarsRow}>
                    {last30DaysData.map((d, idx) => {
                      //const h = (d.count / maxDailyCount) * 100 || 2;
                      return (
                        <View key={idx} style={styles.chartBarGroup}>
                          <View
                            style={[
                              styles.chartBar,
                              //{ height: `${h}%`, backgroundColor: "#3b82f6" },
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>

                  {/* alt çizgi */}
                  <View style={styles.chartBottomAxis} />

                  {/* tarih etiketleri */}
                  <View style={styles.chartXAxis}>
                    {last30DaysData.map((d, idx) => (
                      <Text key={idx} style={styles.chartXAxisLabel}>
                        {idx % 4 === 0 ? d.label : ""}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* POINTS EARNED */}
            <Text style={[styles.analyticsChartTitle, { marginTop: 16 }]}>
              Points Earned (Last 30 Days)
            </Text>
            <Text style={styles.analyticsChartSubtitle}>
              Points accumulated each day
            </Text>

            <View style={styles.chartContainer}>
              <View style={styles.chartRow}>
                {/* Y Axis */}
                <View style={styles.chartYAxis}>
                  {pointsYAxisTicks
                    .slice()
                    .reverse()
                    .map((v) => (
                      <Text key={v} style={styles.chartYAxisLabel}>
                        {v}
                      </Text>
                    ))}
                </View>

                {/* Line chart + X Axis */}
                <View style={styles.chartMainArea}>
                  {/* line + noktalar */}
                  <View style={styles.chartLineWrapper}>
                    <Svg width="100%" height={120} viewBox="0 0 300 120">
                      {(() => {
                        const chartHeight = 100;
                        const chartWidth =
                          last30DaysData.length > 1
                            ? last30DaysData.length - 1
                            : 1;
            
                        const points = last30DaysData.map((d, i) => {
                          const x = (i / chartWidth) * 300;
                          const pointsClamped = Math.min(d.points, POINTS_MAX_Y);
                          const y =
                            chartHeight -
                              (pointsClamped / POINTS_MAX_Y) * chartHeight ||
                            chartHeight;
                          return { x, y: y + 10 };
                        });

                        const polylinePoints = points
                          .map((p) => `${p.x},${p.y}`)
                          .join(" ");

                        return (
                          <>
                            <Polyline
                              points={polylinePoints}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth={2}
                            />
                            {points.map((p, idx) => (
                              <Circle
                                key={idx}
                                cx={p.x}
                                cy={p.y}
                                r={3}
                                fill="#3b82f6"
                              />
                            ))}
                          </>
                        );
                      })()}
                    </Svg>
                  </View>

                  {/* alt çizgi */}
                  <View style={styles.chartBottomAxis} />

                  {/* tarih etiketleri */}
                  <View style={styles.chartXAxis}>
                    {last30DaysData.map((d, idx) => {
                      const countClamped = Math.min(d.count, DAILY_MAX_Y);
                      const h = (countClamped / DAILY_MAX_Y) * 100 || 2;
                      return (
                        <View key={idx} style={styles.chartBarGroup}>
                          <View
                            style={[
                              styles.chartBar,
                              { height: `${h}%`, backgroundColor: "#3b82f6" },
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {analyticsTab === "trends" && (
          <>
            {/* Weekly Trend */}
            <Text style={styles.analyticsChartTitle}>Weekly Trend</Text>
            <Text style={styles.analyticsChartSubtitle}>
              Challenge completion over the last 12 weeks
            </Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartRow}>
                <View style={styles.chartYAxis}>
                  {/* sadece basit 0 ve max için */}
                  <Text style={styles.chartYAxisLabel}>
                    {Math.max(maxWeeklyChallenges, maxWeeklyPoints)}
                  </Text>
                  <Text style={styles.chartYAxisLabel}>0</Text>
                </View>
                <View style={styles.chartMainArea}>
                  <View style={styles.chartBarsRow}>
                    {weeklyTrendData.map((w, idx) => {
                      const hChallenges =
                        (w.challenges / maxWeeklyChallenges) * 100 || 2;
                      const hPoints = (w.points / maxWeeklyPoints) * 100 || 2;
                      return (
                        <View key={idx} style={styles.chartBarGroup}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: `${hChallenges}%`,
                                backgroundColor: "#3b82f6",
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: `${hPoints}%`,
                                backgroundColor: "#ec4899",
                                marginTop: 2,
                              },
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.chartBottomAxis} />
                  <View style={styles.chartXAxis}>
                    {weeklyTrendData.map((w, idx) => (
                      <Text key={idx} style={styles.chartXAxisLabel}>
                        {idx % 3 === 0 ? w.label : ""}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
              {/* Legend */}
              <View style={styles.chartLegendRow}>
                <View style={styles.chartLegendItem}>
                  <View
                    style={[
                      styles.chartLegendDot,
                      { backgroundColor: "#3b82f6" },
                    ]}
                  />
                  <Text style={styles.chartLegendText}>Challenges</Text>
                </View>
                <View style={styles.chartLegendItem}>
                  <View
                    style={[
                      styles.chartLegendDot,
                      { backgroundColor: "#ec4899" },
                    ]}
                  />
                  <Text style={styles.chartLegendText}>Points</Text>
                </View>
              </View>
            </View>

            {/* Monthly Trend */}
            <Text style={[styles.analyticsChartTitle, { marginTop: 16 }]}>
              Monthly Trend
            </Text>
            <Text style={styles.analyticsChartSubtitle}>
              Challenge completion over the last 12 months
            </Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartRow}>
                <View style={styles.chartYAxis}>
                  <Text style={styles.chartYAxisLabel}>
                    {Math.max(maxMonthlyChallenges, maxMonthlyPoints)}
                  </Text>
                  <Text style={styles.chartYAxisLabel}>0</Text>
                </View>
                <View style={styles.chartMainArea}>
                  <View style={styles.chartBarsRow}>
                    {monthlyTrendData.map((m, idx) => {
                      const hChallenges =
                        (m.challenges / maxMonthlyChallenges) * 100 || 2;
                      const hPoints = (m.points / maxMonthlyPoints) * 100 || 2;
                      return (
                        <View key={idx} style={styles.chartBarGroup}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: `${hChallenges}%`,
                                backgroundColor: "#3b82f6",
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: `${hPoints}%`,
                                backgroundColor: "#ec4899",
                                marginTop: 2,
                              },
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.chartBottomAxis} />
                  <View style={styles.chartXAxis}>
                    {monthlyTrendData.map((m, idx) => (
                      <Text key={idx} style={styles.chartXAxisLabel}>
                        {m.label}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.chartLegendRow}>
                <View style={styles.chartLegendItem}>
                  <View
                    style={[
                      styles.chartLegendDot,
                      { backgroundColor: "#3b82f6" },
                    ]}
                  />
                  <Text style={styles.chartLegendText}>Challenges</Text>
                </View>
                <View style={styles.chartLegendItem}>
                  <View
                    style={[
                      styles.chartLegendDot,
                      { backgroundColor: "#ec4899" },
                    ]}
                  />
                  <Text style={styles.chartLegendText}>Points</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {analyticsTab === "categories" && (
          <View style={styles.categoriesAnalyticsContainer}>
            {categoryEntries.length === 0 ? (
              <Text style={styles.emptyTextSmall}>
                No category data yet. Complete some challenges first.
              </Text>
            ) : (
              <>
                <Text style={styles.analyticsChartTitle}>
                  Category Distribution
                </Text>
                <View style={styles.pieRow}>
                  <Svg width={160} height={160} viewBox="0 0 160 160">
                    {(() => {
                      let startAngle = 0;
                      return categoryEntries.map(([cat, count]) => {
                        const value = (count / categoryTotal) * 360;
                        const endAngle = startAngle + value;
                        const color =
                          categoryConfig[cat as ChallengeCategory]?.color ||
                          "#3b82f6";
                        const d = describeArc(80, 80, 70, startAngle, endAngle);
                        startAngle = endAngle;
                        return <Path key={cat} d={d} fill={color} />;
                      });
                    })()}
                  </Svg>
                  <View style={styles.pieLegend}>
                    <Text style={styles.pieLegendTitle}>
                      Category Breakdown
                    </Text>
                    {categoryEntries.map(([cat, count]) => {
                      const config = categoryConfig[cat as ChallengeCategory];
                      const color = config?.color || "#3b82f6";
                      const label = config?.label || cat;
                      const percent = Math.round((count / categoryTotal) * 100);
                      return (
                        <View key={cat} style={styles.pieLegendItem}>
                          <View
                            style={[
                              styles.pieLegendDot,
                              { backgroundColor: color },
                            ]}
                          />
                          <View>
                            <Text style={styles.pieLegendLabel}>{label}</Text>
                            <Text style={styles.pieLegendText}>
                              {count} • {percent}%
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
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
  topStatCardLast: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  topStatIconRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  topStatIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  topStatIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
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
  largeCardLast: {
    flex: 1,
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
  largeCardIconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  largeCardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  largeCardIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
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
  analyticsSummaryCardLast: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  analyticsSummaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 6,
  },
  analyticsSummaryIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  analyticsSummaryIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
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
    marginBottom: 2,
  },
  analyticsChartSubtitle: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 6,
  },

  chartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 4,
  },
  chartRow: {
    flexDirection: "row",
  },
  chartYAxis: {
    width: 26,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 4,
  },
  chartYAxisLabel: {
    fontSize: 10,
    color: "#9ca3af",
  },
  chartMainArea: {
    flex: 1,
  },
  chartBarsRow: {
    height: 120,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  chartBarGroup: {
    flex: 1,
    marginHorizontal: 1,
    justifyContent: "flex-end",
  },
  chartBar: {
    width: "100%",
    borderRadius: 999,
  },
  chartBottomAxis: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 6,
  },
  chartXAxis: {
    flexDirection: "row",
    marginTop: 4,
  },
  chartXAxisLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    color: "#9ca3af",
  },
  chartLegendRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 8,
  },
  chartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  chartLegendText: {
    fontSize: 11,
    color: "#6b7280",
  },

  // Categories analytics (pie)
  categoriesAnalyticsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pieRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  pieLegend: {
    flex: 1,
    marginLeft: 12,
  },
  pieLegendTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 6,
  },
  pieLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  pieLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  pieLegendLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  pieLegendText: {
    fontSize: 11,
    color: "#6b7280",
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
