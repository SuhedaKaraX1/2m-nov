# 2Mins Challenge App

## Overview
2Mins is a wellness and productivity application designed to help users build habits through short, 2-minute challenges. It covers five life areas: physical health, mental wellness, learning, finance, and relationships. The app enables users to track progress, earn achievements, view analytics, and foster sustainable habits. It is a full-stack web application using React and Express, with a dark-first Material Design aesthetic, and also includes a feature-rich mobile application developed with Expo (React Native).

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (Web)
**Framework**: React 18+ with TypeScript, using Vite.
**UI Component System**: Shadcn/ui (New York style) with Radix UI primitives, customized with Tailwind CSS.
**Styling**: Tailwind CSS with a custom dark-first design system, CSS variables for theming, HSL color palette, and specific typography (Inter, DM Sans).
**State Management**: TanStack Query for server state; no global client state library.
**Routing**: Wouter, supporting routes for home, challenges, progress, history, achievements, and analytics.
**Key Features**: Category-based challenge browsing, circular timer, 19-badge achievement system, analytics dashboard (Recharts visualizations for daily activity, category distribution, trends), streak tracking, and gamification.

### Backend Architecture
**Framework**: Express.js with TypeScript (ESM module mode).
**API Design**: RESTful API with endpoints for challenges (list, random, specific, by category, complete), user progress, history, achievements, and analytics (daily, category distribution, weekly, monthly).
**Development**: Custom Vite integration for HMR; Express acts as middleware.
**Production**: Frontend built to `dist/public`, backend bundled with esbuild to `dist/index.js`.

### Data Storage
**Database**: Supabase PostgreSQL, accessed via `@supabase/supabase-js`.
**Server-Side Access**: Uses Supabase service role key to bypass RLS.
**Schema**: Tables for `challenges`, `user_progress`, `challenge_history`, `achievements`, `user_achievements`, and `friendships`.
**Implementation**: `SupabaseStorage` class handles CRUD operations with automatic camelCase ↔ snake_case conversion.
**Fallback**: Supports `DatabaseStorage` (Neon DB via Drizzle ORM) or `MemStorage` (in-memory) if Supabase is unavailable.
**Type Safety**: Shared schema types ensure consistency.

### Authentication and Authorization
Currently tracks a single user's progress without multi-user authentication; future versions will implement full authentication.

### Mobile Application (Expo)
**Location**: `mobile/` directory.
**Stack**: Expo SDK 52, React Native 0.76.5, React 18.2.0, TypeScript 5.6, React Navigation 7.x, TanStack Query, Supabase JS Client.
**Theme System**: Comprehensive, separate from web, with light (purple-blue) and dark (turquoise-green) themes, `ThemeContext` with AsyncStorage persistence, and a theme picker.
**Navigation**: React Navigation with Auth Stack, Onboarding Stack, and a Drawer Navigator for main application flow. Includes 12 screens matching web functionality (Login/Register, Onboarding, Home, Challenges, Progress, Profile, Settings, Journal, Friends, Custom Challenges).
**API Integration**: Unified API service for backend communication.
**Supabase**: Mobile client integrated with AsyncStorage.
**Type Safety**: Shared types with the web application.

## External Dependencies

### Database
- **Supabase**: PostgreSQL, used for primary data storage.
- **Neon Database**: Fallback option via Drizzle ORM.

### UI Libraries (Web)
- **Radix UI**: Unstyled, accessible React components.
- **Shadcn/ui**: Component library based on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library.
- **Embla Carousel**: Carousel component.
- **cmdk**: Command palette component.
- **date-fns**: Date manipulation and formatting.

### Form Handling (Web)
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.

### Styling (Web)
- **Tailwind CSS**: Utility-first CSS framework.
- **class-variance-authority**: Type-safe variant management.
- **clsx & tailwind-merge**: Conditional class name composition.

### Mobile Specific Libraries
- **React Navigation**: For navigation structure in the mobile app.
- **AsyncStorage**: For persisting mobile theme preferences.

### Development Tools
- **TypeScript**: For type safety across the stack.
- **Vite**: Frontend build tool and development server.
- **esbuild**: Production bundling for the backend.

### Session Management
- **connect-pg-simple**: Configured for PostgreSQL session store (though authentication not yet implemented).