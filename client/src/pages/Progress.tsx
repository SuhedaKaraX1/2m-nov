import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Flame,
  Trophy,
  Target,
  Award,
  TrendingUp,
  Star,
  Zap,
  Crown,
  Sparkles,
  Coins,
  Gem,
  Activity,
  Brain,
  BookOpen,
  DollarSign,
  Heart,
  CircleDot,
  Footprints,
  Sword,
  Share2,
  Copy,
  Check,
  Clock,
  Calendar,
  PieChart as PieChartIcon,
  type LucideIcon,
} from "lucide-react";
import type { 
  UserProgress, 
  AchievementWithProgress,
  ChallengeWithDetails 
} from "@shared/schema";
import { categoryConfig, difficultyConfig } from "@/lib/categories";

const iconMap: Record<string, LucideIcon> = {
  Trophy,
  Award,
  Target,
  Star,
  Flame,
  Zap,
  Crown,
  Sparkles,
  Coins,
  Gem,
  Activity,
  Brain,
  BookOpen,
  DollarSign,
  Heart,
  CircleDot,
  Footprints,
  TrendingUp,
  Sword,
};

const tierColors = {
  bronze:
    "text-amber-700 dark:text-amber-600 border-amber-700/50 dark:border-amber-600/50",
  silver:
    "text-slate-400 dark:text-slate-300 border-slate-400/50 dark:border-slate-300/50",
  gold: "text-yellow-500 dark:text-yellow-400 border-yellow-500/50 dark:border-yellow-400/50",
  platinum:
    "text-cyan-400 dark:text-cyan-300 border-cyan-400/50 dark:border-cyan-300/50",
};

const tierBgColors = {
  bronze: "bg-amber-950/20 dark:bg-amber-950/30",
  silver: "bg-slate-900/20 dark:bg-slate-900/30",
  gold: "bg-yellow-950/20 dark:bg-yellow-950/30",
  platinum: "bg-cyan-950/20 dark:bg-cyan-950/30",
};

const CATEGORY_COLORS = {
  physical: "#ef4444",
  mental: "#3b82f6",
  learning: "#8b5cf6",
  finance: "#10b981",
  relationships: "#ec4899",
  extreme: "#f59e0b",
};

