import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trophy, Award, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface SharedAchievementData {
  achievement: {
    tier: string;
    icon: string;
    name: string;
    description: string;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  unlockedAt: string | null;
}

export default function ShareAchievement() {
  const [, params] = useRoute("/share/achievement/:id");
  const userAchievementId = params?.id;

  const { data, isLoading, error } = useQuery<SharedAchievementData>({
    queryKey: [`/api/achievements/share/${userAchievementId}`],
    enabled: !!userAchievementId, // Only fetch if ID is present
  });

  // Handle missing ID parameter
  if (!userAchievementId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-not-found">
          <CardContent className="p-8 text-center space-y-4">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h2
                className="text-xl font-semibold"
                data-testid="text-not-found-title"
              >
                Achievement Not Found
              </h2>
              <p
                className="text-muted-foreground mt-2"
                data-testid="text-not-found-description"
              >
                This achievement link may be invalid or has been removed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-4" data-testid="text-loading">
            Loading achievement...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-not-found">
          <CardContent className="p-8 text-center space-y-4">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h2
                className="text-xl font-semibold"
                data-testid="text-not-found-title"
              >
                Achievement Not Found
              </h2>
              <p
                className="text-muted-foreground mt-2"
                data-testid="text-not-found-description"
              >
                This achievement link may be invalid or has been removed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { achievement, user, unlockedAt } = data;
  const userName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Someone";
  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
    "?";

  const tierColors = {
    bronze:
      "text-amber-700 dark:text-amber-600 border-amber-700/50 dark:border-amber-600/50 bg-amber-950/20 dark:bg-amber-950/30",
    silver:
      "text-slate-400 dark:text-slate-300 border-slate-400/50 dark:border-slate-300/50 bg-slate-900/20 dark:bg-slate-900/30",
    gold: "text-yellow-500 dark:text-yellow-400 border-yellow-500/50 dark:border-yellow-400/50 bg-yellow-950/20 dark:bg-yellow-950/30",
    platinum:
      "text-cyan-400 dark:text-cyan-300 border-cyan-400/50 dark:border-cyan-300/50 bg-cyan-950/20 dark:bg-cyan-950/30",
  };

  const tierColor =
    tierColors[achievement.tier as keyof typeof tierColors] ||
    tierColors.bronze;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">2Mins</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Achievement Card */}
          <Card
            className="overflow-hidden"
            data-testid="card-shared-achievement"
          >
            <div
              className={`absolute inset-0 ${tierColor.split(" ").find((c) => c.startsWith("bg-"))} pointer-events-none opacity-50`}
            />
            <CardContent className="relative p-8 space-y-6">
              {/* Achievement Icon and Tier */}
              <div className="flex items-start justify-between">
                <div className={`p-4 rounded-lg border ${tierColor}`}>
                  {achievement.icon === "Trophy" ? (
                    <Trophy className={`h-8 w-8 ${tierColor.split(" ")[0]}`} />
                  ) : (
                    <Award className={`h-8 w-8 ${tierColor.split(" ")[0]}`} />
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`${tierColor} capitalize text-base px-4 py-1`}
                  data-testid="badge-tier"
                >
                  {achievement.tier}
                </Badge>
              </div>

              {/* Achievement Details */}
              <div className="space-y-3">
                <h2
                  className="text-2xl font-bold"
                  data-testid="text-achievement-name"
                >
                  {achievement.name}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {achievement.description}
                </p>
              </div>

              {/* User Info */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium" data-testid="text-user-name">
                      {userName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unlocked{" "}
                      {unlockedAt
                        ? format(new Date(unlockedAt), "MMMM d, yyyy")
                        : "recently"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Start Your Journey
                </h3>
                <p className="text-muted-foreground">
                  Join 2Mins and unlock achievements by completing 2-minute
                  challenges across physical, mental, learning, finance,
                  relationship and extreme categories.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
