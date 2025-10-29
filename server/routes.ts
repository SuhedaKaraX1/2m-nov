import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, seedDatabase } from "./storage";
import { insertChallengeHistorySchema } from "@shared/schema";
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

      res.json({
        success: true,
        historyEntry,
        pointsEarned: challenge.points,
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

  const httpServer = createServer(app);

  return httpServer;
}
