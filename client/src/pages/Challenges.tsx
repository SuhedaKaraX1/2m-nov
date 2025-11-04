import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Filter } from "lucide-react";
import type { Challenge, ChallengeCategory } from "@shared/schema";
import { challengeCategories } from "@shared/schema";
import { categoryConfig } from "@/lib/categories";

// category param güvenli çözüm
function parseCategoryParam(p: string | null): ChallengeCategory | null {
  if (!p) return null;
  return challengeCategories.includes(p as ChallengeCategory)
    ? (p as ChallengeCategory)
    : null;
}

export default function Challenges() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const categoryParam = parseCategoryParam(urlParams.get("category"));

  const [selectedCategory, setSelectedCategory] = useState<
    ChallengeCategory | "all"
  >(categoryParam || "all");

  // URL → state senkron
  useEffect(() => {
    setSelectedCategory(categoryParam || "all");
  }, [categoryParam]);

  // Veriyi çek: public endpoint (auth gerektirmez)
  const { data, isLoading, error } = useQuery<Challenge[]>({
    queryKey: ["challenges", selectedCategory],
    queryFn: async () => {
      const url =
        selectedCategory !== "all"
          ? `/api/challenges?category=${encodeURIComponent(selectedCategory)}`
          : `/api/challenges`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load challenges (${res.status})`);
      }
      return (await res.json()) as Challenge[];
    },
    staleTime: 60_000,
  });

  const challenges = data ?? [];

  // (Ek güvenlik) client-side filtre
  const filteredChallenges = useMemo(() => {
    if (selectedCategory === "all") return challenges;
    return challenges.filter((c) => c.category === selectedCategory);
  }, [challenges, selectedCategory]);

  const handleStartChallenge = (id: string) => {
    setLocation(`/challenge/${id}`);
  };

  const handleBack = () => {
    setLocation(`/`);
  };

  const goAll = () => {
    setSelectedCategory("all");
    setLocation(`/challenges`);
  };

  const goCat = (cat: ChallengeCategory) => {
    setSelectedCategory(cat);
    setLocation(`/challenges?category=${encodeURIComponent(cat)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1
            className="text-4xl font-bold text-foreground mb-3"
            data-testid="heading-page"
          >
            All Challenges
          </h1>
          <p
            className="text-muted-foreground text-lg"
            data-testid="text-page-description"
          >
            Choose a challenge and transform your next 2 minutes
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Filter by category
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer hover-elevate active-elevate-2"
              onClick={goAll}
              data-testid="filter-all"
            >
              All
            </Badge>
            {challengeCategories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => goCat(cat)}
                data-testid={`filter-${cat}`}
              >
                {categoryConfig[cat].label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Challenges Grid */}
        {isLoading ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-testid="loading-challenges"
          >
            Loading challenges...
          </div>
        ) : error ? (
          <div
            className="text-center py-12 text-destructive"
            data-testid="error-challenges"
          >
            Failed to load challenges.
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-challenges">
            <p className="text-muted-foreground">
              No challenges found in this category.
            </p>
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