export default function Progress() {
  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery<AchievementWithProgress[]>(
    {
      queryKey: ["/api/achievements/user"],
    },
  );

  const { data: history, isLoading: historyLoading } = useQuery<ChallengeWithDetails[]>({
    queryKey: ["/api/history"],
  });

  const { data: dailyStats } = useQuery<
    Array<{ date: string; count: number; points: number }>
  >({
    queryKey: ["/api/analytics/daily?days=30"],
  });

  const { data: categoryDistribution } = useQuery<
    Array<{ category: string; count: number; percentage: number }>
  >({
    queryKey: ["/api/analytics/category"],
  });

  const { data: weeklyTrend } = useQuery<
    Array<{ week: string; count: number; points: number }>
  >({
    queryKey: ["/api/analytics/weekly"],
  });

  const { data: monthlyTrend } = useQuery<
    Array<{ month: string; count: number; points: number }>
  >({
    queryKey: ["/api/analytics/monthly"],
  });

  const longestStreak = progress?.longestStreak || 0;
  const totalChallenges = progress?.totalChallengesCompleted || 0;
  const avgPointsPerChallenge = totalChallenges > 0 
    ? Math.round((progress?.totalPoints || 0) / totalChallenges)
    : 0;

  const unlockedCount = achievements?.filter((a) => a.unlocked).length || 0;
  const totalCount = achievements?.length || 0;
  const unlockedAchievements = achievements?.filter((a) => a.unlocked) || [];
  const lockedAchievements = achievements?.filter((a) => !a.unlocked) || [];

  const formattedDailyData =
    dailyStats?.map((stat) => ({
      ...stat,
      displayDate: new Date(stat.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    })) || [];

  const categoryChartData =
    categoryDistribution?.map((item) => ({
      name:
        categoryConfig[item.category as keyof typeof categoryConfig]?.label ||
        item.category,
      value: item.count,
      percentage: item.percentage,
      color:
        CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] ||
        "#6b7280",
    })) || [];

  const formattedWeeklyData =
    weeklyTrend?.map((stat) => ({
      ...stat,
      displayWeek: new Date(stat.week).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    })) || [];

  const formattedMonthlyData =
    monthlyTrend?.map((stat) => ({
      ...stat,
      displayMonth: new Date(stat.month + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    })) || [];

  const totalChallengesAnalytics =
    categoryDistribution?.reduce((sum, item) => sum + item.count, 0) || 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/30 dark:bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Button variant="ghost" asChild data-testid="button-back">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground dark:text-foreground mb-3" data-testid="heading-page">Your Progress</h1>
          <p className="text-muted-foreground dark:text-muted-foreground text-lg" data-testid="text-page-description">
            Track your journey and celebrate your achievements
          </p>
        </div>

        <section id="progress-stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Current Streak"
              value={progressLoading ? "..." : `${progress?.currentStreak || 0} days`}
              icon={Flame}
              description="Consecutive days with challenges"
            />
            <StatCard
              title="Total Points"
              value={progressLoading ? "..." : progress?.totalPoints || 0}
              icon={Trophy}
              description="All-time points earned"
            />
            <StatCard
              title="Challenges Completed"
              value={progressLoading ? "..." : totalChallenges}
              icon={Target}
              description="Total challenges finished"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-card-border bg-card dark:bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-card-foreground dark:text-card-foreground">
                  <Award className="h-5 w-5 text-primary dark:text-primary" />
                  Personal Best
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">Longest Streak</div>
                    <div className="text-2xl font-bold text-foreground dark:text-foreground" data-testid="text-longest-streak">
                      {longestStreak} days
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">Avg. Points Per Challenge</div>
                    <div className="text-2xl font-bold text-foreground dark:text-foreground" data-testid="text-avg-points">
                      {avgPointsPerChallenge}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border bg-card dark:bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-card-foreground dark:text-card-foreground">
                  <TrendingUp className="h-5 w-5 text-primary dark:text-primary" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">Total Challenges</div>
                    <div className="text-2xl font-bold text-foreground dark:text-foreground">
                      {totalChallenges}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">Last Completed</div>
                    <div className="text-sm font-medium text-foreground dark:text-foreground">
                      {progress?.lastCompletedDate 
                        ? new Date(progress.lastCompletedDate).toLocaleDateString()
                        : "No challenges yet"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="achievements">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-2" data-testid="text-achievements-title">
              Achievements
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>

          <Card className="mb-6 bg-card dark:bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-card-foreground dark:text-card-foreground">Overall Progress</h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                    Keep completing challenges to unlock more achievements
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-primary dark:text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground dark:text-muted-foreground">Completion</span>
                  <span className="font-medium text-foreground dark:text-foreground">
                    {Math.floor((unlockedCount / totalCount) * 100)}%
                  </span>
                </div>
                <ProgressBar value={(unlockedCount / totalCount) * 100} />
              </div>
            </CardContent>
          </Card>

          {achievementsLoading ? (
            <div className="text-center py-12 text-muted-foreground dark:text-muted-foreground">
              Loading achievements...
            </div>
          ) : (
            <>
              {unlockedAchievements.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-xl font-semibold text-foreground dark:text-foreground">Unlocked</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unlockedAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                  </div>
                </div>
              )}

              {lockedAchievements.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground dark:text-foreground">Locked</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lockedAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section id="analytics">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-2" data-testid="text-analytics-title">
              Analytics
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Track your progress and insights over time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-card dark:bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground dark:text-card-foreground">
                  Total Challenges
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold text-foreground dark:text-foreground"
                  data-testid="text-total-challenges"
                >
                  {totalChallengesAnalytics}
                </div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Completed challenges
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground dark:text-card-foreground">
                  Last 30 Days
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold text-foreground dark:text-foreground"
                  data-testid="text-last-30-days"
                >
                  {formattedDailyData.reduce((sum, stat) => sum + stat.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Challenges completed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground dark:text-card-foreground">Categories</CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className="text-2xl font-bold text-foreground dark:text-foreground"
                  data-testid="text-active-categories"
                >
                  {categoryChartData.length}
                </div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Categories explored
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-muted dark:bg-muted">
              <TabsTrigger value="daily" data-testid="tab-daily">
                Daily
              </TabsTrigger>
              <TabsTrigger value="trends" data-testid="tab-trends">
                Trends
              </TabsTrigger>
              <TabsTrigger value="categories" data-testid="tab-categories">
                Categories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <Card className="bg-card dark:bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground dark:text-card-foreground">Daily Activity (Last 30 Days)</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-muted-foreground">
                    Number of challenges completed each day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedDailyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formattedDailyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted dark:stroke-muted"
                        />
                        <XAxis
                          dataKey="displayDate"
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          name="Challenges"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground dark:text-muted-foreground">
                      No data available for the last 30 days
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card dark:bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground dark:text-card-foreground">Points Earned (Last 30 Days)</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-muted-foreground">Points accumulated each day</CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedDailyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={formattedDailyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted dark:stroke-muted"
                        />
                        <XAxis
                          dataKey="displayDate"
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="points"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Points"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground dark:text-muted-foreground">
                      No data available for the last 30 days
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card className="bg-card dark:bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground dark:text-card-foreground">Weekly Trend</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-muted-foreground">
                    Challenge completion over the last 12 weeks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedWeeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={formattedWeeklyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted dark:stroke-muted"
                        />
                        <XAxis
                          dataKey="displayWeek"
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Challenges"
                        />
                        <Line
                          type="monotone"
                          dataKey="points"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          name="Points"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground dark:text-muted-foreground">
                      No weekly data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card dark:bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground dark:text-card-foreground">Monthly Trend</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-muted-foreground">
                    Challenge completion over the last 12 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formattedMonthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formattedMonthlyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted dark:stroke-muted"
                        />
                        <XAxis
                          dataKey="displayMonth"
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          name="Challenges"
                        />
                        <Bar
                          dataKey="points"
                          fill="hsl(var(--chart-2))"
                          name="Points"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground dark:text-muted-foreground">
                      No monthly data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card className="bg-card dark:bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground dark:text-card-foreground">Category Distribution</CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-muted-foreground">
                    Breakdown of challenges by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryChartData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) =>
                              `${name} (${percentage}%)`
                            }
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground dark:text-muted-foreground">
                          Category Breakdown
                        </h4>
                        {categoryChartData.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm text-foreground dark:text-foreground">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-foreground dark:text-foreground">
                                {item.value}
                              </span>
                              <span className="text-sm text-muted-foreground dark:text-muted-foreground w-12 text-right">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground dark:text-muted-foreground">
                      No category data available. Complete some challenges to see
                      your distribution!
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <section id="history">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-2" data-testid="heading-history">Challenge History</h2>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Review your completed challenges and achievements
            </p>
          </div>

          {historyLoading ? (
            <div className="text-center py-12 text-muted-foreground dark:text-muted-foreground" data-testid="loading-history">
              Loading history...
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state-history">
              <div className="w-20 h-20 rounded-full bg-muted/20 dark:bg-muted/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2" data-testid="text-empty-title">
                No History Yet
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground max-w-md mx-auto mb-6" data-testid="text-empty-description">
                Complete your first challenge to start building your history!
              </p>
              <Button asChild data-testid="button-start-first">
                <Link href="/">Start a Challenge</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => {
                const category = categoryConfig[item.category as keyof typeof categoryConfig];
                const difficulty = difficultyConfig[item.difficulty as keyof typeof difficultyConfig];
                const Icon = category?.icon;

                return (
                  <Card
                    key={`${item.id}-${index}`}
                    className="border-card-border bg-card dark:bg-card hover-elevate transition-all"
                    data-testid={`card-history-${index}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {Icon && (
                          <div className="w-12 h-12 rounded-full bg-card dark:bg-card flex items-center justify-center shrink-0">
                            <Icon className="h-6 w-6 text-foreground dark:text-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground dark:text-foreground truncate" data-testid={`text-challenge-title-${index}`}>
                                {item.title}
                              </h3>
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground">{category?.label}</p>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              <span className={difficulty.color}>{difficulty.label}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span data-testid={`text-date-${index}`}>{item.completedAt ? formatDate(item.completedAt) : "Unknown"}</span>
                            </div>
                            {item.timeSpent !== undefined && (
                              <div className="flex items-center gap-1">
                                <span>Time:</span>
                                <span className="font-medium text-foreground dark:text-foreground" data-testid={`text-time-${index}`}>
                                  {formatTime(item.timeSpent)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4 text-primary dark:text-primary" />
                              <span className="font-medium text-foreground dark:text-foreground" data-testid={`text-points-${index}`}>
                                {item.pointsEarned || item.points} points
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {totalChallenges === 0 && (
          <div className="mt-12 text-center py-12" data-testid="empty-state">
            <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Target className="h-10 w-10 text-primary dark:text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2" data-testid="text-empty-title">
              Start Your Journey
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground max-w-md mx-auto mb-6" data-testid="text-empty-description">
              Complete your first challenge to start tracking your progress and building streaks!
            </p>
            <Button asChild data-testid="button-start-first">
              <Link href="/">Browse Challenges</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function AchievementCard({
  achievement,
}: {
  achievement: AchievementWithProgress;
}) {
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = iconMap[achievement.icon] || Trophy;
  const tierColor =
    tierColors[achievement.tier as keyof typeof tierColors] ||
    tierColors.bronze;
  const tierBg =
    tierBgColors[achievement.tier as keyof typeof tierBgColors] ||
    tierBgColors.bronze;

  const shareUrl = achievement.userAchievementId
    ? `${window.location.origin}/share/achievement/${achievement.userAchievementId}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Share this achievement with your friends.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card
        className={`relative overflow-hidden transition-all bg-card dark:bg-card ${achievement.unlocked ? "hover-elevate" : "opacity-60"}`}
        data-testid={`card-achievement-${achievement.id}`}
      >
        {achievement.unlocked && (
          <div className={`absolute inset-0 ${tierBg} pointer-events-none`} />
        )}
        <CardContent className="relative p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${tierBg} border ${tierColor}`}>
              <Icon className={`h-6 w-6 ${tierColor}`} />
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${tierColor} capitalize`}
                data-testid={`badge-tier-${achievement.tier}`}
              >
                {achievement.tier}
              </Badge>
              {achievement.unlocked && achievement.userAchievementId && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setShareDialogOpen(true)}
                  data-testid={`button-share-${achievement.id}`}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3
              className="font-semibold text-lg text-card-foreground dark:text-card-foreground"
              data-testid={`text-achievement-name-${achievement.id}`}
            >
              {achievement.name}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {achievement.description}
            </p>
          </div>

          {!achievement.unlocked && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground dark:text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground dark:text-foreground">
                  {achievement.progress}/{achievement.requirementValue}
                </span>
              </div>
              <ProgressBar value={achievement.progressPercent} />
            </div>
          )}

          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent data-testid="dialog-share-achievement" className="bg-card dark:bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground dark:text-card-foreground">Share Achievement</DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
              Share your "{achievement.name}" achievement with friends
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
                data-testid="input-share-url"
              />
              <Button onClick={handleCopyLink} data-testid="button-copy-link">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Anyone with this link can see this achievement and when you
              unlocked it.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
