import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Filter } from "lucide-react";
import type { Challenge, ChallengeCategory } from "@shared/schema";
import { challengeCategories } from "@shared/schema";
import { categoryConfig } from "@/lib/categories";

export default function Challenges() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const categoryParam = urlParams.get("category") as ChallengeCategory | null;

  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | "all">(
    categoryParam || "all"
  );

  // Sync state with URL parameter when it changes
  useEffect(() => {
    setSelectedCategory(categoryParam || "all");
  }, [categoryParam]);

  // Fetch personalized challenges based on user preferences
  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges/personalized"],
  });

  const filteredChallenges = challenges?.filter(
    (c) => selectedCategory === "all" || c.category === selectedCategory
  ) || [];

  const handleStartChallenge = (id: string) => {
    setLocation(`/challenge/${id}`);
  };

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={handleBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-3" data-testid="heading-page">All Challenges</h1>
          <p className="text-muted-foreground text-lg" data-testid="text-page-description">
            Choose a challenge and transform your next 2 minutes
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter by category</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer hover-elevate active-elevate-2"
              onClick={() => {
                setSelectedCategory("all");
                setLocation("/challenges");
              }}
              data-testid="filter-all"
            >
              All
            </Badge>
            {challengeCategories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => {
                  setSelectedCategory(cat);
                  setLocation(`/challenges?category=${cat}`);
                }}
                data-testid={`filter-${cat}`}
              >
                {categoryConfig[cat].label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Challenges Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground" data-testid="loading-challenges">
            Loading challenges...
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-challenges">
            <p className="text-muted-foreground">No challenges found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onStart={() => handleStartChallenge(challenge.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
