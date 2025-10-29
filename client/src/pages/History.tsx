import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Award } from "lucide-react";
import type { ChallengeWithDetails } from "@shared/schema";
import { categoryConfig, difficultyConfig } from "@/lib/categories";

export default function History() {
  // Fetch challenge history
  const { data: history, isLoading } = useQuery<ChallengeWithDetails[]>({
    queryKey: ["/api/history"],
  });

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
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" asChild data-testid="button-back">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3" data-testid="heading-page">Challenge History</h1>
          <p className="text-muted-foreground text-lg" data-testid="text-page-description">
            Review your completed challenges and achievements
          </p>
        </div>

        {/* History Timeline */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="loading-history">
            Loading history...
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-state">
            <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2" data-testid="text-empty-title">
              No History Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6" data-testid="text-empty-description">
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
                  className="border-card-border hover-elevate transition-all"
                  data-testid={`card-history-${index}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {Icon && (
                        <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center shrink-0">
                          <Icon className="h-6 w-6 text-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate" data-testid={`text-challenge-title-${index}`}>
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{category?.label}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            <span className={difficulty.color}>{difficulty.label}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span data-testid={`text-date-${index}`}>{item.completedAt ? formatDate(item.completedAt) : "Unknown"}</span>
                          </div>
                          {item.timeSpent !== undefined && (
                            <div className="flex items-center gap-1">
                              <span>Time:</span>
                              <span className="font-medium text-foreground" data-testid={`text-time-${index}`}>
                                {formatTime(item.timeSpent)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground" data-testid={`text-points-${index}`}>
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
      </main>
    </div>
  );
}
