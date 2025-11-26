import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, seedDatabase } from "./storage";
import {
  insertChallengeHistorySchema,
  insertChallengeSchema,
  users,
} from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth, registerUser } from "./localAuth";
import passport from "passport";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth & seed
  await setupAuth(app);
  setupLocalAuth();
  
  // Seed database
  await seedDatabase();

  // -----------------------
  // AUTH: Register & Login
  // -----------------------
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password, firstName, lastName } = req.body;
      if (!email || !username || !password) {
        return res
          .status(400)
          .json({ message: "Email, username, and password are required" });
      }

      const user = await registerUser(
        email,
        username,
        password,
        firstName,
        lastName,
      );

      req.login(user, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Registration successful but login failed" });
        }
        const { password: _pw, ...sanitizedUser } = user as any;
        res.json(sanitizedUser);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/local/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ message: "Authentication error" });
      if (!user)
        return res
          .status(401)
          .json({ message: info?.message || "Invalid credentials" });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        const { password: _pw, ...sanitizedUser } = user as any;
        res.json(sanitizedUser);
      });
    })(req, res, next);
  });

  // -----------------------
  // AUTH: Logout
  // -----------------------
  const doLogout = (req: any, res: any) => {
    try {
      if (typeof req.logout === "function") {
        return req.logout((err: any) => {
          if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ message: "Logout failed" });
          }
          if (req.session) {
            req.session.destroy(() => {
              res.clearCookie("connect.sid");
              return res.status(200).json({ success: true });
            });
          } else {
            res.clearCookie("connect.sid");
            return res.status(200).json({ success: true });
          }
        });
      }
      if (req.session) {
        req.session.destroy(() => {
          res.clearCookie("connect.sid");
          return res.status(200).json({ success: true });
        });
      } else {
        res.clearCookie("connect.sid");
        return res.status(200).json({ success: true });
      }
    } catch (e) {
      console.error("Logout exception:", e);
      return res.status(500).json({ message: "Logout failed" });
    }
  };

  app.post("/api/logout", doLogout);
  app.get("/api/logout", doLogout);

  // -----------------------
  // AUTH: Onboarding
  // -----------------------
  app.post("/api/auth/onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const {
        preferredCategories = [],
        hasMentalHealthConcerns = "no",
        mentalHealthDetails = "",
        preferredDays = [],
      } = req.body ?? {};

      const updated = await storage.updateUserPreferences(userId, {
        preferredCategories,
        hasMentalHealthConcerns,
        mentalHealthDetails,
        preferredDays,
        onboardingCompleted: 1,
      });

      if (!updated) {
        return res
          .status(404)
          .json({ message: "User not found or update failed" });
      }

      const { password: _pw, ...sanitizedUser } = updated as any;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Onboarding error:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // -----------------------
  // AUTH: Current User
  // -----------------------
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.isAuthenticated?.() || !req.user) return res.json(null);
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) return res.json(null);

      const user = await storage.getUser(userId);
      if (!user) return res.json(null);

      const { password: _pw, ...sanitizedUser } = user as any;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // -----------------------
  // Public challenge routes
  // -----------------------
  // TEK endpoint: /api/challenges?category=physical|mental|...
  app.get("/api/challenges", async (req, res) => {
    try {
      const { category } = req.query as { category?: string };
      const all = await storage.getAllChallenges();

      const payload =
        category && category !== "all"
          ? all.filter((c) => c.category === category)
          : all;

      return res.json(payload);
    } catch (e) {
      console.error("Failed to fetch challenges:", e);
      return res.status(500).json({ error: "Failed to fetch challenges" });
    }
  });

  app.get("/api/challenges/random", async (_req, res) => {
    try {
      const challenge = await storage.getRandomChallenge();
      if (!challenge)
        return res.status(404).json({ error: "No challenges available" });
      res.json(challenge);
    } catch (e) {
      console.error("Failed to fetch random challenge:", e);
      res.status(500).json({ error: "Failed to fetch random challenge" });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challenge = await storage.getChallengeById(req.params.id);
      if (!challenge)
        return res.status(404).json({ error: "Challenge not found" });
      res.json(challenge);
    } catch (e) {
      console.error("Failed to fetch challenge:", e);
      res.status(500).json({ error: "Failed to fetch challenge" });
    }
  });

  app.get("/api/challenges/category/:category", async (req, res) => {
    try {
      const challenges = await storage.getChallengesByCategory(
        req.params.category,
      );
      res.json(challenges);
    } catch (e) {
      console.error("Failed to fetch challenges by category:", e);
      res.status(500).json({ error: "Failed to fetch challenges by category" });
    }
  });

  // -----------------------
  // Personalized challenges (korundu)
  // -----------------------
  app.get(
    "/api/challenges/personalized",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const user = await storage.getUser(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        let challenges = await storage.getAllChallenges();

        if (
          user.onboardingCompleted === 1 &&
          user.preferredCategories &&
          user.preferredCategories.length > 0
        ) {
          challenges = challenges.filter((c) =>
            (user.preferredCategories as string[]).includes(c.category),
          );
        }

        const shuffled = challenges.sort(() => Math.random() - 0.5);
        res.json(shuffled);
      } catch (error) {
        console.error("Error fetching personalized challenges:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch personalized challenges" });
      }
    },
  );

  // -----------------------
  // Protected: CRUD
  // -----------------------
  app.post("/api/challenges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const challengeData = insertChallengeSchema.parse(req.body);
      const challenge = await storage.createChallenge(challengeData, userId);
      res.status(201).json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid challenge data", details: error.errors });
      }
      console.error("Error creating challenge:", error);
      res.status(500).json({ error: "Failed to create challenge" });
    }
  });

  app.patch("/api/challenges/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const challengeId = req.params.id;
      const updates = insertChallengeSchema.partial().parse(req.body);
      const challenge = await storage.updateChallenge(
        challengeId,
        updates,
        userId,
      );
      if (!challenge) {
        return res
          .status(404)
          .json({ error: "Challenge not found or unauthorized" });
      }
      res.json(challenge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid challenge data", details: error.errors });
      }
      console.error("Error updating challenge:", error);
      res.status(500).json({ error: "Failed to update challenge" });
    }
  });

  app.delete("/api/challenges/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const challengeId = req.params.id;
      const deleted = await storage.deleteChallenge(challengeId, userId);
      if (!deleted) {
        return res
          .status(404)
          .json({ error: "Challenge not found or unauthorized" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting challenge:", error);
      res.status(500).json({ error: "Failed to delete challenge" });
    }
  });

  app.get(
    "/api/challenges/user/my-challenges",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const challenges = await storage.getUserChallenges(userId);
        res.json(challenges);
      } catch (error) {
        console.error("Error fetching user challenges:", error);
        res.status(500).json({ error: "Failed to fetch user challenges" });
      }
    },
  );

  app.post(
    "/api/challenges/:id/complete",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const challengeId = req.params.id;
        const challenge = await storage.getChallengeById(challengeId);
        if (!challenge)
          return res.status(404).json({ error: "Challenge not found" });

        const bodySchema = z.object({
          timeSpent: z.number().int().min(0).max(120),
        });
        const { timeSpent } = bodySchema.parse(req.body);

        const historyEntry = await storage.addHistoryEntry(userId, {
          challengeId,
          completedAt: new Date().toISOString(),
          timeSpent,
          pointsEarned: challenge.points,
        });

        const newAchievements =
          await storage.checkAndUnlockAchievements(userId);

        res.json({
          success: true,
          historyEntry,
          pointsEarned: challenge.points,
          newAchievements,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ error: "Invalid request data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to complete challenge" });
      }
    },
  );

  // -----------------------
  // Progress & History
  // -----------------------
  app.get("/api/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const history = await storage.getAllHistory(userId);
      res.json(history);
    } catch {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // -----------------------
  // Achievements
  // -----------------------
  app.get("/api/achievements", async (_req, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch {
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post(
    "/api/achievements/check",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const newAchievements =
          await storage.checkAndUnlockAchievements(userId);
        res.json({ newAchievements });
      } catch {
        res.status(500).json({ error: "Failed to check achievements" });
      }
    },
  );

  // -----------------------
  // Share (Public)
  // -----------------------
  app.get("/api/achievements/share/:userAchievementId", async (req, res) => {
    try {
      const { userAchievementId } = req.params;
      const share = await storage.getAchievementShare(userAchievementId);
      if (!share)
        return res.status(404).json({ error: "Achievement not found" });
      res.json(share);
    } catch (error) {
      console.error("Error fetching shared achievement:", error);
      res.status(500).json({ error: "Failed to fetch shared achievement" });
    }
  });

  // -----------------------
  // Analytics
  // -----------------------
  app.get("/api/analytics/daily", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const days = parseInt(req.query.days as string) || 30;
      const stats = await storage.getDailyStats(userId, days);
      res.json(stats);
    } catch {
      res.status(500).json({ error: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/analytics/category", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const distribution = await storage.getCategoryDistribution(userId);
      res.json(distribution);
    } catch {
      res.status(500).json({ error: "Failed to fetch category distribution" });
    }
  });

  app.get("/api/analytics/weekly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const trend = await storage.getWeeklyTrend(userId);
      res.json(trend);
    } catch {
      res.status(500).json({ error: "Failed to fetch weekly trend" });
    }
  });

  app.get("/api/analytics/monthly", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const trend = await storage.getMonthlyTrend(userId);
      res.json(trend);
    } catch {
      res.status(500).json({ error: "Failed to fetch monthly trend" });
    }
  });

  // -----------------------
  // Friends
  // -----------------------
  app.post("/api/friends/request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const friendship = await storage.sendFriendRequest(userId, email);
      if (!friendship) {
        return res.status(400).json({
          error:
            "Unable to send friend request. User may not exist or friendship already exists.",
        });
      }
      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ error: "Failed to send friend request" });
    }
  });

  app.patch(
    "/api/friends/:id/accept",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const friendshipId = req.params.id;
        const friendship = await storage.acceptFriendRequest(
          friendshipId,
          userId,
        );
        if (!friendship) {
          return res.status(404).json({
            error: "Friend request not found or already responded to",
          });
        }
        res.json(friendship);
      } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ error: "Failed to accept friend request" });
      }
    },
  );

  app.patch(
    "/api/friends/:id/decline",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const friendshipId = req.params.id;
        const success = await storage.declineFriendRequest(
          friendshipId,
          userId,
        );
        if (!success) {
          return res.status(404).json({
            error: "Friend request not found or already responded to",
          });
        }
        res.json({ success: true });
      } catch (error) {
        console.error("Error declining friend request:", error);
        res.status(500).json({ error: "Failed to decline friend request" });
      }
    },
  );

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

  // -----------------------
  // Settings
  // -----------------------
  app.get("/api/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

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
      const { firstName, lastName, username, email, profileImageUrl } =
        req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (profileImageUrl !== undefined)
        updateData.profileImageUrl = profileImageUrl;

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

  // -----------------------
  // Scheduled Challenges
  // -----------------------
  app.get(
    "/api/scheduled-challenges",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const scheduled = await storage.getScheduledChallenges(userId);
        res.json(scheduled);
      } catch (error) {
        console.error("Error fetching scheduled challenges:", error);
        res.status(500).json({ error: "Failed to fetch scheduled challenges" });
      }
    },
  );

  app.post(
    "/api/scheduled-challenges",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const { challengeId, scheduledTime, status } = req.body;

        if (!challengeId || !scheduledTime) {
          return res
            .status(400)
            .json({ error: "challengeId and scheduledTime are required" });
        }

        const scheduled = await storage.createScheduledChallenge(userId, {
          userId,
          challengeId,
          scheduledTime: new Date(scheduledTime),
          status: status || "pending",
        });

        res.status(201).json(scheduled);
      } catch (error) {
        console.error("Error creating scheduled challenge:", error);
        res.status(500).json({ error: "Failed to create scheduled challenge" });
      }
    },
  );

  app.patch(
    "/api/scheduled-challenges/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.scheduledTime) {
          updateData.scheduledTime = new Date(updateData.scheduledTime);
        }
        if (updateData.snoozedUntil) {
          updateData.snoozedUntil = new Date(updateData.snoozedUntil);
        }

        const updated = await storage.updateScheduledChallenge(
          id,
          userId,
          updateData,
        );

        if (!updated) {
          return res
            .status(404)
            .json({ error: "Scheduled challenge not found" });
        }

        res.json(updated);
      } catch (error) {
        console.error("Error updating scheduled challenge:", error);
        res.status(500).json({ error: "Failed to update scheduled challenge" });
      }
    },
  );

  app.delete(
    "/api/scheduled-challenges/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        const { id } = req.params;

        const success = await storage.deleteScheduledChallenge(id, userId);

        if (!success) {
          return res
            .status(404)
            .json({ error: "Scheduled challenge not found" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting scheduled challenge:", error);
        res.status(500).json({ error: "Failed to delete scheduled challenge" });
      }
    },
  );

  // -----------------------
  // Challenge Alarm & Scheduling
  // -----------------------
  
  // Update user's schedule settings
  app.put("/api/settings/schedule", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      
      // Validate request body
      const settingsSchema = z.object({
        challengeScheduleTimes: z.array(z.object({
          start: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
          end: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
        })).optional(),
        enableNotifications: z.number().min(0).max(1).optional(),
      });

      const validated = settingsSchema.parse(req.body);

      const updatedUser = await storage.updateUserPreferences(userId, {
        challengeScheduleTimes: validated.challengeScheduleTimes,
        enableNotifications: validated.enableNotifications,
      });

      // Auto-generate scheduled challenges based on new time slots
      // Always call this - it will clean up old challenges if time slots are cleared
      try {
        await storage.generateScheduledChallengesForUser(userId, 2); // Generate for next 48 hours
      } catch (genError) {
        console.error("Error generating scheduled challenges:", genError);
        // Don't fail the whole request, just log the error
      }

      res.json(updatedUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid schedule settings format", details: error.errors });
      }
      console.error("Error updating schedule settings:", error);
      res.status(500).json({ error: "Failed to update schedule settings" });
    }
  });

  // Get next scheduled challenge
  app.get("/api/challenges/scheduled/next", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const nextChallenge = await storage.getNextScheduledChallenge(userId);
      
      if (!nextChallenge) {
        return res.status(404).json({ message: "No scheduled challenges" });
      }

      res.json(nextChallenge);
    } catch (error) {
      console.error("Error getting next scheduled challenge:", error);
      res.status(500).json({ error: "Failed to get next scheduled challenge" });
    }
  });

  // Postpone a scheduled challenge
  app.post("/api/challenges/scheduled/:id/postpone", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { id } = req.params;

      const postponed = await storage.postponeScheduledChallenge(id, userId);
      res.json(postponed);
    } catch (error: any) {
      if (error.message === 'CHALLENGE_NOT_FOUND') {
        return res.status(404).json({ error: "Challenge not found" });
      }
      console.error("Error postponing challenge:", error);
      res.status(500).json({ error: "Failed to postpone challenge" });
    }
  });

  // Cancel a scheduled challenge
  app.post("/api/challenges/scheduled/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { id } = req.params;

      const cancelled = await storage.cancelScheduledChallenge(id, userId);
      
      if (!cancelled) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      res.json({ success: true, message: "Challenge cancelled" });
    } catch (error) {
      console.error("Error cancelling challenge:", error);
      res.status(500).json({ error: "Failed to cancel challenge" });
    }
  });

  // Complete a scheduled challenge
  app.post("/api/challenges/scheduled/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { id } = req.params;
      const { status } = req.body; // 'success' or 'failed'

      if (!status || !['success', 'failed'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'success' or 'failed'" });
      }

      const historyEntry = await storage.completeScheduledChallenge(id, userId, status);
      res.json(historyEntry);
    } catch (error: any) {
      if (error.message === 'CHALLENGE_NOT_FOUND') {
        return res.status(404).json({ error: "Challenge not found" });
      }
      console.error("Error completing challenge:", error);
      res.status(500).json({ error: "Failed to complete challenge" });
    }
  });

  // -----------------------
  // HTTP server
  // -----------------------
  const httpServer = createServer(app);
  return httpServer;
}
