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
} from "@shared/schema";
import { supabase } from "./supabase";
import type { IStorage } from "./storage";

export class SupabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return this.mapUser(data);
  }

  async findUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUser(data);
  }

  async createLocalUser(userData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        onboarding_completed: 0,
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return this.mapUser(data);
  }

  async updateUserPreferences(userId: string, preferences: {
    preferredCategories?: string[];
    hasMentalHealthConcerns?: string;
    mentalHealthDetails?: string;
    preferredDays?: number[];
    challengeScheduleTimes?: { start: string; end: string }[];
    enableNotifications?: number;
    onboardingCompleted?: number;
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        preferred_categories: preferences.preferredCategories,
        has_mental_health_concerns: preferences.hasMentalHealthConcerns,
        mental_health_details: preferences.mentalHealthDetails,
        preferred_days: preferences.preferredDays,
        challenge_schedule_times: preferences.challengeScheduleTimes,
        enable_notifications: preferences.enableNotifications,
        onboarding_completed: preferences.onboardingCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return this.mapUser(data);
  }

  // Challenges
  async getAllChallenges(): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select('*');
    
    if (error) throw new Error(error.message);
    return data.map(this.mapChallenge);
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapChallenge(data);
  }

  async getChallengesByCategory(category: string): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', category);
    
    if (error) throw new Error(error.message);
    return data.map(this.mapChallenge);
  }

  async getRandomChallenge(): Promise<Challenge | undefined> {
    // Get total count first
    const { count, error: countError } = await supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true });
    
    if (countError || !count || count === 0) return undefined;
    
    // Calculate random offset
    const randomOffset = Math.floor(Math.random() * count);
    
    // Fetch one record at that offset
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .range(randomOffset, randomOffset)
      .limit(1);
    
    if (error || !data || data.length === 0) return undefined;
    return this.mapChallenge(data[0]);
  }

  async createChallenge(insertChallenge: InsertChallenge, userId: string): Promise<Challenge> {
    const { data, error } = await supabase
      .from('challenges')
      .insert({
        ...this.unmapChallenge(insertChallenge),
        created_by: userId,
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return this.mapChallenge(data);
  }

  async updateChallenge(id: string, updates: Partial<InsertChallenge>, userId: string): Promise<Challenge | undefined> {
    const existing = await this.getChallengeById(id);
    if (!existing || existing.createdBy !== userId) {
      return undefined;
    }

    const { data, error } = await supabase
      .from('challenges')
      .update(this.unmapChallenge(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return this.mapChallenge(data);
  }

  async deleteChallenge(id: string, userId: string): Promise<boolean> {
    const existing = await this.getChallengeById(id);
    if (!existing || existing.createdBy !== userId || existing.createdBy === null) {
      return false;
    }

    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('created_by', userId);
    
    if (error) throw new Error(error.message);
    return data.map(this.mapChallenge);
  }

  // User Progress
  async getUserProgress(userId: string): Promise<UserProgress> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      const { data: newData, error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          total_challenges_completed: 0,
          current_streak: 0,
          longest_streak: 0,
          total_points: 0,
          last_completed_date: null,
        })
        .select()
        .single();
      
      if (insertError) throw new Error(insertError.message);
      return this.mapUserProgress(newData);
    }
    
    return this.mapUserProgress(data);
  }

  async updateUserProgress(userId: string, updates: Partial<InsertUserProgress>): Promise<UserProgress> {
    const { data, error } = await supabase
      .from('user_progress')
      .update(this.unmapUserProgress(updates))
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return this.mapUserProgress(data);
  }

  async incrementStreak(userId: string): Promise<void> {
    const progress = await this.getUserProgress(userId);
    const newStreak = progress.currentStreak + 1;
    const newLongest = Math.max(newStreak, progress.longestStreak);

    await supabase
      .from('user_progress')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
      })
      .eq('user_id', userId);
  }

  async resetStreak(userId: string): Promise<void> {
    await supabase
      .from('user_progress')
      .update({ current_streak: 0 })
      .eq('user_id', userId);
  }

  async addPoints(userId: string, points: number): Promise<void> {
    const progress = await this.getUserProgress(userId);
    await supabase
      .from('user_progress')
      .update({ total_points: progress.totalPoints + points })
      .eq('user_id', userId);
  }

  // Challenge History
  async getAllHistory(userId: string): Promise<ChallengeWithDetails[]> {
    const { data, error } = await supabase
      .from('challenge_history')
      .select(`
        *,
        challenges (*)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    
    return data.map(h => ({
      ...this.mapChallenge(h.challenges),
      completedAt: h.completed_at,
      timeSpent: h.time_spent,
      pointsEarned: h.points_earned,
    }));
  }

  async addHistoryEntry(userId: string, entry: CreateChallengeHistory): Promise<ChallengeHistory> {
    const { data, error } = await supabase
      .from('challenge_history')
      .insert({
        user_id: userId,
        challenge_id: entry.challengeId,
        completed_at: entry.completedAt,
        time_spent: entry.timeSpent,
        points_earned: entry.pointsEarned,
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);

    const progress = await this.getUserProgress(userId);
    const newTotal = progress.totalChallengesCompleted + 1;
    const newPoints = progress.totalPoints + entry.pointsEarned;

    const today = new Date().toISOString().split("T")[0];
    const lastDate = progress.lastCompletedDate;

    let newStreak = progress.currentStreak;
    let newLongest = progress.longestStreak;

    if (!lastDate) {
      newStreak = 1;
      newLongest = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastDate === today) {
        // Already completed one today
      } else if (lastDate === yesterdayStr) {
        newStreak = progress.currentStreak + 1;
        newLongest = Math.max(newStreak, progress.longestStreak);
      } else {
        newStreak = 1;
      }
    }

    await supabase
      .from('user_progress')
      .update({
        total_challenges_completed: newTotal,
        total_points: newPoints,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_completed_date: today,
      })
      .eq('user_id', userId);

    return this.mapChallengeHistory(data);
  }

  async getHistoryByDate(userId: string, date: string): Promise<ChallengeHistory[]> {
    const { data, error } = await supabase
      .from('challenge_history')
      .select('*')
      .eq('user_id', userId)
      .like('completed_at', `${date}%`);
    
    if (error) throw new Error(error.message);
    return data.map(this.mapChallengeHistory);
  }

  // Achievements
  async getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('sort_order');
    
    if (error) throw new Error(error.message);
    return data.map(this.mapAchievement);
  }

  async getUserAchievements(userId: string): Promise<AchievementWithProgress[]> {
    const allAchievements = await this.getAllAchievements();
    
    const { data: unlockedData } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);
    
    const unlocked = unlockedData || [];
    const progress = await this.getUserProgress(userId);
    
    const { data: categoryData } = await supabase
      .from('challenge_history')
      .select(`
        challenges!inner(category)
      `)
      .eq('user_id', userId);
    
    const categoryMap = new Map<string, number>();
    categoryData?.forEach((item: any) => {
      const category = item.challenges.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return allAchievements.map(achievement => {
      const unlockedAchievement = unlocked.find(ua => ua.achievement_id === achievement.id);
      
      let currentProgress = 0;
      const requirementValue = achievement.requirementValue;

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
          const category = (achievement.requirementMeta as any)?.category;
          if (category) {
            currentProgress = categoryMap.get(category) || 0;
          }
          break;
        case "all_categories":
          const allCategoriesMet = ["physical", "mental", "learning", "finance", "relationships"]
            .every(cat => (categoryMap.get(cat) || 0) >= requirementValue);
          currentProgress = allCategoriesMet ? requirementValue : 0;
          break;
      }

      return {
        ...achievement,
        unlocked: !!unlockedAchievement,
        unlockedAt: unlockedAchievement?.unlocked_at || null,
        progress: currentProgress,
        progressPercent: Math.min(100, Math.floor((currentProgress / requirementValue) * 100)),
        userAchievementId: unlockedAchievement?.id || null,
      };
    });
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (existing) {
      return this.mapUserAchievement(existing);
    }

    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return this.mapUserAchievement(data);
  }

  async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    const userAchievementsWithProgress = await this.getUserAchievements(userId);
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of userAchievementsWithProgress) {
      if (achievement.unlocked) continue;

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
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (*),
        users (first_name, last_name, profile_image_url)
      `)
      .eq('id', userAchievementId)
      .single();

    if (error || !data) return null;

    return {
      achievement: this.mapAchievement(data.achievements),
      user: {
        firstName: data.users.first_name,
        lastName: data.users.last_name,
        profileImageUrl: data.users.profile_image_url,
      },
      unlockedAt: data.unlocked_at ? new Date(data.unlocked_at) : null,
    };
  }

  // Analytics
  async getDailyStats(userId: string, days: number): Promise<Array<{ date: string; count: number; points: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('challenge_history')
      .select('completed_at, points_earned')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString());

    const statsMap = new Map<string, { count: number; points: number }>();
    data?.forEach(item => {
      const date = item.completed_at.split('T')[0];
      const existing = statsMap.get(date) || { count: 0, points: 0 };
      statsMap.set(date, {
        count: existing.count + 1,
        points: existing.points + item.points_earned,
      });
    });

    const result: Array<{ date: string; count: number; points: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      const stats = statsMap.get(dateStr) || { count: 0, points: 0 };
      result.push({ date: dateStr, ...stats });
    }

    return result;
  }

  async getCategoryDistribution(userId: string): Promise<Array<{ category: string; count: number; percentage: number }>> {
    const { data } = await supabase
      .from('challenge_history')
      .select(`
        challenges!inner(category)
      `)
      .eq('user_id', userId);

    const categoryMap = new Map<string, number>();
    data?.forEach((item: any) => {
      const category = item.challenges.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }

  async getWeeklyTrend(userId: string): Promise<Array<{ week: string; count: number; points: number }>> {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const { data } = await supabase
      .from('challenge_history')
      .select('completed_at, points_earned')
      .eq('user_id', userId)
      .gte('completed_at', twelveWeeksAgo.toISOString());

    const weekMap = new Map<string, { count: number; points: number }>();
    data?.forEach(item => {
      const date = new Date(item.completed_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekStr = weekStart.toISOString().split('T')[0];
      
      const existing = weekMap.get(weekStr) || { count: 0, points: 0 };
      weekMap.set(weekStr, {
        count: existing.count + 1,
        points: existing.points + item.points_earned,
      });
    });

    return Array.from(weekMap.entries())
      .map(([week, stats]) => ({ week, ...stats }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  async getMonthlyTrend(userId: string): Promise<Array<{ month: string; count: number; points: number }>> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data } = await supabase
      .from('challenge_history')
      .select('completed_at, points_earned')
      .eq('user_id', userId)
      .gte('completed_at', twelveMonthsAgo.toISOString());

    const monthMap = new Map<string, { count: number; points: number }>();
    data?.forEach(item => {
      const date = new Date(item.completed_at);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthMap.get(monthStr) || { count: 0, points: 0 };
      monthMap.set(monthStr, {
        count: existing.count + 1,
        points: existing.points + item.points_earned,
      });
    });

    return Array.from(monthMap.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // Friends
  async sendFriendRequest(requesterId: string, receiverEmail: string): Promise<Friendship | null> {
    const { data: receiver } = await supabase
      .from('users')
      .select('id')
      .eq('email', receiverEmail)
      .single();

    if (!receiver || receiver.id === requesterId) return null;

    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiver.id}),and(requester_id.eq.${receiver.id},receiver_id.eq.${requesterId})`)
      .single();

    if (existing) return null;

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: requesterId,
        receiver_id: receiver.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return null;
    return this.mapFriendship(data);
  }

  async acceptFriendRequest(friendshipId: string, userId: string): Promise<Friendship | null> {
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('receiver_id', userId)
      .single();

    if (!friendship || friendship.status !== 'pending') return null;

    const { data, error } = await supabase
      .from('friendships')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) return null;
    return this.mapFriendship(data);
  }

  async declineFriendRequest(friendshipId: string, userId: string): Promise<boolean> {
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('receiver_id', userId)
      .single();

    if (!friendship || friendship.status !== 'pending') return false;

    const { error } = await supabase
      .from('friendships')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', friendshipId);

    return !error;
  }

  async getFriends(userId: string): Promise<FriendWithDetails[]> {
    const { data } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:users!friendships_requester_id_fkey(id, email, first_name, last_name, profile_image_url),
        receiver:users!friendships_receiver_id_fkey(id, email, first_name, last_name, profile_image_url)
      `)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (!data) return [];

    return data.map(f => {
      const isRequester = f.requester_id === userId;
      const friend = isRequester ? f.receiver : f.requester;
      return {
        friendshipId: f.id,
        userId: friend.id,
        email: friend.email,
        firstName: friend.first_name,
        lastName: friend.last_name,
        profileImageUrl: friend.profile_image_url,
        status: f.status as any,
        createdAt: f.created_at ? new Date(f.created_at) : null,
      };
    });
  }

  async getPendingRequests(userId: string): Promise<FriendWithDetails[]> {
    const { data } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:users!friendships_requester_id_fkey(id, email, first_name, last_name, profile_image_url)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (!data) return [];

    return data.map(f => ({
      friendshipId: f.id,
      userId: f.requester.id,
      email: f.requester.email,
      firstName: f.requester.first_name,
      lastName: f.requester.last_name,
      profileImageUrl: f.requester.profile_image_url,
      status: f.status as any,
      createdAt: f.created_at ? new Date(f.created_at) : null,
    }));
  }

  async unfriend(friendshipId: string, userId: string): Promise<boolean> {
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .single();

    if (!friendship) return false;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    return !error;
  }

  async getFriendActivity(userId: string, limit: number = 20): Promise<Array<{
    userId: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    challengeTitle: string;
    completedAt: string;
    pointsEarned: number;
  }>> {
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(f => f.userId);

    if (friendIds.length === 0) return [];

    const { data } = await supabase
      .from('challenge_history')
      .select(`
        *,
        users!challenge_history_user_id_fkey(first_name, last_name, profile_image_url),
        challenges!challenge_history_challenge_id_fkey(title)
      `)
      .in('user_id', friendIds)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map(item => ({
      userId: item.user_id,
      firstName: item.users.first_name,
      lastName: item.users.last_name,
      profileImageUrl: item.users.profile_image_url,
      challengeTitle: item.challenges.title,
      completedAt: item.completed_at,
      pointsEarned: item.points_earned,
    }));
  }

  // Scheduled Challenges
  async getScheduledChallenges(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('scheduled_challenges')
      .select(`
        *,
        challenges (*)
      `)
      .eq('user_id', userId)
      .order('scheduled_time');

    return data || [];
  }

  async createScheduledChallenge(userId: string, scheduleData: any): Promise<any> {
    const { data, error } = await supabase
      .from('scheduled_challenges')
      .insert({
        user_id: userId,
        ...scheduleData,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateScheduledChallenge(id: string, userId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('scheduled_challenges')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteScheduledChallenge(id: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('scheduled_challenges')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  async getNextScheduledChallenge(userId: string): Promise<(ScheduledChallenge & { challenge: Challenge }) | null> {
    const now = new Date().toISOString();
    
    // Get all eligible challenges:
    // - pending, notified: always eligible
    // - snoozed: only if snoozed_until has passed
    // - cancelled: never eligible (permanently excluded)
    const { data, error } = await supabase
      .from('scheduled_challenges')
      .select(`
        *,
        challenges (*)
      `)
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .or(`status.eq.pending,status.eq.notified,and(status.eq.snoozed,snoozed_until.lte.${now})`)
      .order('scheduled_time', { ascending: true })
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const challenge = data[0];
    return {
      id: challenge.id,
      userId: challenge.user_id,
      challengeId: challenge.challenge_id,
      scheduledTime: new Date(challenge.scheduled_time),
      status: challenge.status,
      snoozedUntil: challenge.snoozed_until ? new Date(challenge.snoozed_until) : null,
      createdAt: challenge.created_at ? new Date(challenge.created_at) : null,
      challenge: this.mapChallenge(challenge.challenges),
    };
  }

  async postponeScheduledChallenge(id: string, userId: string): Promise<ScheduledChallenge> {
    // Postpone by 2 minutes
    const snoozedUntil = new Date(Date.now() + 2 * 60 * 1000);

    // Update both status and scheduled_time so postponed challenges move to the end of the queue
    const { data, error } = await supabase
      .from('scheduled_challenges')
      .update({
        status: 'snoozed',
        snoozed_until: snoozedUntil.toISOString(),
        scheduled_time: snoozedUntil.toISOString(), // Move to end of queue
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('CHALLENGE_NOT_FOUND');
      }
      throw new Error(error.message);
    }

    return {
      id: data.id,
      userId: data.user_id,
      challengeId: data.challenge_id,
      scheduledTime: new Date(data.scheduled_time),
      status: data.status,
      snoozedUntil: data.snoozed_until ? new Date(data.snoozed_until) : null,
      createdAt: data.created_at ? new Date(data.created_at) : null,
    };
  }

  async cancelScheduledChallenge(id: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('scheduled_challenges')
      .update({
        status: 'cancelled',
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) return false;
    return data && data.length > 0;
  }

  async completeScheduledChallenge(id: string, userId: string, status: 'success' | 'failed'): Promise<ChallengeHistory> {
    // Get the scheduled challenge first
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('scheduled_challenges')
      .select('*, challenges (*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (scheduleError) {
      if (scheduleError.code === 'PGRST116') {
        throw new Error('CHALLENGE_NOT_FOUND');
      }
      throw new Error(scheduleError.message);
    }

    if (!scheduleData) {
      throw new Error('CHALLENGE_NOT_FOUND');
    }

    // Create history entry
    const historyEntry = {
      user_id: userId,
      challenge_id: scheduleData.challenge_id,
      completed_at: new Date().toISOString(),
      time_spent: 120, // 2 minutes in seconds
      points_earned: status === 'success' ? scheduleData.challenges.points : 0,
      status: status,
      postponed_count: 0, // TODO: track postponed count
      scheduled_time: scheduleData.scheduled_time,
    };

    const { data: historyData, error: historyError } = await supabase
      .from('challenge_history')
      .insert(historyEntry)
      .select()
      .single();

    if (historyError) throw new Error(historyError.message);

    // Update scheduled challenge status
    const { error: updateError } = await supabase
      .from('scheduled_challenges')
      .update({ status: 'completed' })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update scheduled challenge status:', updateError);
    }

    // Update user progress
    if (status === 'success') {
      await this.addPoints(userId, scheduleData.challenges.points);
      await this.incrementStreak(userId);
    } else {
      await this.resetStreak(userId);
    }

    return this.mapChallengeHistory(historyData);
  }

  // Helper mappers to convert snake_case to camelCase
  private mapUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImageUrl: data.profile_image_url,
      preferredCategories: data.preferred_categories,
      hasMentalHealthConcerns: data.has_mental_health_concerns,
      mentalHealthDetails: data.mental_health_details,
      preferredDays: data.preferred_days,
      challengeScheduleTimes: data.challenge_schedule_times,
      enableNotifications: data.enable_notifications,
      onboardingCompleted: data.onboarding_completed,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
    };
  }

  private mapChallenge(data: any): Challenge {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      difficulty: data.difficulty,
      points: data.points,
      instructions: data.instructions,
      createdBy: data.created_by,
      createdAt: data.created_at ? new Date(data.created_at) : null,
    };
  }

  private unmapChallenge(data: Partial<InsertChallenge>): any {
    return {
      title: data.title,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      difficulty: data.difficulty,
      points: data.points,
      instructions: data.instructions,
    };
  }

  private mapUserProgress(data: any): UserProgress {
    return {
      id: data.id,
      userId: data.user_id,
      totalChallengesCompleted: data.total_challenges_completed,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      totalPoints: data.total_points,
      lastCompletedDate: data.last_completed_date,
    };
  }

  private unmapUserProgress(data: Partial<InsertUserProgress>): any {
    return {
      user_id: data.userId,
      total_challenges_completed: data.totalChallengesCompleted,
      current_streak: data.currentStreak,
      longest_streak: data.longestStreak,
      total_points: data.totalPoints,
      last_completed_date: data.lastCompletedDate,
    };
  }

  private mapChallengeHistory(data: any): ChallengeHistory {
    return {
      id: data.id,
      userId: data.user_id,
      challengeId: data.challenge_id,
      completedAt: data.completed_at,
      timeSpent: data.time_spent,
      pointsEarned: data.points_earned,
      status: data.status || 'success',
      postponedCount: data.postponed_count || 0,
      scheduledTime: data.scheduled_time ? new Date(data.scheduled_time) : null,
    };
  }

  private mapAchievement(data: any): Achievement {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      category: data.category,
      requirementType: data.requirement_type,
      requirementValue: data.requirement_value,
      requirementMeta: data.requirement_meta,
      tier: data.tier,
      sortOrder: data.sort_order,
      createdAt: data.created_at ? new Date(data.created_at) : null,
    };
  }

  private mapUserAchievement(data: any): UserAchievement {
    return {
      id: data.id,
      userId: data.user_id,
      achievementId: data.achievement_id,
      unlockedAt: data.unlocked_at ? new Date(data.unlocked_at) : null,
      progress: data.progress,
    };
  }

  private mapFriendship(data: any): Friendship {
    return {
      id: data.id,
      requesterId: data.requester_id,
      receiverId: data.receiver_id,
      status: data.status,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      respondedAt: data.responded_at ? new Date(data.responded_at) : null,
    };
  }
}
