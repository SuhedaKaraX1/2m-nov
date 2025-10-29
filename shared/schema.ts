import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (Required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (Required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Challenge categories
export const challengeCategories = [
  "physical",
  "mental",
  "learning",
  "finance",
  "relationships"
] as const;

export type ChallengeCategory = typeof challengeCategories[number];

export const challengeDifficulties = ["easy", "medium", "hard"] as const;
export type ChallengeDifficulty = typeof challengeDifficulties[number];

// Challenges table - includes both system and user-created challenges
export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  difficulty: text("difficulty").notNull(),
  points: integer("points").notNull().default(10),
  instructions: text("instructions").notNull(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }), // null = system challenge, userId = user-created
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

// User progress tracking - one row per user
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }), // link to users table
  totalChallengesCompleted: integer("total_challenges_completed").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  lastCompletedDate: text("last_completed_date"),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
});

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

// Challenge history - one row per completion
export const challengeHistory = pgTable("challenge_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // link to users table
  challengeId: varchar("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  completedAt: text("completed_at").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  pointsEarned: integer("points_earned").notNull(),
});

export const insertChallengeHistorySchema = createInsertSchema(challengeHistory).omit({
  id: true,
});

export type InsertChallengeHistory = z.infer<typeof insertChallengeHistorySchema>;
export type ChallengeHistory = typeof challengeHistory.$inferSelect;

// Challenge with completion info (for history display)
export type ChallengeWithDetails = Challenge & {
  completedAt?: string;
  timeSpent?: number;
  pointsEarned?: number;
};

// Achievement tiers for visual distinction
export const achievementTiers = ["bronze", "silver", "gold", "platinum"] as const;
export type AchievementTier = typeof achievementTiers[number];

// Achievements table - all available achievements
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // lucide-react icon name or emoji
  category: text("category").notNull(), // "completion", "streak", "points", "category_master"
  requirementType: text("requirement_type").notNull(), // "challenges_completed", "streak_days", "total_points", etc.
  requirementValue: integer("requirement_value").notNull(), // threshold value
  requirementMeta: jsonb("requirement_meta"), // optional metadata (e.g., {category: "physical"})
  tier: text("tier").notNull(), // "bronze", "silver", "gold", "platinum"
  sortOrder: integer("sort_order").notNull().default(0), // for display ordering
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// User achievements - tracks which achievements users have unlocked
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").default(0), // current progress (used before unlocking)
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

// Achievement with unlock status for a user
export type AchievementWithProgress = Achievement & {
  unlocked: boolean;
  unlockedAt?: string | null;
  progress: number;
  progressPercent: number;
};

// Friendship status types
export const friendshipStatuses = ["pending", "accepted", "declined"] as const;
export type FriendshipStatus = typeof friendshipStatuses[number];

// Friendships table - tracks friend relationships
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "declined"
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => [
  index("idx_friendships_requester").on(table.requesterId),
  index("idx_friendships_receiver").on(table.receiverId),
]);

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

// Friend with user details for display
export type FriendWithDetails = {
  friendshipId: string;
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  status: FriendshipStatus;
  createdAt: Date | null;
};
