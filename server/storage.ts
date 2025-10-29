import {
  type Challenge,
  type InsertChallenge,
  type UserProgress,
  type InsertUserProgress,
  type ChallengeHistory,
  type InsertChallengeHistory,
  type ChallengeWithDetails,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Challenges
  getAllChallenges(): Promise<Challenge[]>;
  getChallengeById(id: string): Promise<Challenge | undefined>;
  getChallengesByCategory(category: string): Promise<Challenge[]>;
  getRandomChallenge(): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;

  // User Progress
  getUserProgress(): Promise<UserProgress>;
  updateUserProgress(progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  incrementStreak(): Promise<void>;
  resetStreak(): Promise<void>;
  addPoints(points: number): Promise<void>;

  // Challenge History
  getAllHistory(): Promise<ChallengeWithDetails[]>;
  addHistoryEntry(entry: InsertChallengeHistory): Promise<ChallengeHistory>;
  getHistoryByDate(date: string): Promise<ChallengeHistory[]>;
}

export class MemStorage implements IStorage {
  private challenges: Map<string, Challenge>;
  private progress: UserProgress;
  private history: Map<string, ChallengeHistory>;

  constructor() {
    this.challenges = new Map();
    this.history = new Map();
    
    // Initialize user progress
    this.progress = {
      id: randomUUID(),
      totalChallengesCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      lastCompletedDate: null,
    };

    // Seed challenges
    this.seedChallenges();
  }

  private seedChallenges() {
    const challengesData: InsertChallenge[] = [
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

    // Create all challenges
    for (const data of challengesData) {
      const id = randomUUID();
      const challenge: Challenge = { ...data, id };
      this.challenges.set(id, challenge);
    }
  }

  // Challenges
  async getAllChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values());
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async getChallengesByCategory(category: string): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(
      (c) => c.category === category
    );
  }

  async getRandomChallenge(): Promise<Challenge | undefined> {
    const all = Array.from(this.challenges.values());
    if (all.length === 0) return undefined;
    return all[Math.floor(Math.random() * all.length)];
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = randomUUID();
    const challenge: Challenge = { ...insertChallenge, id };
    this.challenges.set(id, challenge);
    return challenge;
  }

  // User Progress
  async getUserProgress(): Promise<UserProgress> {
    return this.progress;
  }

  async updateUserProgress(updates: Partial<InsertUserProgress>): Promise<UserProgress> {
    this.progress = { ...this.progress, ...updates };
    return this.progress;
  }

  async incrementStreak(): Promise<void> {
    this.progress.currentStreak++;
    if (this.progress.currentStreak > this.progress.longestStreak) {
      this.progress.longestStreak = this.progress.currentStreak;
    }
  }

  async resetStreak(): Promise<void> {
    this.progress.currentStreak = 0;
  }

  async addPoints(points: number): Promise<void> {
    this.progress.totalPoints += points;
  }

  // Challenge History
  async getAllHistory(): Promise<ChallengeWithDetails[]> {
    const historyArray = Array.from(this.history.values());
    
    // Sort by completion date (most recent first)
    historyArray.sort((a, b) => {
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });

    // Enrich with challenge details
    const enriched: ChallengeWithDetails[] = [];
    for (const h of historyArray) {
      const challenge = this.challenges.get(h.challengeId);
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

  async addHistoryEntry(entry: InsertChallengeHistory): Promise<ChallengeHistory> {
    const id = randomUUID();
    const historyEntry: ChallengeHistory = { ...entry, id };
    this.history.set(id, historyEntry);

    // Update progress
    this.progress.totalChallengesCompleted++;
    this.progress.totalPoints += entry.pointsEarned;

    // Update streak
    const today = new Date().toISOString().split("T")[0];
    const lastDate = this.progress.lastCompletedDate;

    if (!lastDate) {
      // First challenge ever
      this.progress.currentStreak = 1;
      this.progress.longestStreak = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastDate === today) {
        // Already completed one today, streak unchanged
      } else if (lastDate === yesterdayStr) {
        // Consecutive day
        await this.incrementStreak();
      } else {
        // Streak broken
        this.progress.currentStreak = 1;
      }
    }

    this.progress.lastCompletedDate = today;

    return historyEntry;
  }

  async getHistoryByDate(date: string): Promise<ChallengeHistory[]> {
    return Array.from(this.history.values()).filter(
      (h) => h.completedAt.startsWith(date)
    );
  }
}

export const storage = new MemStorage();
