# 2Mins Challenge App

## Overview

2Mins is a wellness and productivity application that helps users build better habits through quick, 2-minute challenges. The app focuses on five key life areas: physical health, mental wellness, learning, finance, and relationships. Users complete challenges, track their progress through streaks and points, and build sustainable habits through micro-actions.

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

**Key Features**:
- Category-based challenge browsing (5 categories: physical, mental, learning, finance, relationships)
- Circular timer component for 2-minute challenge tracking
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

**Development Mode**: Custom Vite integration for hot module replacement and development experience. The Express server acts as middleware, with Vite handling the frontend in development mode.

**Production Build**: Frontend is built to `dist/public`, backend is bundled using esbuild to `dist/index.js`.

### Data Storage

**ORM**: Drizzle ORM for type-safe database operations.

**Database Provider**: Configured for PostgreSQL (specifically Neon Database serverless).

**Schema Design**:
- `challenges` table: Stores challenge definitions with title, description, category, subcategory, difficulty, points, and instructions
- `userProgress` table: Single-row table tracking user stats (total challenges completed, current streak, longest streak, total points, last completed date)
- `challengeHistory` table: Records each completed challenge with timestamp and time spent

**In-Memory Fallback**: The `MemStorage` class in `server/storage.ts` provides an in-memory implementation of the storage interface, allowing the application to run without a database for development/testing purposes.

**Type Safety**: Drizzle-Zod integration generates Zod schemas from database schema for runtime validation.

### Authentication and Authorization

Currently, the application does not implement user authentication. The system tracks a single user's progress (hardcoded user ID). This is a simplification for the current version - future versions would implement proper multi-user authentication.

### External Dependencies

**Database**: 
- Neon Database (@neondatabase/serverless) - Serverless PostgreSQL
- Connection via `DATABASE_URL` environment variable
- Migrations managed through Drizzle Kit (`drizzle.config.ts`)

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