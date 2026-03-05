# ZRF Rugby App - Zanzibar Rugby Federation

## Overview
A mobile-first PWA serving as the digital infrastructure for rugby in Zanzibar. Tracks players, clubs, events, participation, and supports rugby growth through an XP-based engagement system.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Shadcn/ui, Wouter routing, TanStack Query
- **Backend**: Express.js, PostgreSQL with Drizzle ORM
- **Auth**: Session-based with express-session + connect-pg-simple, scrypt password hashing

## Architecture
- `shared/schema.ts` - All database models (federations, clubs, users, memberships, events, attendance, activities, xp_transactions)
- `server/db.ts` - Drizzle + pg pool connection
- `server/storage.ts` - DatabaseStorage class implementing IStorage interface
- `server/routes.ts` - All API routes with session auth
- `server/seed.ts` - Seeds ZRF federation, 3 clubs, 5 users, sample events/activities
- `client/src/App.tsx` - Main app with auth gating and bottom nav routing
- `client/src/hooks/use-auth.tsx` - AuthProvider context with login/register/logout
- `client/src/components/bottom-nav.tsx` - Mobile bottom navigation (Home | Play | Check-In | Train | Profile)
- `client/src/components/membership-card.tsx` - Digital membership card with tier gradients

## Pages
- `/` - Home (activity feed, upcoming events, club rankings)
- `/play` - Events & clubs tabs
- `/check-in` - Event check-in and activity logging
- `/train` - Training programs library
- `/profile` - Membership card, XP progress, clubs, activity history
- `/clubs/:id` - Club detail with members, events, score
- `/events/:id` - Event detail with check-in and attendee list

## Key Features
1. User registration/login with phone number
2. Club directory with membership applications
3. Events calendar with check-in system
4. Activity tracking (gym, running, SAQ, etc.)
5. XP system with 4 tiers: Green (0-199), Blue (200-499), Silver (500-999), Gold (1000+)
6. Digital membership card with tier-based gradient
7. Club score system (50% of member XP)
8. Activity feed and leaderboards

## Color Theme
Rugby-inspired green palette (HSL 152 primary) with tier colors:
- Green tier: emerald gradient
- Blue tier: blue gradient
- Silver tier: gray gradient
- Gold tier: amber gradient

## Database
PostgreSQL with Drizzle ORM. Schema pushed via `npm run db:push`. Seed data runs on startup if no federations exist.

## Running
`npm run dev` starts Express + Vite dev server on port 5000.
