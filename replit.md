# ZRF Rugby App - Zanzibar Rugby Federation

## Overview
A mobile-first PWA serving as the digital infrastructure for rugby in Zanzibar. Tracks players, clubs, events, participation, and supports rugby growth through an XP-based engagement system.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Shadcn/ui, Wouter routing, TanStack Query
- **Backend**: Express.js, PostgreSQL with Drizzle ORM
- **Auth**: Session-based with express-session + connect-pg-simple, scrypt password hashing

## Design System
- **Style**: Strava + Apple Fitness + Notion inspired — flat, clean, sports dashboard
- **Radius**: 0.375rem (6px) globally via `--radius` in index.css
- **Shadows**: Flat (no shadows), border-based card styling (1px border)
- **Layout**: Dividers instead of card wrapping where possible, compact grids, timeline-style feeds
- **Typography**: Section headers use `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
- **Colors**: Rugby green (HSL 152), tier colors (green/blue/silver/gold), role colors (blue/purple/cyan/pink/red)
- **Font**: Montserrat, mobile-first bottom nav

## Architecture
- `shared/schema.ts` - All database models plus Zod validation schemas (including admin schemas)
- `server/db.ts` - Drizzle + pg pool connection
- `server/storage.ts` - DatabaseStorage class implementing IStorage interface (includes admin CRUD methods)
- `server/routes.ts` - All API routes with session auth + RBAC admin middleware
- `server/seed.ts` - Seeds ZRF federation, 3 clubs, 5 users, sample events/activities
- `client/src/App.tsx` - Main app with auth gating, bottom nav routing, profile completion toast
- `client/src/hooks/use-auth.tsx` - AuthProvider context with login/register/updateProfile/logout
- `client/src/components/bottom-nav.tsx` - Mobile bottom navigation (backdrop blur, clean inline layout)
- `client/src/components/membership-card.tsx` - Digital membership card with tier gradients
- `client/src/pages/admin.tsx` - Admin dashboard with Overview/Members/Events/Clubs tabs + member drill-down

## Pages
- `/` - Home (3-col stats strip, XP progress, next event hero, club rankings, activity timeline, quick check-in grid)
- `/play` - Events (filter row: All/Training/Matches/Tournaments/Touch/Social, grouped by Today/Upcoming/Past) & clubs (compact rows)
- `/check-in` - Event check-in hero + 2-column quick activity grid (Run/Gym/SAQ/Recovery/Social/Watching)
- `/train` - Training programs as collapsible accordion sections
- `/profile` - Membership card, XP progress bar with tier labels, clubs as compact rows, activity timeline, XP history with dividers
- `/complete-profile` - Full ZRF registration form with accordion sections
- `/admin` - Admin dashboard (admin role only) with 4 tabs + member detail drill-down
- `/clubs/:id` - Club detail with members, events, score
- `/events/:id` - Event detail with check-in and attendee list

## Admin Dashboard
Accessible only to users with role="admin". Bottom nav shows Admin tab (shield icon) instead of Train for admin users.

### Tabs:
1. **Overview** - 3x2 compact stat grid (Members/Players/Supporters/Pending/Events/Clubs) + quick action buttons
2. **Members** - Compact rows with avatar, name, role/tier/XP summary, ChevronRight for drill-down. Search + pending membership tabs. Tapping a member shows full detail view.
3. **Events** - Create, edit, delete events. Inline form for event creation/editing.
4. **Clubs** - View and edit club details (name, location, description, training schedule)

### Member Detail View:
Shown when tapping a member in the Members tab:
- Header with avatar initials, name, role badge, tier badge, XP
- Role change dropdown (admin action)
- Profile info rows (phone, email, DOB, gender, nationality, country, emergency contact)
- Player/Coach specific fields (position, level, height, weight / certification, team)
- Club memberships with status badges
- Recent activities with XP earned
- XP transaction history
- Back button to return to member list

### RBAC:
- `requireAdmin` middleware checks user role is "admin" before allowing access to admin routes
- Event creation restricted to admins only
- All admin mutations validated with Zod schemas (adminUpdateEventSchema, adminUpdateClubSchema)

### Demo Accounts:
- Phone: +255777100001 / Password: rugby123 (Juma Hassan, Player, Blue tier)
- Phone: +255777100002 / Password: rugby123 (Amina Said, Coach, Silver tier)
- Phone: +255777100003 / Password: rugby123 (Bakari Mohamed, Player, Blue tier)
- Phone: +255777100004 / Password: rugby123 (Fatma Ali, Player, Green tier)
- Phone: +255777100005 / Password: rugby123 (Omar Khamis, Admin, Gold tier)
- Phone: +255777100006 / Password: rugby123 (Salma Rashid, Supporter, Green tier)

## Registration Flow (Two-Step)
1. **Quick Sign-Up**: Name + Phone → auto-generated temp password → instant login
2. **Profile Completion**: Toast prompt → /complete-profile with accordion sections for personal info, emergency contact, rugby details, role-specific fields, password setup, consents
3. Server sets `profileCompleted = true` when completion >= 80%

## Key Features
1. Two-step registration (quick signup → profile completion)
2. Club directory with membership applications
3. Events calendar with check-in system (+25 XP)
4. Activity tracking (gym, running, SAQ, etc.) with server-controlled XP
5. XP system with 4 tiers: Green (0-199), Blue (200-499), Silver (500-999), Gold (1000+)
6. Digital membership card with tier-based gradient
7. Club score system (50% of member XP)
8. Activity feed and leaderboards
9. Admin dashboard with full member/event/club management + member drill-down
10. Collapsible training programs (accordion sections)
11. Event filtering by type

## API Endpoints
### Public
- POST `/api/register` - Quick register (fullName, phone)
- POST `/api/login` - Login (phone, password)
- POST `/api/logout` - Logout
- GET `/api/user` - Current user
- GET `/api/clubs`, `/api/events`, `/api/feed`, `/api/leaderboard/*`

### Authenticated
- PATCH `/api/user/profile` - Update profile
- POST `/api/activities` - Log activity
- POST `/api/check-in/event` - Event check-in
- POST `/api/memberships` - Join club
- GET `/api/memberships`, `/api/activities`, `/api/xp-history`

### Admin Only (requireAdmin)
- GET `/api/admin/stats` - Dashboard statistics (totalUsers, totalPlayers, totalSupporters, pendingMemberships, upcomingEvents, totalClubs)
- GET `/api/admin/users` - All users (password excluded)
- GET `/api/admin/users/:id` - Full user detail (profile, memberships with clubs, activities, XP history, attendance)
- PATCH `/api/admin/users/:id/role` - Change user role (player/coach/personnel/supporter/admin)
- GET `/api/admin/memberships?status=` - All memberships (filterable)
- PATCH `/api/admin/memberships/:id` - Approve/reject membership
- POST `/api/events` - Create event
- PATCH `/api/admin/events/:id` - Edit event
- DELETE `/api/admin/events/:id` - Delete event
- PATCH `/api/admin/clubs/:id` - Edit club

## PWA Support
The app is installable as a Progressive Web App:
- `client/public/manifest.json` - Web app manifest with icons, shortcuts, theme
- `client/public/sw.js` - Service worker with stale-while-revalidate caching for assets, network-first for API
- `client/public/icon.svg` / `icon-maskable.svg` - SVG app icons
- `client/src/components/pwa-install-prompt.tsx` - Install banner (auto-shows after 3s, dismissible for 7 days)
- Service worker registered in `client/src/main.tsx`
- Apple meta tags in `client/index.html` for iOS home screen support

## Running
`npm run dev` starts Express + Vite dev server on port 5000.
