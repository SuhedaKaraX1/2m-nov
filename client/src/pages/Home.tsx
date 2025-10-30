import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { StatCard } from "@/components/StatCard";
import { CategoryCard } from "@/components/CategoryCard";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Target, Sparkles } from "lucide-react";
import type {
  Challenge,
  UserProgress,
  ChallengeCategory,
} from "@shared/schema";
import { challengeCategories } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();

  // Fetch user progress
  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress>(
    {
      queryKey: ["/api/progress"],
    },
  );

  // Fetch random featured challenge
  const { data: featuredChallenge, isLoading: challengeLoading } =
    useQuery<Challenge>({
      queryKey: ["/api/challenges/random"],
    });

  const handleStartChallenge = () => {
    if (featuredChallenge) {
      setLocation(`/challenge/${featuredChallenge.id}`);
    }
  };

  const handleCategoryClick = (category: ChallengeCategory) => {
    setLocation(`/challenges?category=${category}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                data-testid="logo"
              >
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1
                className="text-2xl font-bold text-foreground"
                data-testid="text-app-title"
              >
                2Mins
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Current Streak"
            value={
              progressLoading ? "..." : `${progress?.currentStreak || 0} days`
            }
            icon={Flame}
            description="Keep it going!"
          />
          <StatCard
            title="Total Points"
            value={progressLoading ? "..." : progress?.totalPoints || 0}
            icon={Trophy}
            description="Points earned"
          />
          <StatCard
            title="Completed"
            value={
              progressLoading ? "..." : progress?.totalChallengesCompleted || 0
            }
            icon={Target}
            description="Challenges done"
          />
        </div>

        {/* Featured Challenge */}
        {!challengeLoading && featuredChallenge && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-3xl font-bold text-foreground"
                data-testid="heading-featured"
              >
                Today's Challenge
              </h2>
              <Button
                variant="ghost"
                size="sm"
                asChild
                data-testid="link-all-challenges"
              >
                <Link href="/challenges">View All</Link>
              </Button>
            </div>
            <ChallengeCard
              challenge={featuredChallenge}
              onStart={handleStartChallenge}
              featured
            />
          </section>
        )}

        {/* Categories */}
        <section>
          <h2
            className="text-3xl font-bold text-foreground mb-6"
            data-testid="heading-categories"
          >
            Explore Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {challengeCategories.map((category) => (
              <CategoryCard
                key={category}
                category={category}
                onClick={() => handleCategoryClick(category)}
              />
            ))}
          </div>
        </section>

        {/* Empty State Motivation */}
        {!progressLoading && progress?.totalChallengesCompleted === 0 && (
          <div className="mt-12 text-center py-12" data-testid="empty-state">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Target className="h-10 w-10 text-primary" />
            </div>
            <h3
              className="text-xl font-semibold text-foreground mb-2"
              data-testid="text-empty-title"
            >
              Ready to Transform Your Day?
            </h3>
            <p
              className="text-muted-foreground max-w-md mx-auto"
              data-testid="text-empty-description"
            >
              Start your first 2-minute challenge and begin building habits that
              last. Every journey begins with a single step.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
