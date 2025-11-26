export const challengeCategories = [
  "physical",
  "mental",
  "learning",
  "finance",
  "relationships",
  "extreme",
] as const;

export type ChallengeCategory = (typeof challengeCategories)[number];

export const challengeDifficulties = ["easy", "medium", "hard"] as const;
export type ChallengeDifficulty = (typeof challengeDifficulties)[number];

export interface User {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  preferredCategories: ChallengeCategory[] | null;
  hasMentalHealthConcerns: string | null;
  mentalHealthDetails: string | null;
  preferredDays: number[] | null;
  challengeScheduleTimes: { start: string; end: string }[] | null;
  enableNotifications: number | null;
  onboardingCompleted: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  difficulty: string;
  points: number;
  instructions: string;
  createdBy: string | null;
  createdAt: string | null;
}

export interface UserProgress {
  id: string;
  userId: string;
  totalChallengesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  lastCompletedDate: string | null;
}

export interface ChallengeHistory {
  id: string;
  challengeId: string;
  completedAt: string;
  timeSpent: number;
  pointsEarned: number;
}

export interface ChallengeWithDetails extends Challenge {
  completedAt?: string;
  timeSpent?: number;
  pointsEarned?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirementType: string;
  requirementValue: number;
  requirementMeta: Record<string, any> | null;
  tier: string;
  sortOrder: number;
}

export interface AchievementWithProgress extends Achievement {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  progressPercent: number;
  userAchievementId: string | null;
}

export const categoryConfig: Record<ChallengeCategory, { label: string; color: string; icon: string }> = {
  physical: { label: "Physical", color: "#ef4444", icon: "activity" },
  mental: { label: "Mental", color: "#8b5cf6", icon: "brain" },
  learning: { label: "Learning", color: "#3b82f6", icon: "book-open" },
  finance: { label: "Finance", color: "#22c55e", icon: "dollar-sign" },
  relationships: { label: "Relationships", color: "#ec4899", icon: "heart" },
  extreme: { label: "Extreme", color: "#f59e0b", icon: "zap" },
};

export const difficultyConfig: Record<ChallengeDifficulty, { label: string; color: string }> = {
  easy: { label: "Easy", color: "#22c55e" },
  medium: { label: "Medium", color: "#f59e0b" },
  hard: { label: "Hard", color: "#ef4444" },
};
