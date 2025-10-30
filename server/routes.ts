import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, seedDatabase } from "./storage";
import { insertChallengeHistorySchema, insertChallengeSchema, users } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, registerUser } from "./localAuth";
import passport from "passport";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  setupLocalAuth();

  // Seed database on startup
  await seedDatabase();

  // Local auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ message: "Email, username, and password are required" });
      }

      const user = await registerUser(email, username, password, firstName, lastName);

      // Log the user in after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        // Remove password from response
        const { password: _, ...sanitizedUser } = user;
        res.json(sanitizedUser);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/local/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        // Remove password from response
        const { password: _, ...sanitizedUser } = user as any;
        res.json(sanitizedUser);
      });
    })(req, res, next);
  });

  // Update user onboarding preferences
  app.post("/api/auth/onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { preferredCategories, hasMentalHealthConcerns, mentalHealthDetails, preferredDays } = req.body;

      const user = await storage.updateUserPreferences(userId, {
        preferredCategories,
        hasMentalHealthConcerns,
        mentalHealthDetails,
        preferredDays,
        onboardingCompleted: 1,
      });

      // Remove password from response for security
      const { password: _, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Onboarding error:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Auth routes - return null if not authenticated (don't require auth)
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.json(null);
      }

      // Handle both Replit Auth and local auth
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.json(null);
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.json(null);
      }

      // Remove password from response for security
      const { password: _, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public challenge routes (no auth required)
  app.get("/api/challenges", async (_req, res) => {
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  app.get("/api/challenges/random", async (_req, res) => {
    try {
      const challenge = await storage.getRandomChallenge();
      if (!challenge) {
        return res.status(404).json({ error: "No challenges available" });
      }
      res.json(challenge);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch random challenge" });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challenge = await storage.getChallengeById(req.params.id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      res.json(challenge);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenge" });
    }
  });

  app.get("/api/challenges/category/:category", async (req, res) => {
    try {
      const challenges = await storage.getChallengesByCategory(req.params.category);
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenges by category" });
    }
  });

  // Get personalized challenges based on user preferences
  app.get("/api/challenges/personalized", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let challenges = await storage.getAllChallenges();

      // Filter by preferred categories if user has completed onboarding
      if (user.onboardingCompleted === 1 && user.preferredCategories && user.preferredCategories.length > 0) {
        challenges = challenges.filter((challenge) => 
          (user.preferredCategories as string[]).includes(challenge.category)
        );

        // Further filter mental challenges if user has mental health concerns
        if (user.hasMentalHealthConcerns === "yes" && user.mentalHealthDetails) {
          // This is where we could add more sophisticated filtering based on mental health details
          // For now, we'll include all mental challenges but could filter based on keywords
          // in user.mentalHealthDetails (e.g., "anxiety", "depression", etc.)
        }
      }

      // Randomize the challenges
      const shuffled = challenges.sort(() => Math.random() - 0.5);

      res.json(shuffled);
    } catch (error) {
      console.error("Error fetching personalized challenges:", error);
      res.status(500).json({ error: "Failed to fetch personalized challenges" });
    }
  });

  // Protected routes (require authentication)
  
  // Create a new challenge
  app.post("/api/challenges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const challengeData = insertChallengeSchema.parse(req.body);
      
      const challenge = await storage.createChallenge(challengeData, userId);
      res.status(201).json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid challenge data", details: error.errors });
      }
      console.error("Error creating challenge:", error);
      res.status(500).json({ error: "Failed to create challenge" });
    }
  });

  // Update a challenge
  app.patch("/api/challenges/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const challengeId = req.params.id;
      const updates = insertChallengeSchema.partial().parse(req.body);
      
      const challenge = await storage.updateChallenge(challengeId, updates, userId);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found or unauthorized" });
      }
      
      res.json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid challenge data", details: error.errors });
      }
      console.error("Error updating challenge:", error);
      res.status(500).json({ error: "Failed to update challenge" });
    }
  });

  // Delete a challenge
  app.delete("/api/challenges/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const challengeId = req.params.id;
      
      const deleted = await storage.deleteChallenge(challengeId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Challenge not found or unauthorized" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting challenge:", error);
      res.status(500).json({ error: "Failed to delete challenge" });
    }
  });

  // Get user's custom challenges
  app.get("/api/challenges/user/my-challenges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const challenges = await storage.getUserChallenges(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching user challenges:", error);
      res.status(500).json({ error: "Failed to fetch user challenges" });
    }
  });
  app.post("/api/challenges/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const challengeId = req.params.id;
      const challenge = await storage.getChallengeById(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      // Validate request body
      const bodySchema = z.object({
        timeSpent: z.number().int().min(0).max(120),
      });

      const { timeSpent } = bodySchema.parse(req.body);

      // Add to history (user-specific)
      const historyEntry = await storage.addHistoryEntry(userId, {
        challengeId,
        completedAt: new Date().toISOString(),
        timeSpent,
        pointsEarned: challenge.points,
      });

      // Check for newly unlocked achievements
      const newAchievements = await storage.checkAndUnlockAchievements(userId);

      res.json({
        success: true,
        historyEntry,
        pointsEarned: challenge.points,
        newAchievements,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to complete challenge" });
    }
  });

  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const history = await storage.getAllHistory(userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (_req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/achievements/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const newAchievements = await storage.checkAndUnlockAchievements(userId);
      res.json({ newAchievements });
    } catch (error) {
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  // Public achievement share endpoint (no auth required)
  app.get("/api/achievements/share/:userAchievementId", async (req, res) => {
    try {
      const { userAchievementId } = req.params;
      const share = await storage.getAchievementShare(userAchievementId);
      
      if (!share) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      
      res.json(share);
    } catch (error) {
      console.error("Error fetching shared achievement:", error);
      res.status(500).json({ error: "Failed to fetch shared achievement" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/daily", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getDailyStats(userId, days);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/analytics/category", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const distribution = await storage.getCategoryDistribution(userId);
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category distribution" });
    }
  });

  app.get("/api/analytics/weekly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const trend = await storage.getWeeklyTrend(userId);
      res.json(trend);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly trend" });
    }
  });

  app.get("/api/analytics/monthly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const trend = await storage.getMonthlyTrend(userId);
      res.json(trend);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly trend" });
    }
  });

  // Friends routes
  app.post("/api/friends/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const friendship = await storage.sendFriendRequest(userId, email);
      
      if (!friendship) {
        return res.status(400).json({ error: "Unable to send friend request. User may not exist or friendship already exists." });
      }

      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ error: "Failed to send friend request" });
    }
  });

  app.patch("/api/friends/:id/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const friendshipId = req.params.id;

      const friendship = await storage.acceptFriendRequest(friendshipId, userId);
      
      if (!friendship) {
        return res.status(404).json({ error: "Friend request not found or already responded to" });
      }

      res.json(friendship);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ error: "Failed to accept friend request" });
    }
  });

  app.patch("/api/friends/:id/decline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const friendshipId = req.params.id;

      const success = await storage.declineFriendRequest(friendshipId, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Friend request not found or already responded to" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error declining friend request:", error);
      res.status(500).json({ error: "Failed to decline friend request" });
    }
  });

  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const pending = await storage.getPendingRequests(userId);
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  app.delete("/api/friends/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const friendshipId = req.params.id;

      const success = await storage.unfriend(friendshipId, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Friendship not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error unfriending:", error);
      res.status(500).json({ error: "Failed to unfriend" });
    }
  });

  app.get("/api/friends/activity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await storage.getFriendActivity(userId, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching friend activity:", error);
      res.status(500).json({ error: "Failed to fetch friend activity" });
    }
  });

  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const settings = {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        language: "en",
        theme: "system" as const,
        emailNotifications: true,
        pushNotifications: true,
        weeklySummary: true,
        profileVisibility: "friends" as const,
        dataSharing: false,
        profileImageUrl: user.profileImageUrl || undefined,
      };

      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { firstName, lastName, username, email, profileImageUrl } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;

      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        await db.update(users).set(updateData).where(eq(users.id, userId));
      }

      const updatedUser = await storage.getUser(userId);
      const settings = {
        firstName: updatedUser?.firstName || "",
        lastName: updatedUser?.lastName || "",
        username: updatedUser?.username || "",
        email: updatedUser?.email || "",
        language: "en",
        theme: "system" as const,
        emailNotifications: true,
        pushNotifications: true,
        weeklySummary: true,
        profileVisibility: "friends" as const,
        dataSharing: false,
        profileImageUrl: updatedUser?.profileImageUrl || undefined,
      };

      res.json(settings);
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
