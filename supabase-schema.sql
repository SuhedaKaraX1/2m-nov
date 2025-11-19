-- 2Mins Challenge Database Schema for Supabase
-- Copy and paste this into your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE,
  username VARCHAR UNIQUE,
  password VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  preferred_categories JSONB,
  has_mental_health_concerns TEXT,
  mental_health_details TEXT,
  preferred_days JSONB,
  challenge_schedule_times JSONB,
  enable_notifications INTEGER DEFAULT 1,
  onboarding_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  difficulty TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  instructions TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_challenges_completed INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  last_completed_date TEXT
);

-- Challenge History table
CREATE TABLE IF NOT EXISTS challenge_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL,
  time_spent INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  postponed_count INTEGER NOT NULL DEFAULT 0,
  scheduled_time TIMESTAMP
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  requirement_meta JSONB,
  tier TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0
);

-- Friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON friendships(receiver_id);

-- Scheduled Challenges table
CREATE TABLE IF NOT EXISTS scheduled_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  snoozed_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table (for authentication)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for challenges (public read, authenticated create)
CREATE POLICY "Anyone can view challenges" ON challenges
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update own challenges" ON challenges
  FOR UPDATE USING (auth.uid()::text = created_by::text);

CREATE POLICY "Users can delete own challenges" ON challenges
  FOR DELETE USING (auth.uid()::text = created_by::text);

-- RLS Policies for user_progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR ALL USING (auth.uid()::text = user_id::text);

-- RLS Policies for challenge_history
CREATE POLICY "Users can view own history" ON challenge_history
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own history" ON challenge_history
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policies for friendships
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (
    auth.uid()::text = requester_id::text OR 
    auth.uid()::text = receiver_id::text
  );

CREATE POLICY "Users can create friendship requests" ON friendships
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id::text);

CREATE POLICY "Users can update friendships" ON friendships
  FOR UPDATE USING (
    auth.uid()::text = requester_id::text OR 
    auth.uid()::text = receiver_id::text
  );

CREATE POLICY "Users can delete own friendships" ON friendships
  FOR DELETE USING (
    auth.uid()::text = requester_id::text OR 
    auth.uid()::text = receiver_id::text
  );

-- RLS Policies for scheduled_challenges
CREATE POLICY "Users can view own scheduled challenges" ON scheduled_challenges
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own scheduled challenges" ON scheduled_challenges
  FOR ALL USING (auth.uid()::text = user_id::text);
