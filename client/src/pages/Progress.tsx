import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Flame, Trophy, Target, Award, TrendingUp } from "lucide-react";
import type { UserProgress, ChallengeHistory } from "@shared/schema";

export default function Progress() {
  // Fetch user progress
  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
  });

  // Fetch challenge history for stats
  const { data: history } = useQuery<ChallengeHistory[]>({
    queryKey: ["/api/history"],
  });

  const longestStreak = progress?.longestStreak || 0;
  const totalChallenges = progress?.totalChallengesCompleted || 0;
  const avgPointsPerChallenge = totalChallenges > 0 
    ? Math.round((progress?.totalPoints || 0) / totalChallenges)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Button variant="ghost" asChild data-testid="button-back">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3" data-testid="heading-page">Your Progress</h1>
          <p className="text-muted-foreground text-lg" data-testid="text-page-description">
            Track your journey and celebrate your achievements
          </p>
        </div>

        {/* Main Stats */}
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

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-primary" />
                Personal Best
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Longest Streak</div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-longest-streak">
                    {longestStreak} days
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Avg. Points Per Challenge</div>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-avg-points">
                    {avgPointsPerChallenge}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Challenges</div>
                  <div className="text-2xl font-bold text-foreground">
                    {totalChallenges}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Last Completed</div>
                  <div className="text-sm font-medium text-foreground">
                    {progress?.lastCompletedDate 
                      ? new Date(progress.lastCompletedDate).toLocaleDateString()
                      : "No challenges yet"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Motivation Message */}
        {totalChallenges === 0 && (
          <div className="mt-12 text-center py-12" data-testid="empty-state">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Target className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2" data-testid="text-empty-title">
              Start Your Journey
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6" data-testid="text-empty-description">
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
