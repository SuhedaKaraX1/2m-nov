import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, seedDatabase } from "./storage";
import { insertChallengeHistorySchema, insertChallengeSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Seed database on startup
  await seedDatabase();

  // Auth routes - return null if not authenticated (don't require auth)
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.json(null);
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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

  // Protected routes (require authentication)
  
  // Create a new challenge
  app.post("/api/challenges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const challenges = await storage.getUserChallenges(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching user challenges:", error);
      res.status(500).json({ error: "Failed to fetch user challenges" });
    }
  });
  app.post("/api/challenges/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/achievements/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const newAchievements = await storage.checkAndUnlockAchievements(userId);
      res.json({ newAchievements });
    } catch (error) {
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/daily", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getDailyStats(userId, days);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/analytics/category", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const distribution = await storage.getCategoryDistribution(userId);
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category distribution" });
    }
  });

  app.get("/api/analytics/weekly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trend = await storage.getWeeklyTrend(userId);
      res.json(trend);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weekly trend" });
    }
  });

  app.get("/api/analytics/monthly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trend = await storage.getMonthlyTrend(userId);
      res.json(trend);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly trend" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
