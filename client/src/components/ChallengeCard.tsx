import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoryConfig, difficultyConfig } from "@/lib/categories";
import type { Challenge } from "@shared/schema";
import { ArrowRight } from "lucide-react";

interface ChallengeCardProps {
  challenge: Challenge;
  onStart: () => void;
  featured?: boolean;
}

export function ChallengeCard({ challenge, onStart, featured = false }: ChallengeCardProps) {
  const category = categoryConfig[challenge.category as keyof typeof categoryConfig];
  const difficulty = difficultyConfig[challenge.difficulty as keyof typeof difficultyConfig];
  const Icon = category?.icon;

  return (
    <Card
      className={`border-card-border hover-elevate transition-all ${featured ? 'ring-2 ring-primary/20' : ''}`}
      data-testid={`card-challenge-${challenge.id}`}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center shrink-0">
                <Icon className="h-6 w-6 text-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl leading-tight" data-testid={`text-challenge-title-${challenge.id}`}>
                {challenge.title}
              </CardTitle>
              <CardDescription className="mt-1">{category?.label}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            <span className={difficulty.color}>{difficulty.label}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {challenge.description}
        </p>
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground" data-testid={`text-points-${challenge.id}`}>{challenge.points}</span>
              <span>points</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground" data-testid={`text-duration-${challenge.id}`}>2</span>
              <span>minutes</span>
            </div>
          </div>
          <Button onClick={onStart} data-testid={`button-start-challenge-${challenge.id}`}>
            Start Challenge
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
