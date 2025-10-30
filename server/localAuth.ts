import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";

export function setupLocalAuth() {
  passport.use(
    "local",
    new LocalStrategy(
      {
        usernameField: "emailOrUsername",
        passwordField: "password",
      },
      async (emailOrUsername, password, done) => {
        try {
          // Find user by email or username
          const user = await storage.findUserByEmailOrUsername(emailOrUsername);
          
          if (!user) {
            return done(null, false, { message: "Invalid credentials" });
          }

          if (!user.password) {
            return done(null, false, { message: "Please use Replit Auth to login" });
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);
          
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid credentials" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

export async function registerUser(
  email: string,
  username: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<User> {
  // Check if user already exists
  const existingUser = await storage.findUserByEmailOrUsername(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const existingUsername = await storage.findUserByEmailOrUsername(username);
  if (existingUsername) {
    throw new Error("Username already taken");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await storage.createLocalUser({
    email,
    username,
    password: hashedPassword,
    firstName,
    lastName,
  });

  return user;
}
