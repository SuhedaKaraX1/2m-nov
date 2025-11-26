# 2Mins Challenge App

## Overview

2Mins is a wellness and productivity application that helps users build better habits through quick, 2-minute challenges. The app focuses on five key life areas: physical health, mental wellness, learning, finance, and relationships. Users complete challenges, track their progress through streaks and points, earn achievement badges, view detailed analytics, and build sustainable habits through micro-actions.

The application is built as a full-stack web application using React for the frontend and Express for the backend, with a dark-first Material Design aesthetic optimized for utility and quick interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Shadcn/ui (New York style variant) with Radix UI primitives. This provides a comprehensive set of accessible, unstyled components that are customized with Tailwind CSS. The component library is extensive, including accordions, dialogs, dropdowns, forms, and more.

**Styling Approach**: 
- Tailwind CSS with a custom design system defined in `tailwind.config.ts`
- Dark-first design with CSS variables for theming
- Custom color palette using HSL values for consistent theming
- Material Design principles adapted for wellness/productivity use case
- Typography using Inter (body) and DM Sans (headings) from Google Fonts

**State Management**: 
- TanStack Query (React Query) for server state management
- Query client configured with custom fetch functions and error handling
- No global client state management library (using React's built-in state and context)

**Routing**: Wouter - a lightweight routing library as an alternative to React Router. Routes include:
- Home dashboard (`/`)
- Challenge detail view (`/challenge/:id`)
- All challenges (`/challenges`)
- User progress (`/progress`)
- Challenge history (`/history`)
- Achievements (`/achievements`)
- Analytics dashboard (`/analytics`)

**Key Features**:
- Category-based challenge browsing (5 categories: physical, mental, learning, finance, relationships)
- Circular timer component for 2-minute challenge tracking
- Achievement badges system with 19 predefined achievements across 4 tiers (Bronze, Silver, Gold, Platinum)
- Analytics dashboard with Recharts visualizations:
  - Daily activity charts (bar and line charts)
  - Category distribution (pie chart)
  - Weekly and monthly trend analysis
  - Summary metrics (total challenges, last 30 days, active categories)
- Stats and progress visualization
- Streak tracking system
- Points/gamification system

### Backend Architecture

**Framework**: Express.js with TypeScript, running in ESM module mode.

**API Design**: RESTful API with the following endpoints:
- `GET /api/challenges` - List all challenges
- `GET /api/challenges/random` - Get a random challenge
- `GET /api/challenges/:id` - Get specific challenge
- `GET /api/challenges/category/:category` - Get challenges by category
- `POST /api/challenges/:id/complete` - Complete a challenge
- `GET /api/progress` - Get user progress
- `GET /api/history` - Get challenge history
- `GET /api/achievements` - List all achievements
- `GET /api/achievements/user` - Get user's achievement progress and unlocked achievements
- `GET /api/analytics/daily?days=30` - Get daily challenge statistics (count and points) for last N days
- `GET /api/analytics/category` - Get category distribution with percentages
- `GET /api/analytics/weekly` - Get weekly aggregated statistics for last 12 weeks
- `GET /api/analytics/monthly` - Get monthly aggregated statistics for last 12 months

**Development Mode**: Custom Vite integration for hot module replacement and development experience. The Express server acts as middleware, with Vite handling the frontend in development mode.

**Production Build**: Frontend is built to `dist/public`, backend is bundled using esbuild to `dist/index.js`.

### Data Storage

**Database Provider**: Supabase PostgreSQL - serverless database with built-in security features.

**Database Client**: @supabase/supabase-js for server-side and client-side operations.

**Server-Side Access**: Uses service role key (SUPABASE_SERVICE_ROLE_KEY) to bypass Row Level Security (RLS) policies for backend operations.

**Schema Design**:
- `challenges` table: Stores challenge definitions with title, description, category, subcategory, difficulty, points, and instructions
- `user_progress` table: Tracks per-user stats (total challenges completed, current streak, longest streak, total points, last completed date)
- `challenge_history` table: Records each completed challenge with timestamp and time spent
- `achievements` table: Stores achievement definitions with tier, requirements, and unlock conditions
- `user_achievements` table: Tracks which achievements each user has unlocked
- `friendships` table: Manages friend connections between users

**Storage Implementation**: The `SupabaseStorage` class in `server/supabaseStorage.ts` implements all CRUD operations using Supabase client, with automatic camelCase ↔ snake_case conversion for database fields.

**Fallback Options**: The application can fall back to `DatabaseStorage` (Neon DB via Drizzle ORM) or `MemStorage` (in-memory) if Supabase credentials are not available.

**Type Safety**: Shared schema types ensure consistency between frontend and backend operations.

### Authentication and Authorization

Currently, the application does not implement user authentication. The system tracks a single user's progress (hardcoded user ID). This is a simplification for the current version - future versions would implement proper multi-user authentication.

### External Dependencies

**Database**: 
- Supabase (@supabase/supabase-js) - PostgreSQL with built-in auth and storage
- Connection via `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables
- Schema defined in `supabase-schema.sql` with Row Level Security policies
- Fallback support for Neon Database via Drizzle ORM if Supabase credentials not available

**UI Libraries**:
- Radix UI - Comprehensive set of unstyled, accessible React components
- Lucide React - Icon library for consistent iconography
- Embla Carousel - Carousel/slider component
- cmdk - Command palette component
- date-fns - Date manipulation and formatting

**Form Handling**:
- React Hook Form - Form state management
- @hookform/resolvers - Validation resolver integration
- Zod - Schema validation

**Styling**:
- Tailwind CSS - Utility-first CSS framework
- class-variance-authority - Type-safe variant management
- clsx & tailwind-merge - Conditional class name composition

**Development Tools**:
- Replit-specific plugins for enhanced development experience (cartographer, dev banner, runtime error overlay)
- TypeScript for type safety across the entire stack
- ESBuild for production bundling

**Session Management**:
- connect-pg-simple - PostgreSQL session store (configured but authentication not yet implemented)

### Design System

The application follows a sophisticated dark-first design approach based on Material Design principles, customized for wellness and productivity use cases. Key design decisions include:

- **Color System**: HSL-based variables allowing easy theming and light/dark mode support
- **Spacing**: Consistent spacing using Tailwind's scale (2, 4, 6, 8 as primary units)
- **Typography**: Clear hierarchy with Inter for body text and DM Sans for headings
- **Interactive States**: Hover and active elevation states using custom CSS classes (`hover-elevate`, `active-elevate-2`)
- **Component Borders**: Subtle borders with configurable outlines for buttons, badges, and cards
- **Responsive Layout**: Mobile-first with max-width containers (max-w-2xl for content, max-w-6xl for dashboards)

### Mobile Application (Expo)

**Location**: `mobile/` directory

**Stack**:
- Expo SDK 52
- React Native 0.76.5
- React 18.2.0
- TypeScript 5.6
- React Navigation 7.x
- TanStack Query (React Query)
- Supabase JS Client

**Directory Structure**:
```
mobile/
├── App.tsx                 # Main app entry with providers
├── app.json                # Expo configuration
├── tsconfig.json           # TypeScript configuration
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication state management
│   ├── lib/
│   │   └── supabase.ts     # Supabase client for mobile
│   ├── navigation/
│   │   ├── AppNavigator.tsx # Main navigation structure
│   │   └── types.ts        # Navigation type definitions
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Login/Register
│   │   ├── OnboardingScreen.tsx     # User preferences setup
│   │   ├── HomeScreen.tsx           # Dashboard with stats
│   │   ├── ChallengesScreen.tsx     # Challenge listing
│   │   ├── ChallengeDetailScreen.tsx # Challenge with timer
│   │   ├── ProgressScreen.tsx       # Stats & achievements
│   │   ├── ProfileScreen.tsx        # User profile
│   │   ├── SettingsScreen.tsx       # App settings
│   │   ├── FriendsScreen.tsx        # Friend management
│   │   ├── MyChallengesScreen.tsx   # Custom challenges
│   │   └── CreateChallengeScreen.tsx # Create new challenge
│   ├── services/
│   │   └── api.ts          # API service for backend calls
│   └── types/
│       └── index.ts        # Shared type definitions
```

**Navigation Structure**:
- Auth Stack: Login/Register screens (unauthenticated users)
- Onboarding Stack: Preference setup (new users)
- Main Stack (wraps drawer for proper ChallengeDetail navigation):
  - Drawer Navigator with hamburger menu:
    - Home: Dashboard with stats and featured challenge
    - All Challenges: Browse and filter challenges by category
    - Progress: Stats, achievements, history
    - Journal: Personal reflection and notes
    - Friends: Friend management
    - Profile: User info, preferences, and stats
    - Settings: Notifications, scheduling, account
    - New Challenge: Create custom challenges
    - My Custom Challenges: View created challenges
  - ChallengeDetail: Challenge with timer (pushed as stack screen)

**Running the Mobile App**:
1. Open a new terminal/shell
2. Navigate to mobile directory: `cd mobile`
3. Install dependencies: `npm install`
4. Start Expo: `npx expo start`
5. Scan QR code with Expo Go app on your phone

**Environment Variables** (mobile/.env):
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=your_api_url
```

**Note**: The mobile app is a separate React Native application that shares the same backend API. Web app runs on port 5000, Expo runs on port 8081.

## Recent Changes (November 2025)

- **Drawer Navigation Implementation**: Replaced bottom tab navigation with hamburger menu + sidebar drawer
  - Stack navigator wrapping drawer for proper ChallengeDetail navigation with back gestures
  - Custom drawer content with emoji icons and section groupings (Navigation, Create)
  - Enhanced screens: Profile with stats/preferences, Settings with scheduling options
  - New JournalScreen for personal reflections
- **Complete Mobile App Implementation**: Built feature-complete React Native mobile app
- **Navigation System**: Implemented React Navigation with Auth Stack, Onboarding, and Drawer Navigator
- **All Screens Ported**: 12 screens matching web app functionality:
  - Login/Register with email authentication
  - Onboarding with category and day preferences
  - Home dashboard with stats and featured challenge
  - Challenges listing with category filtering
  - Challenge detail with 2-minute countdown timer
  - Progress tracking with achievements
  - Profile with stats and user preferences display
  - Settings with scheduling and notifications
  - Journal for personal notes
  - Friends management
  - Custom challenge creation
- **API Service**: Created unified API service for backend communication
- **Auth Context**: Implemented authentication state management
- **Supabase Integration**: Added mobile Supabase client with AsyncStorage
- **Type Safety**: Shared types between mobile and web apps