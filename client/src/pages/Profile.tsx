import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import type { UserProgress } from "@shared/schema";
import {
  Trophy,
  Target,
  Flame,
  Star,
  Activity,
  Brain,
  BookOpen,
  DollarSign,
  Heart,
  Sword,
} from "lucide-react";

const categoryIcons = {
  physical: Activity,
  mental: Brain,
  learning: BookOpen,
  finance: DollarSign,
  relationships: Heart,
  extreme: Sword,
};

export default function Profile() {
  const { user } = useAuth();

  const { data: progress } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
  });

  if (!user) {
    return null;
  }

  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6" data-testid="text-profile-title">
        Profile
      </h1>

      <div className="space-y-6">
        {/* User Info Card */}
        <Card data-testid="card-user-info">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold" data-testid="text-user-name">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.username || "User"}
                </h2>
                <p
                  className="text-muted-foreground"
                  data-testid="text-user-email"
                >
                  {user.email}
                </p>
                {user.username && (
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="text-username"
                  >
                    @{user.username}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        {progress && (
          <Card data-testid="card-stats">
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
              <CardDescription>
                Your wellness journey at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2" data-testid="stat-challenges">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Challenges</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {progress.totalChallengesCompleted}
                  </p>
                </div>

                <div className="space-y-2" data-testid="stat-streak">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm">Current Streak</span>
                  </div>
                  <p className="text-2xl font-bold">{progress.currentStreak}</p>
                </div>

                <div className="space-y-2" data-testid="stat-longest-streak">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm">Longest Streak</span>
                  </div>
                  <p className="text-2xl font-bold">{progress.longestStreak}</p>
                </div>

                <div className="space-y-2" data-testid="stat-points">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">Total Points</span>
                  </div>
                  <p className="text-2xl font-bold">{progress.totalPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferences Card */}
        {user.onboardingCompleted === 1 && (
          <Card data-testid="card-preferences">
            <CardHeader>
              <CardTitle>Your Preferences</CardTitle>
              <CardDescription>
                Challenge categories and schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.preferredCategories &&
                user.preferredCategories.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Preferred Categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.preferredCategories.map((category) => {
                        const Icon =
                          categoryIcons[category as keyof typeof categoryIcons];
                        return (
                          <Badge
                            key={category}
                            variant="secondary"
                            data-testid={`badge-category-${category}`}
                          >
                            {Icon && <Icon className="h-3 w-3 mr-1" />}
                            {category}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

              <Separator />

              {user.preferredDays && user.preferredDays.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Challenge Days</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.preferredDays.map((day) => {
                      const dayNames = [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ];
                      return (
                        <Badge
                          key={day}
                          variant="outline"
                          data-testid={`badge-day-${day}`}
                        >
                          {dayNames[day]}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {user.hasMentalHealthConcerns === "yes" &&
                user.mentalHealthDetails && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium mb-2">
                        Mental Health Notes
                      </h3>
                      <p
                        className="text-sm text-muted-foreground"
                        data-testid="text-mental-health-details"
                      >
                        {user.mentalHealthDetails}
                      </p>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
