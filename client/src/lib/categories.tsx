import { Activity, Brain, BookOpen, DollarSign, Heart } from "lucide-react";
import type { ChallengeCategory } from "@shared/schema";

export const categoryConfig: Record<
  ChallengeCategory,
  {
    label: string;
    icon: typeof Activity;
    description: string;
    gradient: string;
  }
> = {
  physical: {
    label: "Physical",
    icon: Activity,
    description: "Move your body and boost energy",
    gradient: "from-chart-2/20 to-chart-2/5",
  },
  mental: {
    label: "Mental",
    icon: Brain,
    description: "Clear your mind and find focus",
    gradient: "from-chart-5/20 to-chart-5/5",
  },
  learning: {
    label: "Learning",
    icon: BookOpen,
    description: "Discover something new",
    gradient: "from-chart-3/20 to-chart-3/5",
  },
  finance: {
    label: "Finance",
    icon: DollarSign,
    description: "Build better money habits",
    gradient: "from-chart-4/20 to-chart-4/5",
  },
  relationships: {
    label: "Relationships",
    icon: Heart,
    description: "Strengthen your connections",
    gradient: "from-primary/20 to-primary/5",
  },
};

export const difficultyConfig = {
  easy: {
    label: "Easy",
    points: 10,
    color: "text-chart-3",
  },
  medium: {
    label: "Medium",
    points: 20,
    color: "text-chart-4",
  },
  hard: {
    label: "Hard",
    points: 30,
    color: "text-chart-2",
  },
};
