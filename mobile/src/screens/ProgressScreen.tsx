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
  useWindowDimensions,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { apiService } from "../services/api";
import {
  UserProgress,
  AchievementWithProgress,
  ChallengeWithDetails,
  categoryConfig,
  ChallengeCategory,
} from "../types";
import Svg, { Polyline, Circle, Path } from "react-native-svg";

const { width: INITIAL_WIDTH } = Dimensions.get("window");

const tierColors: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#facc15",
  platinum: "#22d3ee",
};

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
  const { colors, isDark } = useTheme();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(
    [],
  );
  const [history, setHistory] = useState<ChallengeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>("daily");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380;
  const isMediumScreen = screenWidth < 768;

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

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);
  const overallAchievementProgress =
    achievements.length > 0
      ? Math.round((unlockedAchievements.length / achievements.length) * 100)
      : 0;

  const last30DaysData = useMemo(() => {
    const days: {
      date: Date;
      label: string;
      count: number;
      points: number;
    }[] = [];

    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const label = d.getDate().toString();
      days.push({ date: d, label, count: 0, points: 0 });
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

  const maxDailyCount = Math.max(0, ...last30DaysData.map((d) => d.count || 0));
  const maxDailyPoints = Math.max(
    0,
    ...last30DaysData.map((d) => d.points || 0),
  );

  const dailyYAxisTicks = useMemo(() => {
    const top = Math.max(2, Math.ceil(maxDailyCount / 2) * 2);
    const ticks: number[] = [];
    for (let v = 0; v <= top; v += 2) ticks.push(v);
    return ticks;
  }, [maxDailyCount]);

  const pointsYAxisTicks = useMemo(() => {
    const topRaw = Math.max(10, Math.ceil(maxDailyPoints / 10) * 10);
    const ticks: number[] = [];
    for (let v = 0; v <= topRaw; v += 10) ticks.push(v);
    return ticks;
  }, [maxDailyPoints]);

  const weeklyTrendData = useMemo(() => {
    const weeks: {
      start: Date;
      end: Date;
      label: string;
      challenges: number;
      points: number;
    }[] = [];
    const today = new Date();
    const todayDay = (today.getDay() + 6) % 7;
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
    0,
    ...weeklyTrendData.map((w) => w.challenges || 0),
  );
  const maxWeeklyPoints = Math.max(
    0,
    ...weeklyTrendData.map((w) => w.points || 0),
  );

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
    0,
    ...monthlyTrendData.map((m) => m.challenges || 0),
  );
  const maxMonthlyPoints = Math.max(
    0,
    ...monthlyTrendData.map((m) => m.points || 0),
  );

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
      contentContainerStyle={[
        styles.content,
        isSmallScreen && styles.contentSmallPadding,
      ]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text
          style={[styles.screenTitle, { color: colors.text }, isSmallScreen && styles.screenTitleSmall]}
        >
          Progress
        </Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          Track your journey and celebrate your achievements
        </Text>
      </View>

      <View style={styles.topStatsRow}>
        <View
          style={[
            styles.topStatCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            (isSmallScreen || isMediumScreen) && styles.topStatCardCompact,
          ]}
        >
          <View style={styles.topStatIconRow}>
            <View>
              <Image
                source={require("../../assets/fire.png")}
                style={styles.topStatIcon}
              />
            </View>
          </View>
          <Text style={[styles.topStatLabel, { color: colors.textSecondary }]}>Current Streak</Text>
          <Text style={[styles.topStatValue, { color: colors.text }]}>
            {progress?.currentStreak || 0}{" "}
            <Text style={styles.topStatValueSuffix}>days</Text>
          </Text>
          <Text style={[styles.topStatHint, { color: colors.textMuted }]}>
            Consecutive days with challenges
          </Text>
        </View>

        <View
          style={[
            styles.topStatCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            (isSmallScreen || isMediumScreen) && styles.topStatCardCompact,
          ]}
        >
          <View style={styles.topStatIconRow}>
            <View>
              <Image
                source={require("../../assets/trophy.png")}
                style={styles.topStatIcon}
              />
            </View>
          </View>
          <Text style={[styles.topStatLabel, { color: colors.textSecondary }]}>Total Points</Text>
          <Text style={[styles.topStatValue, { color: colors.text }]}>{progress?.totalPoints || 0}</Text>
          <Text style={[styles.topStatHint, { color: colors.textMuted }]}>All-time points earned</Text>
        </View>

        <View
          style={[
            styles.topStatCardLast,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            (isSmallScreen || isMediumScreen) && styles.topStatCardCompact,
          ]}
        >
          <View style={styles.topStatIconRow}>
            <View>
              <Image
                source={require("../../assets/bullseye.png")}
                style={styles.topStatIcon}
              />
            </View>
          </View>
          <Text style={[styles.topStatLabel, { color: colors.textSecondary }]}>Challenges Completed</Text>
          <Text style={[styles.topStatValue, { color: colors.text }]}>
            {progress?.totalChallengesCompleted || 0}
          </Text>
          <Text style={[styles.topStatHint, { color: colors.textMuted }]}>Total challenges finished</Text>
        </View>
      </View>

      <View style={styles.middleRow}>
        <View
          style={[
            styles.largeCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            (isSmallScreen || isMediumScreen) && styles.largeCardCompact,
          ]}
        >
          <Text style={[styles.largeCardTitle, { color: colors.text }]}>Personal Best</Text>
          <View style={styles.largeCardRow}>
            <View style={styles.largeCardIconRow}>
              <View>
                <Image
                  source={require("../../assets/trophy.png")}
                  style={styles.largeCardIcon}
                />
              </View>
              <View>
                <Text style={[styles.largeCardLabel, { color: colors.textSecondary }]}>Longest Streak</Text>
                <Text style={[styles.largeCardValue, { color: colors.text }]}>
                  {progress?.longestStreak || 0} days
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.largeCardRow}>
            <Text style={[styles.largeCardLabel, { color: colors.textSecondary }]}>Avg. Points Per Challenge</Text>
            <Text style={[styles.largeCardValue, { color: colors.text }]}>
              {progress?.averagePointsPerChallenge
                ? Math.round(progress.averagePointsPerChallenge)
                : 0}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.largeCardLast,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            (isSmallScreen || isMediumScreen) && styles.largeCardCompact,
          ]}
        >
          <Text style={[styles.largeCardTitle, { color: colors.text }]}>Activity Summary</Text>
          <View style={styles.largeCardRow}>
            <View style={styles.largeCardIconRow}>
              <View>
                <Image
                  source={require("../../assets/extreme.png")}
                  style={styles.largeCardIcon}
                />
              </View>
              <View>
                <Text style={[styles.largeCardLabel, { color: colors.textSecondary }]}>Total Challenges</Text>
                <Text style={[styles.largeCardValue, { color: colors.text }]}>
                  {progress?.totalChallengesCompleted || 0}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.largeCardRow}>
            <Text style={[styles.largeCardLabel, { color: colors.textSecondary }]}>Last Completed</Text>
            <Text style={[styles.largeCardValue, { color: colors.text }]}>
              {history[0]?.completedAt
                ? new Date(history[0].completedAt).toLocaleDateString()
                : "-"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
          <Text style={[styles.sectionSubText, { color: colors.textSecondary }]}>
            {unlockedAchievements.length} of {achievements.length} unlocked
          </Text>
        </View>

        <View style={[styles.overallProgressCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={styles.overallHeaderRow}>
            <Text style={[styles.overallTitle, { color: colors.text }]}>Overall Progress</Text>
            <Text style={[styles.overallPercent, { color: colors.primary }]}>
              {overallAchievementProgress}%
            </Text>
          </View>
          <Text style={[styles.overallHint, { color: colors.textSecondary }]}>
            Keep completing challenges to unlock more achievements
          </Text>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.progressBackground }]}>
            <View
              style={[
                styles.progressBar,
                { width: `${overallAchievementProgress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.subSectionTitle, { color: colors.text }]}>Unlocked</Text>
        {unlockedAchievements.length === 0 ? (
          <Text style={[styles.emptyTextSmall, { color: colors.textMuted }]}>
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
                    borderColor: tierColors[a.tier] || colors.cardBorder,
                    backgroundColor: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.08)',
                    width: screenWidth * 0.8,
                  },
                ]}
              >
                <View style={[styles.achievementIconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={styles.achievementIconText}>🏅</Text>
                </View>
                <View style={styles.achievementTextBlock}>
                  <Text style={[styles.achievementName, { color: colors.text }]}>{a.name}</Text>
                  <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>{a.description}</Text>
                  <Text
                    style={[
                      styles.achievementTierBadge,
                      { color: tierColors[a.tier] || colors.textSecondary },
                    ]}
                  >
                    {a.tier.charAt(0).toUpperCase() + a.tier.slice(1)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {lockedAchievements.length > 0 && (
          <>
            <Text style={[styles.subSectionTitle, { marginTop: 20, color: colors.text }]}>
              Locked
            </Text>
            <View style={styles.lockedGrid}>
              {lockedAchievements.map((a) => (
                <View
                  key={a.id}
                  style={[
                    styles.lockedAchievementCard,
                    { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                    (isSmallScreen || isMediumScreen) && {
                      width: (screenWidth - 52) / 2,
                    },
                  ]}
                >
                  <View style={styles.lockedHeaderRow}>
                    <View style={[styles.lockedIconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={styles.lockedIconText}>🔒</Text>
                    </View>
                    <Text style={[styles.lockedTierLabel, { color: colors.textMuted }]}>
                      {a.tier.charAt(0).toUpperCase() + a.tier.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.lockedAchievementName, { color: colors.text }]}>{a.name}</Text>
                  <Text style={[styles.lockedAchievementDesc, { color: colors.textSecondary }]}>
                    {a.description}
                  </Text>
                  <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
                  <View style={[styles.progressBarContainerMini, { backgroundColor: colors.progressBackground }]}>
                    <View
                      style={[
                        styles.progressBarMini,
                        { width: `${a.progressPercent || 0}%`, backgroundColor: colors.primary },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressMiniText, { color: colors.textSecondary }]}>
                    {a.progress}/{a.requirementValue}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Analytics</Text>
        <Text style={[styles.sectionSubText, { color: colors.textSecondary }]}>
          Track your progress and insights over time
        </Text>

        <View style={styles.analyticsSummaryRow}>
          <View
            style={[
              styles.analyticsSummaryCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              (isSmallScreen || isMediumScreen) && styles.analyticsCardCompact,
            ]}
          >
            <View style={styles.analyticsSummaryHeaderRow}>
              <View
                style={[
                  styles.analyticsSummaryIconContainer,
                  { backgroundColor: colors.infoLight },
                ]}
              >
                <Image
                  source={require("../../assets/progress.png")}
                  style={styles.analyticsSummaryIcon}
                />
              </View>
            </View>
            <Text style={[styles.analyticsSummaryLabel, { color: colors.textSecondary }]}>Total Challenges</Text>
            <Text style={[styles.analyticsSummaryValue, { color: colors.text }]}>
              {progress?.totalChallengesCompleted || 0}
            </Text>
            <Text style={[styles.analyticsSummaryHint, { color: colors.textMuted }]}>
              Completed challenges
            </Text>
          </View>

          <View
            style={[
              styles.analyticsSummaryCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              (isSmallScreen || isMediumScreen) && styles.analyticsCardCompact,
            ]}
          >
            <View style={styles.analyticsSummaryHeaderRow}>
              <View
                style={[
                  styles.analyticsSummaryIconContainer,
                  { backgroundColor: colors.warningLight },
                ]}
              >
                <Image
                  source={require("../../assets/journal.png")}
                  style={styles.analyticsSummaryIcon}
                />
              </View>
            </View>
            <Text style={[styles.analyticsSummaryLabel, { color: colors.textSecondary }]}>Last 30 Days</Text>
            <Text style={[styles.analyticsSummaryValue, { color: colors.text }]}>
              {last30DaysData.reduce((acc, d) => acc + (d.count || 0), 0)}
            </Text>
            <Text style={[styles.analyticsSummaryHint, { color: colors.textMuted }]}>
              Challenges completed
            </Text>
          </View>

          <View
            style={[
              styles.analyticsSummaryCardLast,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              (isSmallScreen || isMediumScreen) && styles.analyticsCardCompact,
            ]}
          >
            <View style={styles.analyticsSummaryHeaderRow}>
              <View
                style={[
                  styles.analyticsSummaryIconContainer,
                  { backgroundColor: colors.errorLight },
                ]}
              >
                <Image
                  source={require("../../assets/settings.png")}
                  style={styles.analyticsSummaryIcon}
                />
              </View>
            </View>
            <Text style={[styles.analyticsSummaryLabel, { color: colors.textSecondary }]}>Categories</Text>
            <Text style={[styles.analyticsSummaryValue, { color: colors.text }]}>
              {Object.keys(categoryStats).length}
            </Text>
            <Text style={[styles.analyticsSummaryHint, { color: colors.textMuted }]}>Categories explored</Text>
          </View>
        </View>

        <View style={[styles.tabsRow, { backgroundColor: colors.backgroundSecondary }]}>
          {(["daily", "trends", "categories"] as AnalyticsTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                analyticsTab === tab && { backgroundColor: colors.cardBackground },
              ]}
              onPress={() => setAnalyticsTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary },
                  analyticsTab === tab && { color: colors.text, fontWeight: "600" },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {analyticsTab === "daily" && (
          <>
            <Text style={[styles.analyticsChartTitle, { color: colors.text }]}>Daily Activity</Text>
            <Text style={[styles.analyticsChartSubtitle, { color: colors.textMuted }]}>
              Challenges completed per day (last 30 days)
            </Text>
            <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.chartRow}>
                <View style={styles.chartYAxis}>
                  <Text style={[styles.chartYAxisLabel, { color: colors.textMuted }]}>
                    {dailyYAxisTicks[dailyYAxisTicks.length - 1] || 0}
                  </Text>
                  <Text style={[styles.chartYAxisLabel, { color: colors.textMuted }]}>0</Text>
                </View>
                <View style={styles.chartMainArea}>
                  <View style={styles.chartBarsRow}>
                    {last30DaysData.map((d, idx) => {
                      const maxTick = dailyYAxisTicks[dailyYAxisTicks.length - 1] || 1;
                      const ratio = maxTick > 0 ? d.count / maxTick : 0;
                      const h = ratio * 100;
                      return (
                        <View key={idx} style={styles.chartBarGroup}>
                          {h > 0 && (
                            <View
                              style={[
                                styles.chartBar,
                                { height: `${h}%`, backgroundColor: colors.primary },
                              ]}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <View style={[styles.chartBottomAxis, { backgroundColor: colors.border }]} />
                  <View style={styles.chartXAxis}>
                    {last30DaysData
                      .filter((_, idx) => idx % 5 === 0)
                      .map((d, idx) => (
                        <Text key={idx} style={[styles.chartXAxisLabel, { color: colors.textMuted }]}>
                          {d.label}
                        </Text>
                      ))}
                  </View>
                </View>
              </View>
            </View>

            <Text style={[styles.analyticsChartTitle, { marginTop: 16, color: colors.text }]}>
              Points Trend
            </Text>
            <Text style={[styles.analyticsChartSubtitle, { color: colors.textMuted }]}>
              Points earned per day (last 30 days)
            </Text>
            <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.chartRow}>
                <View style={styles.chartYAxis}>
                  <Text style={[styles.chartYAxisLabel, { color: colors.textMuted }]}>
                    {pointsYAxisTicks[pointsYAxisTicks.length - 1] || 0}
                  </Text>
                  <Text style={[styles.chartYAxisLabel, { color: colors.textMuted }]}>0</Text>
                </View>
                <View style={styles.chartMainArea}>
                  <View style={styles.chartBarsRow}>
                    {last30DaysData.map((d, idx) => {
                      const maxTick = pointsYAxisTicks[pointsYAxisTicks.length - 1] || 1;
                      const ratio = maxTick > 0 ? d.points / maxTick : 0;
                      const h = ratio * 100;
                      return (
                        <View key={idx} style={styles.chartBarGroup}>
                          {h > 0 && (
                            <View
                              style={[
                                styles.chartBar,
                                { height: `${h}%`, backgroundColor: "#ec4899" },
                              ]}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <View style={[styles.chartBottomAxis, { backgroundColor: colors.border }]} />
                  <View style={styles.chartXAxis}>
                    {last30DaysData
                      .filter((_, idx) => idx % 5 === 0)
                      .map((d, idx) => (
                        <Text key={idx} style={[styles.chartXAxisLabel, { color: colors.textMuted }]}>
                          {d.label}
                        </Text>
                      ))}
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {analyticsTab === "trends" && (
          <>
            <Text style={[styles.analyticsChartTitle, { color: colors.text }]}>Weekly Trend</Text>
            <Text style={[styles.analyticsChartSubtitle, { color: colors.textMuted }]}>
              Challenge completion over the last 12 weeks
            </Text>
            <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.chartRow}>
                <View style={styles.chartYAxis}>
                  <Text style={[styles.chartYAxisLabel, { color: colors.textMuted }]}>
                    {Math.max(maxWeeklyChallenges, maxWeeklyPoints, 1)}
                  </Text>
                  <Text style={[styles.chartYAxisLabel, { color: colors.textMuted }]}>0</Text>
                </View>
                <View style={styles.chartMainArea}>
                  <View style={styles.chartBarsRow}>
                    {weeklyTrendData.map((w, idx) => {
                      const challengeRatio =
                        maxWeeklyChallenges > 0
                          ? w.challenges / maxWeeklyChallenges
                          : 0;
                      const pointsRatio =
                        maxWeeklyPoints > 0 ? w.points / maxWeeklyPoints : 0;
                      const hChallenges = challengeRatio * 100;
                      const hPoints = pointsRatio * 100;
                      return (
                        <View key={idx} style={styles.chartBarGroup}>
                          {hChallenges > 0 && (
                            <View
                              style={[
                                styles.chartBar,
                                {
                                  height: `${hChallenges}%`,
                                  backgroundColor: colors.primary,
                                },
                              ]}
                            />
                          )}
                          {hPoints > 0 && (
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
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <View style={[styles.chartBottomAxis, { backgroundColor: colors.border }]} />
                  <View style={styles.chartXAxis}>
                    {weeklyTrendData.map((w, idx) => (
                      <Text key={idx} style={[styles.chartXAxisLabel, { color: colors.textMuted }]}>
                        {w.label}
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
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>Challenges</Text>
                </View>
                <View style={styles.chartLegendItem}>
                  <View
                    style={[
                      styles.chartLegendDot,
                      { backgroundColor: "#ec4899" },
                    ]}
                  />
                  <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>Points</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.analyticsChartTitle, { marginTop: 16, color: colors.text }]}>
              Monthly Trend
            </Text>
            <Text style={[styles.analyticsChartSubtitle, { color: colors.textMuted }]}>
              Challenge completion over the last 12 months
            </Text>
            <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.chartRow}>
                <View style={styles.chartYAxis}>
                  <Text style={[styles.chartYAxisLabel, { color: colors.textMuted }]}>
                    {Math.max(maxMonthlyChallenges, maxMonthlyPoints, 1)}
                  </Text>
                  <Text style={[styles.chartYAxisLabel, { color: colors.textMuted }]}>0</Text>
                </View>
                <View style={styles.chartMainArea}>
                  <View style={styles.chartBarsRow}>
                    {monthlyTrendData.map((m, idx) => {
                      const challengeRatio =
                        maxMonthlyChallenges > 0
                          ? m.challenges / maxMonthlyChallenges
                          : 0;
                      const pointsRatio =
                        maxMonthlyPoints > 0 ? m.points / maxMonthlyPoints : 0;
                      const hChallenges = challengeRatio * 100;
                      const hPoints = pointsRatio * 100;
                      return (
                        <View key={idx} style={styles.chartBarGroup}>
                          {hChallenges > 0 && (
                            <View
                              style={[
                                styles.chartBar,
                                {
                                  height: `${hChallenges}%`,
                                  backgroundColor: colors.primary,
                                },
                              ]}
                            />
                          )}
                          {hPoints > 0 && (
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
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <View style={[styles.chartBottomAxis, { backgroundColor: colors.border }]} />
                  <View style={styles.chartXAxis}>
                    {monthlyTrendData.map((m, idx) => (
                      <Text key={idx} style={[styles.chartXAxisLabel, { color: colors.textMuted }]}>
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
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>Challenges</Text>
                </View>
                <View style={styles.chartLegendItem}>
                  <View
                    style={[
                      styles.chartLegendDot,
                      { backgroundColor: "#ec4899" },
                    ]}
                  />
                  <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>Points</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {analyticsTab === "categories" && (
          <View style={[styles.categoriesAnalyticsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            {categoryEntries.length === 0 ? (
              <Text style={[styles.emptyTextSmall, { color: colors.textMuted }]}>
                No category data yet. Complete some challenges first.
              </Text>
            ) : (
              <>
                <Text style={[styles.analyticsChartTitle, { color: colors.text }]}>
                  Category Distribution
                </Text>
                <Text style={[styles.analyticsChartSubtitle, { color: colors.textMuted }]}>
                  Breakdown of challenges by category
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
                          colors.primary;
                        const d = describeArc(80, 80, 70, startAngle, endAngle);
                        startAngle = endAngle;
                        return <Path key={cat} d={d} fill={color} />;
                      });
                    })()}
                  </Svg>
                  <View style={styles.pieLegend}>
                    <Text style={[styles.pieLegendTitle, { color: colors.text }]}>
                      Category Breakdown
                    </Text>
                    {categoryEntries.map(([cat, count]) => {
                      const config = categoryConfig[cat as ChallengeCategory];
                      const color = config?.color || colors.primary;
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
                            <Text style={[styles.pieLegendLabel, { color: colors.text }]}>{label}</Text>
                            <Text style={[styles.pieLegendText, { color: colors.textSecondary }]}>
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Challenge History</Text>
        <Text style={[styles.sectionSubText, { color: colors.textSecondary }]}>
          Review your completed challenges and achievements
        </Text>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No completed challenges yet</Text>
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
                style={[styles.historyCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
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
                    <Text style={[styles.historyTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.historyCategory, { color: colors.textSecondary }]}>
                      {category?.label || item.category}
                    </Text>
                    <View style={styles.historyMetaRow}>
                      <Text style={[styles.historyMetaText, { color: colors.textMuted }]}>
                        {item.completedAt
                          ? new Date(item.completedAt).toLocaleDateString()
                          : ""}
                      </Text>
                      <Text style={[styles.historyMetaDot, { color: colors.textMuted }]}>•</Text>
                      <Text style={[styles.historyMetaText, { color: colors.textMuted }]}>
                        Time: {item.estimatedMinutes || 2}:00
                      </Text>
                      <Text style={[styles.historyMetaDot, { color: colors.textMuted }]}>•</Text>
                      <Text style={[styles.historyMetaText, { color: colors.textMuted }]}>
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
                    <Text style={[styles.historyExpandedText, { color: colors.textSecondary }]}>
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
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  contentSmallPadding: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  screenTitleSmall: {
    fontSize: 24,
  },
  screenSubtitle: {
    fontSize: 14,
  },

  topStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  topStatCard: {
    flex: 1,
    marginRight: 8,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  topStatCardLast: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  topStatCardCompact: {
    marginRight: 0,
    marginBottom: 8,
    flexBasis: "48%",
  },
  topStatIconRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  topStatIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  topStatLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  topStatValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  topStatValueSuffix: {
    fontSize: 16,
    fontWeight: "500",
  },
  topStatHint: {
    fontSize: 11,
    marginTop: 4,
  },

  middleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  largeCard: {
    flex: 1,
    marginRight: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  largeCardLast: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  largeCardCompact: {
    marginRight: 0,
    marginBottom: 12,
    flexBasis: "48%",
  },
  largeCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  largeCardRow: {
    marginBottom: 8,
  },
  largeCardLabel: {
    fontSize: 12,
  },
  largeCardValue: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  largeCardIconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  largeCardIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    marginRight: 10,
  },

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
    marginBottom: 4,
  },
  sectionSubText: {
    fontSize: 12,
  },

  overallProgressCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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
  },
  overallPercent: {
    fontSize: 14,
    fontWeight: "600",
  },
  overallHint: {
    fontSize: 12,
    marginBottom: 8,
  },

  progressBarContainer: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 999,
  },

  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyTextSmall: {
    fontSize: 12,
  },

  achievementsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  achievementCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1.5,
  },
  achievementIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 12,
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
    width: (INITIAL_WIDTH - 52) / 2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
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
    justifyContent: "center",
    alignItems: "center",
  },
  lockedIconText: {
    fontSize: 16,
  },
  lockedTierLabel: {
    fontSize: 11,
  },
  lockedAchievementName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  lockedAchievementDesc: {
    fontSize: 11,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  progressBarContainerMini: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarMini: {
    height: "100%",
  },
  progressMiniText: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },

  analyticsSummaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
  },
  analyticsSummaryCard: {
    flex: 1,
    marginRight: 8,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  analyticsSummaryCardLast: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  analyticsCardCompact: {
    marginRight: 0,
    marginBottom: 8,
    flexBasis: "48%",
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
    marginBottom: 4,
  },
  analyticsSummaryValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  analyticsSummaryHint: {
    fontSize: 11,
    marginTop: 2,
  },

  tabsRow: {
    flexDirection: "row",
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
  tabText: {
    fontSize: 13,
    fontWeight: "500",
  },

  analyticsChartTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  analyticsChartSubtitle: {
    fontSize: 11,
    marginBottom: 6,
  },

  chartContainer: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
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
  },

  categoriesAnalyticsContainer: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
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
  },
  pieLegendText: {
    fontSize: 11,
  },

  historyCard: {
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  historyLeft: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-start",
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
    resizeMode: "cover",
  },
  historyMainInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  historyCategory: {
    fontSize: 12,
    marginBottom: 4,
  },
  historyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  historyMetaText: {
    fontSize: 11,
  },
  historyMetaDot: {
    marginHorizontal: 4,
    fontSize: 11,
  },
  historyRight: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
    marginLeft: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyBadgeHard: {
    backgroundColor: "#fee2e2",
  },
  difficultyBadgeMedium: {
    backgroundColor: "#fef3c7",
  },
  difficultyBadgeEasy: {
    backgroundColor: "#dcfce7",
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  historyExpanded: {
    width: "100%",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  historyExpandedText: {
    fontSize: 13,
    lineHeight: 18,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
