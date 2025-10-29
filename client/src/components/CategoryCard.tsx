import { Card } from "@/components/ui/card";
import { categoryConfig } from "@/lib/categories";
import type { ChallengeCategory } from "@shared/schema";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  category: ChallengeCategory;
  onClick: () => void;
  challengeCount?: number;
}

export function CategoryCard({ category, onClick, challengeCount }: CategoryCardProps) {
  const config = categoryConfig[category];
  const Icon: LucideIcon = config.icon;

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all border-card-border bg-gradient-to-br ${config.gradient}`}
      onClick={onClick}
      data-testid={`card-category-${category}`}
    >
      <div className="p-6 flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-card/50 flex items-center justify-center">
          <Icon className="h-8 w-8 text-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">{config.label}</h3>
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        </div>
        {challengeCount !== undefined && (
          <div className="text-xs text-muted-foreground">
            {challengeCount} {challengeCount === 1 ? "challenge" : "challenges"}
          </div>
        )}
      </div>
    </Card>
  );
}
