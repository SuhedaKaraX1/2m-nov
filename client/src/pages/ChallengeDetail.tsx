import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { CircularTimer } from "@/components/CircularTimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { categoryConfig, difficultyConfig } from "@/lib/categories";
import type { Challenge } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ChallengeDetail() {
  const [, params] = useRoute("/challenge/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isComplete, setIsComplete] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);

  const challengeId = params?.id;

  // Fetch challenge details
  const { data: challenge, isLoading } = useQuery<Challenge>({
    queryKey: ["/api/challenges", challengeId],
    enabled: !!challengeId,
  });

  // Complete challenge mutation
  const completeMutation = useMutation({
    mutationFn: async (data: { timeSpent: number }) => {
      return apiRequest("POST", `/api/challenges/${challengeId}/complete`, data);
    },
    onSuccess: (data: any) => {
      setPointsEarned(data.pointsEarned || challenge?.points || 0);
      setIsComplete(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/random"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/user"] });
      
      // Show challenge completion toast
      toast({
        title: "Challenge Complete!",
        description: `You earned ${data.pointsEarned || challenge?.points} points!`,
      });

      // Show achievement unlock toasts
      if (data.newAchievements && data.newAchievements.length > 0) {
        data.newAchievements.forEach((achievement: any, index: number) => {
          setTimeout(() => {
            toast({
              title: "Achievement Unlocked!",
              description: `${achievement.name}: ${achievement.description}`,
              duration: 5000,
            });
          }, (index + 1) * 1000); // Stagger notifications by 1 second
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete challenge. Please try again.",
        variant: "destructive",
      });
      // Reset completion state on error
      setIsComplete(false);
    },
  });

  const handleComplete = () => {
    const totalTime = 120 - timeSpent;
    completeMutation.mutate({ timeSpent: totalTime });
  };

  const handleTimeUpdate = (remaining: number) => {
    setTimeSpent(remaining);
  };

  const handleBack = () => {
    setLocation("/");
  };

  if (isLoading || !challenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground" data-testid="loading-challenge">Loading challenge...</div>
      </div>
    );
  }

  const category = categoryConfig[challenge.category as keyof typeof categoryConfig];
  const difficulty = difficultyConfig[challenge.difficulty as keyof typeof difficultyConfig];
  const Icon = category?.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Challenge Info */}
        <Card className="border-card-border mb-8">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {Icon && (
                  <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center shrink-0">
                    <Icon className="h-7 w-7 text-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl mb-1" data-testid="text-challenge-title">
                    {challenge.title}
                  </CardTitle>
                  <CardDescription>{category?.label}</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">
                <span className={difficulty.color}>{difficulty.label}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-foreground">{challenge.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Instructions</h3>
              <p className="text-foreground leading-relaxed">{challenge.instructions}</p>
            </div>
            <div className="flex items-center gap-6 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="font-semibold text-foreground" data-testid="text-duration">2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Points:</span>
                <span className="font-semibold text-foreground" data-testid="text-points">{challenge.points}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer Section */}
        <div className="flex flex-col items-center">
          {!isComplete ? (
            <CircularTimer
              duration={120} // 2 minutes
              onComplete={handleComplete}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <div className="text-center py-12" data-testid="completion-message">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700" data-testid="text-completion-title">
                Well Done!
              </h2>
              <p className="text-muted-foreground mb-2 animate-in fade-in duration-1000" data-testid="text-completion-message">
                You've completed this challenge and earned <span className="font-bold text-primary">{pointsEarned || challenge.points} points</span>!
              </p>
              {completeMutation.isPending && (
                <p className="text-sm text-muted-foreground mb-8">Updating your progress...</p>
              )}
              {!completeMutation.isPending && (
                <p className="text-sm text-muted-foreground mb-8">Your streak and stats have been updated</p>
              )}
              <div className="flex gap-3 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Button onClick={handleBack} data-testid="button-back-home">
                  Back to Home
                </Button>
                <Button variant="outline" onClick={() => setLocation("/challenges")} data-testid="link-more-challenges">
                  More Challenges
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
