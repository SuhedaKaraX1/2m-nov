import {
  type Challenge,
  type InsertChallenge,
  type UserProgress,
  type InsertUserProgress,
  type ChallengeHistory,
  type InsertChallengeHistory,
  type CreateChallengeHistory,
  type ChallengeWithDetails,
  type User,
  type UpsertUser,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type AchievementWithProgress,
  type Friendship,
  type InsertFriendship,
  type FriendWithDetails,
  type ScheduledChallenge,
  type InsertScheduledChallenge,
  challenges,
  userProgress,
  challengeHistory,
  users,
  achievements,
  userAchievements,
  friendships,
  scheduledChallenges,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, or, inArray, gte } from "drizzle-orm";

export interface IStorage {
  // User operations (Required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  findUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined>;
  createLocalUser(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User>;
  updateUserPreferences(userId: string, preferences: {
    preferredCategories?: string[];
    hasMentalHealthConcerns?: string;
    mentalHealthDetails?: string;
    preferredDays?: number[];
    challengeScheduleTimes?: { start: string; end: string }[];
    enableNotifications?: number;
    onboardingCompleted?: number;
  }): Promise<User>;

  // Challenges
  getAllChallenges(): Promise<Challenge[]>;
  getChallengeById(id: string): Promise<Challenge | undefined>;
  getChallengesByCategory(category: string): Promise<Challenge[]>;
  getRandomChallenge(): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge, userId: string): Promise<Challenge>;
  updateChallenge(id: string, challenge: Partial<InsertChallenge>, userId: string): Promise<Challenge | undefined>;
  deleteChallenge(id: string, userId: string): Promise<boolean>;
  getUserChallenges(userId: string): Promise<Challenge[]>;

