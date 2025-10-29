import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { TrendingUp, Calendar, PieChart as PieChartIcon, Activity } from "lucide-react";
import { categoryConfig } from "@/lib/categories";

const CATEGORY_COLORS = {
  physical: "#ef4444",
  mental: "#3b82f6",
  learning: "#8b5cf6",
  finance: "#10b981",
  relationships: "#ec4899",
};

export default function Analytics() {
  const { data: dailyStats, isLoading: dailyLoading } = useQuery<Array<{ date: string; count: number; points: number }>>({
    queryKey: ["/api/analytics/daily?days=30"],
  });

  const { data: categoryDistribution, isLoading: categoryLoading } = useQuery<Array<{ category: string; count: number; percentage: number }>>({
    queryKey: ["/api/analytics/category"],
  });

  const { data: weeklyTrend, isLoading: weeklyLoading } = useQuery<Array<{ week: string; count: number; points: number }>>({
    queryKey: ["/api/analytics/weekly"],
  });

  const { data: monthlyTrend, isLoading: monthlyLoading } = useQuery<Array<{ month: string; count: number; points: number }>>({
    queryKey: ["/api/analytics/monthly"],
  });

  const isLoading = dailyLoading || categoryLoading || weeklyLoading || monthlyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground mt-4">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Format daily data for display
  const formattedDailyData = dailyStats?.map(stat => ({
    ...stat,
    displayDate: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })) || [];

  // Format category data for pie chart
  const categoryChartData = categoryDistribution?.map(item => ({
    name: categoryConfig[item.category as keyof typeof categoryConfig]?.label || item.category,
    value: item.count,
    percentage: item.percentage,
    color: CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] || '#6b7280',
  })) || [];

  // Format weekly data
  const formattedWeeklyData = weeklyTrend?.map(stat => ({
    ...stat,
    displayWeek: new Date(stat.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })) || [];

  // Format monthly data
  const formattedMonthlyData = monthlyTrend?.map(stat => ({
    ...stat,
    displayMonth: new Date(stat.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  })) || [];

  const totalChallenges = categoryDistribution?.reduce((sum, item) => sum + item.count, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-analytics-title">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your progress and insights over time
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Challenges</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-challenges">{totalChallenges}</div>
              <p className="text-xs text-muted-foreground">Completed challenges</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-last-30-days">
                {formattedDailyData.reduce((sum, stat) => sum + stat.count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Challenges completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-categories">
                {categoryChartData.length}
              </div>
              <p className="text-xs text-muted-foreground">Categories explored</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
          </TabsList>

          {/* Daily Activity Chart */}
          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
                <CardDescription>Number of challenges completed each day</CardDescription>
              </CardHeader>
              <CardContent>
                {formattedDailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="displayDate" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Challenges" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for the last 30 days
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points Earned (Last 30 Days)</CardTitle>
                <CardDescription>Points accumulated each day</CardDescription>
              </CardHeader>
              <CardContent>
                {formattedDailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formattedDailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="displayDate" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
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
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for the last 30 days
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Chart */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Trend</CardTitle>
                <CardDescription>Challenge completion over the last 12 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                {formattedWeeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formattedWeeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="displayWeek" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
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
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No weekly data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
                <CardDescription>Challenge completion over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {formattedMonthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formattedMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="displayMonth" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Challenges" />
                      <Bar dataKey="points" fill="hsl(var(--chart-2))" name="Points" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No monthly data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Distribution */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Breakdown of challenges by category</CardDescription>
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
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
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
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Category Breakdown</h4>
                      {categoryChartData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">{item.value}</span>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No category data available. Complete some challenges to see your distribution!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
