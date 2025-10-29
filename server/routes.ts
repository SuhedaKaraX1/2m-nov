import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChallengeHistorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all challenges
  app.get("/api/challenges", async (_req, res) => {
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  // Get random challenge
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

  // Get challenge by ID
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

  // Get challenges by category
  app.get("/api/challenges/category/:category", async (req, res) => {
    try {
      const challenges = await storage.getChallengesByCategory(req.params.category);
      res.json(challenges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenges by category" });
    }
  });

  // Complete a challenge
  app.post("/api/challenges/:id/complete", async (req, res) => {
    try {
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

      // Add to history
      const historyEntry = await storage.addHistoryEntry({
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

  // Get user progress
  app.get("/api/progress", async (_req, res) => {
    try {
      const progress = await storage.getUserProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Get challenge history
  app.get("/api/history", async (_req, res) => {
    try {
      const history = await storage.getAllHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