  // User Progress (user-specific)
  getUserProgress(userId: string): Promise<UserProgress>;
  updateUserProgress(userId: string, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  incrementStreak(userId: string): Promise<void>;
  resetStreak(userId: string): Promise<void>;
  addPoints(userId: string, points: number): Promise<void>;

  // Challenge History (user-specific)
  getAllHistory(userId: string): Promise<ChallengeWithDetails[]>;
  addHistoryEntry(userId: string, entry: CreateChallengeHistory): Promise<ChallengeHistory>;
  getHistoryByDate(userId: string, date: string): Promise<ChallengeHistory[]>;

  // Achievements
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<AchievementWithProgress[]>;
  checkAndUnlockAchievements(userId: string): Promise<Achievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement>;
  getAchievementShare(userAchievementId: string): Promise<{
    achievement: Achievement;
    user: Pick<User, 'firstName' | 'lastName' | 'profileImageUrl'>;
    unlockedAt: Date | null;
  } | null>;

  // Analytics
  getDailyStats(userId: string, days: number): Promise<Array<{ date: string; count: number; points: number }>>;
  getCategoryDistribution(userId: string): Promise<Array<{ category: string; count: number; percentage: number }>>;
  getWeeklyTrend(userId: string): Promise<Array<{ week: string; count: number; points: number }>>;
  getMonthlyTrend(userId: string): Promise<Array<{ month: string; count: number; points: number }>>;

  // Friends
  sendFriendRequest(requesterId: string, receiverEmail: string): Promise<Friendship | null>;
  acceptFriendRequest(friendshipId: string, userId: string): Promise<Friendship | null>;
  declineFriendRequest(friendshipId: string, userId: string): Promise<boolean>;
  getFriends(userId: string): Promise<FriendWithDetails[]>;
  getPendingRequests(userId: string): Promise<FriendWithDetails[]>;
  unfriend(friendshipId: string, userId: string): Promise<boolean>;
  getFriendActivity(userId: string, limit?: number): Promise<Array<{
    userId: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    challengeTitle: string;
    completedAt: string;
    pointsEarned: number;
  }>>;

  // Scheduled Challenges
  getScheduledChallenges(userId: string): Promise<ScheduledChallenge[]>;
  getNextScheduledChallenge(userId: string): Promise<(ScheduledChallenge & { challenge: Challenge }) | null>;
  createScheduledChallenge(userId: string, data: InsertScheduledChallenge): Promise<ScheduledChallenge>;
  updateScheduledChallenge(id: string, userId: string, data: Partial<ScheduledChallenge>): Promise<ScheduledChallenge>;
  postponeScheduledChallenge(id: string, userId: string): Promise<ScheduledChallenge>;
  cancelScheduledChallenge(id: string, userId: string): Promise<boolean>;
  completeScheduledChallenge(id: string, userId: string, status: 'success' | 'failed'): Promise<ChallengeHistory>;
  deleteScheduledChallenge(id: string, userId: string): Promise<boolean>;
  generateScheduledChallengesForUser(userId: string, daysAhead?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (Required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async findUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, emailOrUsername),
          eq(users.username, emailOrUsername)
        )
      );
    return user;
  }

  async createLocalUser(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        onboardingCompleted: 0,
      })
      .returning();
    return user;
  }

  async updateUserPreferences(userId: string, preferences: {
    preferredCategories?: string[];
    hasMentalHealthConcerns?: string;
    mentalHealthDetails?: string;
    preferredDays?: number[];
    onboardingCompleted?: number;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        preferredCategories: preferences.preferredCategories as any,
        hasMentalHealthConcerns: preferences.hasMentalHealthConcerns,
        mentalHealthDetails: preferences.mentalHealthDetails,
        preferredDays: preferences.preferredDays as any,
        onboardingCompleted: preferences.onboardingCompleted,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Challenges
  async getAllChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges);
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async getChallengesByCategory(category: string): Promise<Challenge[]> {
    return await db.select().from(challenges).where(eq(challenges.category, category));
  }

  async getRandomChallenge(): Promise<Challenge | undefined> {
    const [challenge] = await db
      .select()
      .from(challenges)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return challenge;
  }

  async createChallenge(insertChallenge: InsertChallenge, userId: string): Promise<Challenge> {
    const [challenge] = await db.insert(challenges).values({
      ...insertChallenge,
      createdBy: userId,
    }).returning();
    return challenge;
  }

  async updateChallenge(id: string, updates: Partial<InsertChallenge>, userId: string): Promise<Challenge | undefined> {
    // Check if challenge exists and was created by this user
    const existing = await this.getChallengeById(id);
    if (!existing || existing.createdBy !== userId) {
      return undefined;
    }

    const [challenge] = await db
      .update(challenges)
      .set(updates)
      .where(eq(challenges.id, id))
      .returning();
    return challenge;
  }

  async deleteChallenge(id: string, userId: string): Promise<boolean> {
    // Check if challenge exists and was created by this user
    const existing = await this.getChallengeById(id);
    if (!existing || existing.createdBy !== userId) {
      return false;
    }

    // System challenges (createdBy is null) cannot be deleted
    if (existing.createdBy === null) {
      return false;
    }

    await db.delete(challenges).where(eq(challenges.id, id));
    return true;
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    return await db.select().from(challenges).where(eq(challenges.createdBy, userId));
  }

  // User Progress
  async getUserProgress(userId: string): Promise<UserProgress> {
    let [progress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    // Create initial progress if it doesn't exist
    if (!progress) {
      [progress] = await db
        .insert(userProgress)
        .values({
          userId,
          totalChallengesCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalPoints: 0,
          lastCompletedDate: null,
        })
        .returning();
    }

    return progress;
  }

  async updateUserProgress(userId: string, updates: Partial<InsertUserProgress>): Promise<UserProgress> {
    const [progress] = await db
      .update(userProgress)
      .set(updates)
      .where(eq(userProgress.userId, userId))
      .returning();
    return progress;
  }

  async incrementStreak(userId: string): Promise<void> {
    const progress = await this.getUserProgress(userId);
    const newStreak = progress.currentStreak + 1;
    const newLongest = Math.max(newStreak, progress.longestStreak);

    await db
      .update(userProgress)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
      })
      .where(eq(userProgress.userId, userId));
  }

  async resetStreak(userId: string): Promise<void> {
    await db
      .update(userProgress)
      .set({ currentStreak: 0 })
      .where(eq(userProgress.userId, userId));
  }

  async addPoints(userId: string, points: number): Promise<void> {
    const progress = await this.getUserProgress(userId);
    await db
      .update(userProgress)
      .set({ totalPoints: progress.totalPoints + points })
      .where(eq(userProgress.userId, userId));
  }

  // Challenge History
  async getAllHistory(userId: string): Promise<ChallengeWithDetails[]> {
    const history = await db
      .select()
      .from(challengeHistory)
      .where(eq(challengeHistory.userId, userId))
      .orderBy(desc(challengeHistory.completedAt));

    // Enrich with challenge details
    const enriched: ChallengeWithDetails[] = [];
    for (const h of history) {
      const challenge = await this.getChallengeById(h.challengeId);
      if (challenge) {
        enriched.push({
          ...challenge,
          completedAt: h.completedAt,
          timeSpent: h.timeSpent,
          pointsEarned: h.pointsEarned,
        });
      }
    }

    return enriched;
  }

  async addHistoryEntry(userId: string, entry: InsertChallengeHistory): Promise<ChallengeHistory> {
    const [historyEntry] = await db
      .insert(challengeHistory)
      .values({ ...entry, userId })
      .returning();

    const progress = await this.getUserProgress(userId);

    // Update total challenges and points
    const newTotal = progress.totalChallengesCompleted + 1;
    const newPoints = progress.totalPoints + entry.pointsEarned;

    // Update streak
    const today = new Date().toISOString().split("T")[0];
    const lastDate = progress.lastCompletedDate;

    let newStreak = progress.currentStreak;
    let newLongest = progress.longestStreak;

    if (!lastDate) {
      // First challenge ever
      newStreak = 1;
      newLongest = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastDate === today) {
        // Already completed one today, streak unchanged
      } else if (lastDate === yesterdayStr) {
        // Consecutive day
        newStreak = progress.currentStreak + 1;
        newLongest = Math.max(newStreak, progress.longestStreak);
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    await db
      .update(userProgress)
      .set({
        totalChallengesCompleted: newTotal,
        totalPoints: newPoints,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCompletedDate: today,
      })
      .where(eq(userProgress.userId, userId));

    return historyEntry;
  }

  async getHistoryByDate(userId: string, date: string): Promise<ChallengeHistory[]> {
    return await db
      .select()
      .from(challengeHistory)
      .where(
        and(
          eq(challengeHistory.userId, userId),
          sql`${challengeHistory.completedAt} LIKE ${date + '%'}`
        )
      );
  }

  // Achievements
  async getAllAchievements(): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .orderBy(achievements.sortOrder);
  }

  async getUserAchievements(userId: string): Promise<AchievementWithProgress[]> {
    // Get all achievements
    const allAchievements = await this.getAllAchievements();
    
    // Get user's unlocked achievements
    const unlockedAchievements = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    // Get user progress for calculating progress on locked achievements
    const progress = await this.getUserProgress(userId);
    
    // Get category-specific progress
    const categoryProgress = await db
      .select({
        category: challenges.category,
        count: sql<number>`COUNT(*)`,
      })
      .from(challengeHistory)
      .innerJoin(challenges, eq(challengeHistory.challengeId, challenges.id))
      .where(eq(challengeHistory.userId, userId))
      .groupBy(challenges.category);

    const categoryMap = new Map(categoryProgress.map(c => [c.category, Number(c.count)]));

    // Combine achievement data with unlock status and progress
    return allAchievements.map(achievement => {
      const unlocked = unlockedAchievements.find(ua => ua.achievementId === achievement.id);
      
      let currentProgress = 0;
      let requirementValue = achievement.requirementValue;

      // Calculate progress based on requirement type
      switch (achievement.requirementType) {
        case "challenges_completed":
          currentProgress = progress.totalChallengesCompleted;
          break;
        case "streak_days":
          currentProgress = progress.currentStreak;
          break;
        case "total_points":
          currentProgress = progress.totalPoints;
          break;
        case "category_challenges":
          const category = (achievement.requirementMeta as { category?: string })?.category;
          if (category) {
            currentProgress = categoryMap.get(category) || 0;
          }
          break;
        case "all_categories":
          // Check if all categories have at least requirementValue completions
          const allCategoriesMet = ["physical", "mental", "learning", "finance", "relationships"]
            .every(cat => (categoryMap.get(cat) || 0) >= requirementValue);
          currentProgress = allCategoriesMet ? requirementValue : 0;
          break;
      }

      return {
        ...achievement,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt?.toISOString() || null,
        progress: currentProgress,
        progressPercent: Math.min(100, Math.floor((currentProgress / requirementValue) * 100)),
        userAchievementId: unlocked?.id || null, // Include for sharing
      };
    });
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    // Check if already unlocked
    const existing = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );

    if (existing.length > 0) {
      return existing[0];
    }

    // Unlock the achievement
    const [unlocked] = await db
      .insert(userAchievements)
      .values({
        userId,
        achievementId,
      })
      .returning();

    return unlocked;
  }

  async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    const userAchievementsWithProgress = await this.getUserAchievements(userId);
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of userAchievementsWithProgress) {
      // Skip if already unlocked
      if (achievement.unlocked) {
        continue;
      }

      // Check if requirement is met
      if (achievement.progress >= achievement.requirementValue) {
        await this.unlockAchievement(userId, achievement.id);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  async getAchievementShare(userAchievementId: string): Promise<{
    achievement: Achievement;
    user: Pick<User, 'firstName' | 'lastName' | 'profileImageUrl'>;
    unlockedAt: Date | null;
  } | null> {
    // Get the user achievement with joined data
    const [result] = await db
      .select({
        achievement: achievements,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userProfileImageUrl: users.profileImageUrl,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(achievements.id, userAchievements.achievementId))
      .innerJoin(users, eq(users.id, userAchievements.userId))
      .where(eq(userAchievements.id, userAchievementId));

    if (!result) {
      return null;
    }

    return {
      achievement: result.achievement,
      user: {
        firstName: result.userFirstName,
        lastName: result.userLastName,
        profileImageUrl: result.userProfileImageUrl,
      },
      unlockedAt: result.unlockedAt,
    };
  }

  // Analytics
  async getDailyStats(userId: string, days: number): Promise<Array<{ date: string; count: number; points: number }>> {
    // Get the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query history for the date range
    const history = await db
      .select({
        date: sql<string>`DATE(${challengeHistory.completedAt}::timestamptz)`,
        count: sql<number>`COUNT(*)`,
        points: sql<number>`SUM(${challengeHistory.pointsEarned})`,
      })
      .from(challengeHistory)
      .where(
        and(
          eq(challengeHistory.userId, userId),
          sql`${challengeHistory.completedAt}::timestamptz >= ${startDate.toISOString()}::timestamptz`
        )
      )
      .groupBy(sql`DATE(${challengeHistory.completedAt}::timestamptz)`)
      .orderBy(sql`DATE(${challengeHistory.completedAt}::timestamptz)`);

    // Fill in missing dates with zero values
    const result: Array<{ date: string; count: number; points: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const existing = history.find(h => h.date === dateStr);
      result.push({
        date: dateStr,
        count: existing ? Number(existing.count) : 0,
        points: existing ? Number(existing.points) : 0,
      });
    }

    return result;
  }

  async getCategoryDistribution(userId: string): Promise<Array<{ category: string; count: number; percentage: number }>> {
    const distribution = await db
      .select({
        category: challenges.category,
        count: sql<number>`COUNT(*)`,
      })
      .from(challengeHistory)
      .innerJoin(challenges, eq(challengeHistory.challengeId, challenges.id))
      .where(eq(challengeHistory.userId, userId))
      .groupBy(challenges.category);

    const total = distribution.reduce((sum, item) => sum + Number(item.count), 0);

    return distribution.map(item => ({
      category: item.category,
      count: Number(item.count),
      percentage: total > 0 ? Math.round((Number(item.count) / total) * 100) : 0,
    }));
  }

  async getWeeklyTrend(userId: string): Promise<Array<{ week: string; count: number; points: number }>> {
    // Get last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks = 84 days
    
    const weeks = await db
      .select({
        week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${challengeHistory.completedAt}::timestamptz), 'YYYY-MM-DD')`,
        count: sql<number>`COUNT(*)`,
        points: sql<number>`SUM(${challengeHistory.pointsEarned})`,
      })
      .from(challengeHistory)
      .where(
        and(
          eq(challengeHistory.userId, userId),
          sql`${challengeHistory.completedAt}::timestamptz >= ${twelveWeeksAgo.toISOString()}::timestamptz`
        )
      )
      .groupBy(sql`DATE_TRUNC('week', ${challengeHistory.completedAt}::timestamptz)`)
      .orderBy(sql`DATE_TRUNC('week', ${challengeHistory.completedAt}::timestamptz)`);

    return weeks.map(w => ({
      week: w.week,
      count: Number(w.count),
      points: Number(w.points),
    }));
  }

  async getMonthlyTrend(userId: string): Promise<Array<{ month: string; count: number; points: number }>> {
    // Get last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const months = await db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${challengeHistory.completedAt}::timestamptz), 'YYYY-MM')`,
        count: sql<number>`COUNT(*)`,
        points: sql<number>`SUM(${challengeHistory.pointsEarned})`,
      })
      .from(challengeHistory)
      .where(
        and(
          eq(challengeHistory.userId, userId),
          sql`${challengeHistory.completedAt}::timestamptz >= ${twelveMonthsAgo.toISOString()}::timestamptz`
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${challengeHistory.completedAt}::timestamptz)`)
      .orderBy(sql`DATE_TRUNC('month', ${challengeHistory.completedAt}::timestamptz)`);

    return months.map(m => ({
      month: m.month,
      count: Number(m.count),
      points: Number(m.points),
    }));
  }

  // Friends operations
  async sendFriendRequest(requesterId: string, receiverEmail: string): Promise<Friendship | null> {
    // Find receiver by email
    const [receiver] = await db.select().from(users).where(eq(users.email, receiverEmail));
    if (!receiver) {
      return null; // Receiver not found
    }

    // Cannot send request to yourself
    if (receiver.id === requesterId) {
      return null;
    }

    // Check if friendship already exists (any status)
    const [existing] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, requesterId), eq(friendships.receiverId, receiver.id)),
          and(eq(friendships.requesterId, receiver.id), eq(friendships.receiverId, requesterId))
        )
      );

    if (existing) {
      return null; // Friendship already exists
    }

    // Create friend request
    const [friendship] = await db
      .insert(friendships)
      .values({
        requesterId,
        receiverId: receiver.id,
        status: "pending",
      })
      .returning();

    return friendship;
  }

  async acceptFriendRequest(friendshipId: string, userId: string): Promise<Friendship | null> {
    // Find the friendship and verify the user is the receiver
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(and(eq(friendships.id, friendshipId), eq(friendships.receiverId, userId)));

    if (!friendship || friendship.status !== "pending") {
      return null;
    }

    // Update status to accepted
    const [updated] = await db
      .update(friendships)
      .set({
        status: "accepted",
        respondedAt: new Date(),
      })
      .where(eq(friendships.id, friendshipId))
      .returning();

    return updated;
  }

  async declineFriendRequest(friendshipId: string, userId: string): Promise<boolean> {
    // Find the friendship and verify the user is the receiver
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(and(eq(friendships.id, friendshipId), eq(friendships.receiverId, userId)));

    if (!friendship || friendship.status !== "pending") {
      return false;
    }

    // Update status to declined
    await db
      .update(friendships)
      .set({
        status: "declined",
        respondedAt: new Date(),
      })
      .where(eq(friendships.id, friendshipId));

    return true;
  }

  async getFriends(userId: string): Promise<FriendWithDetails[]> {
    // Get all accepted friendships where user is either requester or receiver
    const allFriendships = await db
      .select({
        friendshipId: friendships.id,
        requesterId: friendships.requesterId,
        receiverId: friendships.receiverId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        requesterEmail: users.email,
        requesterFirstName: users.firstName,
        requesterLastName: users.lastName,
        requesterProfileImageUrl: users.profileImageUrl,
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.requesterId))
      .where(
        and(
          or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId)),
          eq(friendships.status, "accepted")
        )
      );

    const receiverFriendships = await db
      .select({
        friendshipId: friendships.id,
        requesterId: friendships.requesterId,
        receiverId: friendships.receiverId,
        status: friendships.status,
        createdAt: friendships.createdAt,
        receiverEmail: users.email,
        receiverFirstName: users.firstName,
        receiverLastName: users.lastName,
        receiverProfileImageUrl: users.profileImageUrl,
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.receiverId))
      .where(
        and(
          or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId)),
          eq(friendships.status, "accepted")
        )
      );

    // Combine and format results
    const friends: FriendWithDetails[] = [];

    for (const f of allFriendships) {
      if (f.receiverId === userId) {
        friends.push({
          friendshipId: f.friendshipId,
          userId: f.requesterId,
          email: f.requesterEmail,
          firstName: f.requesterFirstName,
          lastName: f.requesterLastName,
          profileImageUrl: f.requesterProfileImageUrl,
          status: f.status as any,
          createdAt: f.createdAt,
        });
      }
    }

    for (const f of receiverFriendships) {
      if (f.requesterId === userId) {
        friends.push({
          friendshipId: f.friendshipId,
          userId: f.receiverId,
          email: f.receiverEmail,
          firstName: f.receiverFirstName,
          lastName: f.receiverLastName,
          profileImageUrl: f.receiverProfileImageUrl,
          status: f.status as any,
          createdAt: f.createdAt,
        });
      }
    }

    return friends;
  }

  async getPendingRequests(userId: string): Promise<FriendWithDetails[]> {
    // Get incoming pending requests (where user is receiver)
    const incoming = await db
      .select({
        friendshipId: friendships.id,
        userId: friendships.requesterId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        status: friendships.status,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.requesterId))
      .where(and(eq(friendships.receiverId, userId), eq(friendships.status, "pending")));

    return incoming.map(f => ({
      friendshipId: f.friendshipId,
      userId: f.userId,
      email: f.email,
      firstName: f.firstName,
      lastName: f.lastName,
      profileImageUrl: f.profileImageUrl,
      status: f.status as any,
      createdAt: f.createdAt,
    }));
  }

  async unfriend(friendshipId: string, userId: string): Promise<boolean> {
    // Verify the user is part of this friendship
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.id, friendshipId),
          or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId))
        )
      );

    if (!friendship) {
      return false;
    }

    // Delete the friendship
    await db.delete(friendships).where(eq(friendships.id, friendshipId));
    return true;
  }

  async getFriendActivity(
    userId: string,
    limit: number = 20
  ): Promise<
    Array<{
      userId: string;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      challengeTitle: string;
      completedAt: string;
      pointsEarned: number;
    }>
  > {
    // Get list of friend user IDs
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(f => f.userId);

    if (friendIds.length === 0) {
      return [];
    }

    // Get recent challenge completions from friends
    const activity = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        challengeTitle: challenges.title,
        completedAt: challengeHistory.completedAt,
        pointsEarned: challengeHistory.pointsEarned,
      })
      .from(challengeHistory)
      .innerJoin(users, eq(users.id, challengeHistory.userId))
      .innerJoin(challenges, eq(challenges.id, challengeHistory.challengeId))
      .where(inArray(challengeHistory.userId, friendIds))
      .orderBy(desc(challengeHistory.completedAt))
      .limit(limit);

    return activity;
  }

  // Scheduled Challenges
  async getScheduledChallenges(userId: string): Promise<ScheduledChallenge[]> {
    const now = new Date();
    const result = await db
      .select()
      .from(scheduledChallenges)
      .where(
        and(
          eq(scheduledChallenges.userId, userId),
          or(
            eq(scheduledChallenges.status, "pending"),
            eq(scheduledChallenges.status, "snoozed")
          )
        )
      )
      .orderBy(scheduledChallenges.scheduledTime);
    return result || [];
  }

  async createScheduledChallenge(userId: string, data: InsertScheduledChallenge): Promise<ScheduledChallenge> {
    const [scheduled] = await db
      .insert(scheduledChallenges)
      .values({
        ...data,
        userId,
      })
      .returning();
    return scheduled;
  }

  async updateScheduledChallenge(id: string, userId: string, data: Partial<InsertScheduledChallenge>): Promise<ScheduledChallenge> {
    const [updated] = await db
      .update(scheduledChallenges)
      .set(data)
      .where(
        and(
          eq(scheduledChallenges.id, id),
          eq(scheduledChallenges.userId, userId)
        )
      )
      .returning();
    if (!updated) {
      throw new Error("Scheduled challenge not found or unauthorized");
    }
    return updated;
  }

  async deleteScheduledChallenge(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(scheduledChallenges)
      .where(
        and(
          eq(scheduledChallenges.id, id),
          eq(scheduledChallenges.userId, userId)
        )
      );
    return true;
  }

  async getNextScheduledChallenge(userId: string): Promise<(ScheduledChallenge & { challenge: Challenge }) | null> {
    throw new Error("Not implemented in DatabaseStorage - use SupabaseStorage");
  }

  async postponeScheduledChallenge(id: string, userId: string): Promise<ScheduledChallenge> {
    throw new Error("Not implemented in DatabaseStorage - use SupabaseStorage");
  }

  async cancelScheduledChallenge(id: string, userId: string): Promise<boolean> {
    throw new Error("Not implemented in DatabaseStorage - use SupabaseStorage");
  }

  async completeScheduledChallenge(id: string, userId: string, status: 'success' | 'failed'): Promise<ChallengeHistory> {
    throw new Error("Not implemented in DatabaseStorage - use SupabaseStorage");
  }

  async generateScheduledChallengesForUser(userId: string, daysAhead: number = 1): Promise<void> {
    throw new Error("Not implemented in DatabaseStorage - use SupabaseStorage");
  }
}

// Seed challenges data
export const challengeSeedData: InsertChallenge[] = [
  // Physical Challenges - Easy
  {
    title: "Desk Stretch Series",
    description: "Relieve tension with simple stretches you can do at your desk",
    category: "physical",
    subcategory: "stretching",
    difficulty: "easy",
    points: 10,
    instructions: "Stand up and perform neck rolls, shoulder shrugs, and seated twists. Hold each stretch for 10-15 seconds. Focus on deep breathing throughout.",
  },
  {
    title: "Two-Minute Walk",
    description: "Get your blood flowing with a quick walking break",
    category: "physical",
    subcategory: "cardio",
    difficulty: "easy",
    points: 10,
    instructions: "Walk around your space at a comfortable pace. If possible, go outside or to a different room. Swing your arms naturally and breathe deeply.",
  },
  {
    title: "Wall Push-Ups",
    description: "Build upper body strength with wall-assisted push-ups",
    category: "physical",
    subcategory: "strength",
    difficulty: "easy",
    points: 10,
    instructions: "Stand arm's length from a wall. Place hands on wall at shoulder height. Do slow, controlled push-ups for 2 minutes. Rest as needed.",
  },

  // Physical Challenges - Medium
  {
    title: "Plank Challenge",
    description: "Build core strength with a timed plank hold",
    category: "physical",
    subcategory: "strength",
    difficulty: "medium",
    points: 20,
    instructions: "Hold a forearm plank with proper form. Keep your body in a straight line. Start with 30 seconds, rest 15 seconds, repeat. Focus on engaging your core.",
  },
  {
    title: "Stair Climbing",
    description: "Boost your cardio with quick stair intervals",
    category: "physical",
    subcategory: "cardio",
    difficulty: "medium",
    points: 20,
    instructions: "Find a staircase and walk up and down at a moderate pace for 2 minutes. Use the railing for support if needed. Maintain steady breathing.",
  },
  {
    title: "Yoga Flow",
    description: "Flow through basic yoga poses for flexibility and balance",
    category: "physical",
    subcategory: "flexibility",
    difficulty: "medium",
    points: 20,
    instructions: "Move through: Mountain Pose → Forward Fold → Downward Dog → Cobra → Child's Pose. Repeat the sequence slowly, holding each pose for 15-20 seconds.",
  },

  // Physical Challenges - Hard
  {
    title: "High-Intensity Cardio Burst",
    description: "Push your limits with jumping jacks and high knees",
    category: "physical",
    subcategory: "cardio",
    difficulty: "hard",
    points: 30,
    instructions: "Alternate 20 seconds of jumping jacks with 20 seconds of high knees. Repeat for 2 minutes. Go at your maximum safe intensity.",
  },
  {
    title: "Advanced Core Circuit",
    description: "Challenge your core with dynamic exercises",
    category: "physical",
    subcategory: "strength",
    difficulty: "hard",
    points: 30,
    instructions: "Do 30 seconds each: bicycle crunches, Russian twists, leg raises, plank. Rest 15 seconds between exercises. Repeat the circuit.",
  },

  // Mental Challenges - Easy
  {
    title: "Mindful Breathing",
    description: "Center yourself with focused breathing exercises",
    category: "mental",
    subcategory: "meditation",
    difficulty: "easy",
    points: 10,
    instructions: "Sit comfortably. Breathe in for 4 counts, hold for 4, exhale for 4. Focus only on your breath. When your mind wanders, gently return to counting.",
  },
  {
    title: "Gratitude Reflection",
    description: "Boost positivity by listing things you're grateful for",
    category: "mental",
    subcategory: "mindfulness",
    difficulty: "easy",
    points: 10,
    instructions: "Write down or mentally list 5-10 things you're grateful for today. They can be big or small. Notice how you feel as you think about each one.",
  },
  {
    title: "Observation Exercise",
    description: "Practice presence by noticing your surroundings",
    category: "mental",
    subcategory: "awareness",
    difficulty: "easy",
    points: 10,
    instructions: "Look around and name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. Take your time with each sense.",
  },

  // Mental Challenges - Medium
  {
    title: "Worry Time",
    description: "Contain anxiety by scheduling dedicated worry time",
    category: "mental",
    subcategory: "anxiety-management",
    difficulty: "medium",
    points: 20,
    instructions: "Set a timer for 2 minutes. Write down all your worries without censoring. When time's up, close the list and promise to revisit it later if needed.",
  },
  {
    title: "Visualization Journey",
    description: "Create a peaceful mental sanctuary through guided imagery",
    category: "mental",
    subcategory: "meditation",
    difficulty: "medium",
    points: 20,
    instructions: "Close your eyes. Imagine a peaceful place in vivid detail - colors, sounds, smells, textures. Spend 2 minutes exploring this sanctuary in your mind.",
  },
  {
    title: "Memory Palace",
    description: "Sharpen your memory by recalling details from your day",
    category: "mental",
    subcategory: "cognitive",
    difficulty: "medium",
    points: 20,
    instructions: "Close your eyes and mentally walk through your morning from the moment you woke up. Try to remember as many specific details as possible - sounds, colors, feelings.",
  },

  // Mental Challenges - Hard
  {
    title: "Mental Math Sprint",
    description: "Exercise your brain with rapid calculations",
    category: "mental",
    subcategory: "cognitive",
    difficulty: "hard",
    points: 30,
    instructions: "Pick a 2-digit number. Add 17, subtract 9, multiply by 2, divide by 3. Repeat with new starting numbers. Do as many sequences as possible mentally.",
  },
  {
    title: "Mindfulness Body Scan",
    description: "Deep meditation practice scanning every part of your body",
    category: "mental",
    subcategory: "meditation",
    difficulty: "hard",
    points: 30,
    instructions: "Sit or lie down. Starting at your toes, slowly move attention through each body part. Notice sensations without judgment. Reach the top of your head by 2 minutes.",
  },

  // Learning Challenges - Easy
  {
    title: "One New Word",
    description: "Expand your vocabulary with a new word",
    category: "learning",
    subcategory: "language",
    difficulty: "easy",
    points: 10,
    instructions: "Look up a word you don't know. Read its definition, etymology, and example usage. Try to use it in a sentence. Write it down to remember.",
  },
  {
    title: "Current Events Check",
    description: "Stay informed by reading a news headline and summary",
    category: "learning",
    subcategory: "news",
    difficulty: "easy",
    points: 10,
    instructions: "Read one news article or summary about a current event. Focus on understanding the who, what, where, when, and why. Consider different perspectives.",
  },
  {
    title: "Fun Fact Deep Dive",
    description: "Learn something fascinating about any topic",
    category: "learning",
    subcategory: "general-knowledge",
    difficulty: "easy",
    points: 10,
    instructions: "Look up an interesting fact about something you're curious about. Read for 2 minutes to understand the context. Share what you learned with someone.",
  },

  // Learning Challenges - Medium
  {
    title: "TED Talk Speed Learning",
    description: "Watch a 2-minute segment of an educational video",
    category: "learning",
    subcategory: "education",
    difficulty: "medium",
    points: 20,
    instructions: "Find a TED talk or educational video on a topic you want to learn. Watch 2 minutes of it with full attention. Take one key insight to remember.",
  },
  {
    title: "Historical Event Study",
    description: "Learn about an important event from history",
    category: "learning",
    subcategory: "history",
    difficulty: "medium",
    points: 20,
    instructions: "Pick a historical date or event you're curious about. Read a summary and key facts. Try to understand its significance and lasting impact.",
  },
  {
    title: "Science Concept",
    description: "Understand a basic scientific principle",
    category: "learning",
    subcategory: "science",
    difficulty: "medium",
    points: 20,
    instructions: "Choose a scientific concept (photosynthesis, gravity, etc.). Read a simple explanation. See if you can explain it to yourself in your own words.",
  },

  // Learning Challenges - Hard
  {
    title: "Code a Mini Function",
    description: "Write a small piece of code to solve a problem",
    category: "learning",
    subcategory: "programming",
    difficulty: "hard",
    points: 30,
    instructions: "Write a simple function in any programming language (e.g., FizzBuzz, palindrome checker). Focus on clean, working code even if it's basic.",
  },
  {
    title: "Language Practice",
    description: "Practice a foreign language you're learning",
    category: "learning",
    subcategory: "language",
    difficulty: "hard",
    points: 30,
    instructions: "Spend 2 minutes speaking, writing, or listening to a foreign language. Use a language app, read a paragraph, or practice conversation out loud.",
  },

  // Finance Challenges - Easy
  {
    title: "Expense Tracker Check",
    description: "Review your recent spending",
    category: "finance",
    subcategory: "budgeting",
    difficulty: "easy",
    points: 10,
    instructions: "Open your bank app or recent receipts. Review the last 3 transactions. Categorize them as necessary, discretionary, or impulse purchases.",
  },
  {
    title: "Money Goal Reflection",
    description: "Think about your financial goals",
    category: "finance",
    subcategory: "planning",
    difficulty: "easy",
    points: 10,
    instructions: "Write down one short-term (this month) and one long-term (this year) financial goal. Be specific about the amounts and timeline.",
  },
  {
    title: "Unsubscribe Audit",
    description: "Check for unused subscriptions",
    category: "finance",
    subcategory: "savings",
    difficulty: "easy",
    points: 10,
    instructions: "Look through your recent bank statements or emails. Identify one subscription or recurring charge you might not need anymore. Consider canceling it.",
  },

  // Finance Challenges - Medium
  {
    title: "Savings Rate Calculation",
    description: "Calculate your current savings rate",
    category: "finance",
    subcategory: "analysis",
    difficulty: "medium",
    points: 20,
    instructions: "Calculate: (Monthly Savings ÷ Monthly Income) × 100. Write down the percentage. Set a goal to increase it by 1-2% next month.",
  },
  {
    title: "Price Comparison",
    description: "Compare prices on something you need to buy",
    category: "finance",
    subcategory: "smart-shopping",
    difficulty: "medium",
    points: 20,
    instructions: "Think of something you need to purchase soon. Quickly compare prices across 3 different sellers or platforms. Calculate potential savings.",
  },
  {
    title: "Investment Check-In",
    description: "Review your investment accounts if you have them",
    category: "finance",
    subcategory: "investing",
    difficulty: "medium",
    points: 20,
    instructions: "If you have investments, check their performance. Note the current value. If you don't invest, research one type of investment vehicle for beginners.",
  },

  // Finance Challenges - Hard
  {
    title: "Budget Category Deep Dive",
    description: "Analyze and optimize one spending category",
    category: "finance",
    subcategory: "budgeting",
    difficulty: "hard",
    points: 30,
    instructions: "Pick one spending category (food, transport, etc.). Calculate total spent this month. Identify 2-3 specific ways to reduce it by 10-20% next month.",
  },
  {
    title: "Financial Article Study",
    description: "Read and understand a financial concept",
    category: "finance",
    subcategory: "education",
    difficulty: "hard",
    points: 30,
    instructions: "Read an article about a financial topic you don't fully understand (compound interest, index funds, etc.). Summarize the key takeaway in one sentence.",
  },

  // Relationships Challenges - Easy
  {
    title: "Send a Quick Message",
    description: "Reach out to someone you care about",
    category: "relationships",
    subcategory: "communication",
    difficulty: "easy",
    points: 10,
    instructions: "Send a text, email, or message to someone you haven't talked to in a while. Keep it simple - ask how they're doing or share something that reminded you of them.",
  },
  {
    title: "Appreciation Expression",
    description: "Tell someone why you appreciate them",
    category: "relationships",
    subcategory: "gratitude",
    difficulty: "easy",
    points: 10,
    instructions: "Think of someone in your life. Write down or tell them one specific thing you appreciate about them. Be genuine and specific.",
  },
  {
    title: "Active Listening Practice",
    description: "Give someone your full attention",
    category: "relationships",
    subcategory: "connection",
    difficulty: "easy",
    points: 10,
    instructions: "If someone is talking to you, put away your phone and make eye contact. Listen without planning your response. Show you're engaged with nods and follow-up questions.",
  },

  // Relationships Challenges - Medium
  {
    title: "Conflict Resolution Planning",
    description: "Think through a relationship tension constructively",
    category: "relationships",
    subcategory: "conflict-resolution",
    difficulty: "medium",
    points: 20,
    instructions: "Identify one minor conflict or tension. Write down: your feelings, the other person's perspective, and one step toward resolution. Focus on understanding, not blame.",
  },
  {
    title: "Quality Time Planning",
    description: "Schedule meaningful time with someone",
    category: "relationships",
    subcategory: "bonding",
    difficulty: "medium",
    points: 20,
    instructions: "Think of someone you'd like to spend time with. Send them a specific invitation - a date, time, and activity. Make it something you'd both enjoy.",
  },
  {
    title: "Vulnerability Share",
    description: "Open up about something real",
    category: "relationships",
    subcategory: "intimacy",
    difficulty: "medium",
    points: 20,
    instructions: "Share something genuine with someone you trust - a fear, a hope, or something you're struggling with. Allow yourself to be authentic.",
  },

  // Relationships Challenges - Hard
  {
    title: "Difficult Conversation",
    description: "Have a conversation you've been avoiding",
    category: "relationships",
    subcategory: "communication",
    difficulty: "hard",
    points: 30,
    instructions: "Identify a conversation you've been putting off. Initiate it with empathy and honesty. Use 'I feel' statements. Listen without defensiveness.",
  },
  {
    title: "Apology and Repair",
    description: "Make amends for something you regret",
    category: "relationships",
    subcategory: "reconciliation",
    difficulty: "hard",
    points: 30,
    instructions: "Think of something you wish you'd handled differently. Reach out to that person with a sincere apology. Take responsibility without excuses. Ask what you can do to make it right.",
  },
];

// Achievement seed data
export const achievementSeedData: InsertAchievement[] = [
  // Completion Achievements
  {
    name: "First Steps",
    description: "Complete your first challenge",
    icon: "Footprints",
    category: "completion",
    requirementType: "challenges_completed",
    requirementValue: 1,
    tier: "bronze",
    sortOrder: 1,
  },
  {
    name: "Getting Started",
    description: "Complete 5 challenges",
    icon: "TrendingUp",
    category: "completion",
    requirementType: "challenges_completed",
    requirementValue: 5,
    tier: "bronze",
    sortOrder: 2,
  },
  {
    name: "Consistent",
    description: "Complete 10 challenges",
    icon: "Target",
    category: "completion",
    requirementType: "challenges_completed",
    requirementValue: 10,
    tier: "silver",
    sortOrder: 3,
  },
  {
    name: "Dedicated",
    description: "Complete 50 challenges",
    icon: "Award",
    category: "completion",
    requirementType: "challenges_completed",
    requirementValue: 50,
    tier: "gold",
    sortOrder: 4,
  },
  {
    name: "Champion",
    description: "Complete 100 challenges",
    icon: "Trophy",
    category: "completion",
    requirementType: "challenges_completed",
    requirementValue: 100,
    tier: "platinum",
    sortOrder: 5,
  },

  // Streak Achievements
  {
    name: "On a Roll",
    description: "Maintain a 3-day streak",
    icon: "Flame",
    category: "streak",
    requirementType: "streak_days",
    requirementValue: 3,
    tier: "bronze",
    sortOrder: 6,
  },
  {
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "Zap",
    category: "streak",
    requirementType: "streak_days",
    requirementValue: 7,
    tier: "silver",
    sortOrder: 7,
  },
  {
    name: "Streak Master",
    description: "Maintain a 30-day streak",
    icon: "Crown",
    category: "streak",
    requirementType: "streak_days",
    requirementValue: 30,
    tier: "gold",
    sortOrder: 8,
  },
  {
    name: "Unstoppable",
    description: "Maintain a 100-day streak",
    icon: "Sparkles",
    category: "streak",
    requirementType: "streak_days",
    requirementValue: 100,
    tier: "platinum",
    sortOrder: 9,
  },

  // Points Achievements
  {
    name: "Points Collector",
    description: "Earn 100 total points",
    icon: "Coins",
    category: "points",
    requirementType: "total_points",
    requirementValue: 100,
    tier: "bronze",
    sortOrder: 10,
  },
  {
    name: "Points Master",
    description: "Earn 500 total points",
    icon: "Gem",
    category: "points",
    requirementType: "total_points",
    requirementValue: 500,
    tier: "silver",
    sortOrder: 11,
  },
  {
    name: "Points Champion",
    description: "Earn 1000 total points",
    icon: "Star",
    category: "points",
    requirementType: "total_points",
    requirementValue: 1000,
    tier: "gold",
    sortOrder: 12,
  },
  {
    name: "Points Legend",
    description: "Earn 5000 total points",
    icon: "Crown",
    category: "points",
    requirementType: "total_points",
    requirementValue: 5000,
    tier: "platinum",
    sortOrder: 13,
  },

  // Category-Specific Achievements
  {
    name: "Physical Enthusiast",
    description: "Complete 10 physical challenges",
    icon: "Activity",
    category: "category_specific",
    requirementType: "category_challenges",
    requirementValue: 10,
    requirementMeta: { category: "physical" },
    tier: "silver",
    sortOrder: 14,
  },
  {
    name: "Mental Wellness",
    description: "Complete 10 mental challenges",
    icon: "Brain",
    category: "category_specific",
    requirementType: "category_challenges",
    requirementValue: 10,
    requirementMeta: { category: "mental" },
    tier: "silver",
    sortOrder: 15,
  },
  {
    name: "Lifelong Learner",
    description: "Complete 10 learning challenges",
    icon: "BookOpen",
    category: "category_specific",
    requirementType: "category_challenges",
    requirementValue: 10,
    requirementMeta: { category: "learning" },
    tier: "silver",
    sortOrder: 16,
  },
  {
    name: "Finance Guru",
    description: "Complete 10 finance challenges",
    icon: "DollarSign",
    category: "category_specific",
    requirementType: "category_challenges",
    requirementValue: 10,
    requirementMeta: { category: "finance" },
    tier: "silver",
    sortOrder: 17,
  },
  {
    name: "Relationship Builder",
    description: "Complete 10 relationships challenges",
    icon: "Heart",
    category: "category_specific",
    requirementType: "category_challenges",
    requirementValue: 10,
    requirementMeta: { category: "relationships" },
    tier: "silver",
    sortOrder: 18,
  },

  // Well-Rounded Achievement
  {
    name: "Well-Rounded",
    description: "Complete at least 5 challenges in each category",
    icon: "CircleDot",
    category: "category_master",
    requirementType: "all_categories",
    requirementValue: 5,
    tier: "gold",
    sortOrder: 19,
  },
];

// Initialize database with seed data (idempotent - checks before inserting)
export async function seedDatabase() {
  try {
    // Seed challenges - use count to check if data exists
    try {
      const challengeCount = await db.select({ count: sql<number>`count(*)` }).from(challenges);
      const count = challengeCount[0]?.count || 0;
      
      if (count === 0) {
        console.log("Seeding database with challenges...");
        await db.insert(challenges).values(challengeSeedData);
        console.log(`Successfully seeded ${challengeSeedData.length} challenges`);
      } else {
        console.log("Database already seeded with challenges");
      }
    } catch (error) {
      console.log("Could not check challenges, attempting to seed anyway...");
      try {
        await db.insert(challenges).values(challengeSeedData);
        console.log(`Successfully seeded ${challengeSeedData.length} challenges`);
      } catch (insertError) {
        console.log("Challenges may already exist or insert failed");
      }
    }

    // Seed achievements - use count to check if data exists
    try {
      const achievementCount = await db.select({ count: sql<number>`count(*)` }).from(achievements);
      const count = achievementCount[0]?.count || 0;
      
      if (count === 0) {
        console.log("Seeding database with achievements...");
        await db.insert(achievements).values(achievementSeedData);
        console.log(`Successfully seeded ${achievementSeedData.length} achievements`);
      } else {
        console.log("Database already seeded with achievements");
      }
    } catch (error) {
      console.log("Could not check achievements, attempting to seed anyway...");
      try {
        await db.insert(achievements).values(achievementSeedData);
        console.log(`Successfully seeded ${achievementSeedData.length} achievements`);
      } catch (insertError) {
        console.log("Achievements may already exist or insert failed");
      }
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    // Don't throw - allow app to start even if seeding fails
  }
}

const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log(`🗄️  Using ${useSupabase ? 'Supabase' : 'Neon'} database`);

export const storage: IStorage = useSupabase
  ? await (async () => {
      const { SupabaseStorage } = await import("./supabaseStorage");
      return new SupabaseStorage();
    })()
  : new DatabaseStorage();
