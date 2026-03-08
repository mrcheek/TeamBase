# ZRF Rugby App — TeamBase
## Overview
A mobile-first PWA for the Zanzibar Rugby Federation. A premium club-first sports platform where each user enters "their club's digital home" with dynamic club branding, premium design system, and club-led UX across all screens.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Shadcn/ui, Wouter routing, TanStack Query
- **Backend**: Express.js, PostgreSQL with Drizzle ORM
- **Auth**: Session-based with express-session + connect-pg-simple, scrypt password hashing

## Design System
- **Style**: Premium sports platform — section-based layout, NOT card-heavy dashboard
- **Layout Philosophy**: Identity → space → section → divider → section. No background boxes on homepage — only flat sections with dividers. Cards used only for Membership Card on Profile. 32px (`py-8`) vertical rhythm between sections.
- **Radius**: 3-tier system: `--radius-sm: 6px` (inputs), `--radius-md: 10px` (buttons), `--radius-lg: 16px` (cards/hero)
- **Border**: `--border: 220 10% 88%` (soft neutral for inputs/rows), `--divider: 220 10% 92%` (even lighter, for list separation)
- **Text hierarchy**: `--text-primary: 220 15% 15%`, `--text-secondary: 220 10% 40%`, `--text-muted: 220 8% 60%`
- **Shadows**: Flat (no shadows) except GO button and membership card
- **Layout**: Full-width rows, divider lines, section headers, hero sections. NOT rounded cards stacked.
- **Typography**: Section headers use `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
- **Background**: Warm light `40 10% 98%` instead of pure white
- **Font**: Montserrat, mobile-first bottom nav
- **Color usage**: Club color only for buttons, progress bars, active tabs, event tags. Everything else neutral grey.
- **Dark mode**: ThemeProvider (`client/src/hooks/use-theme.tsx`) with class-based toggle, persisted in localStorage. Toggle in Profile Settings.

### Club Branding
Each club has its own color palette stored in the `clubs` table:
- `primaryColor`, `secondaryColor`, `accentColor` — hex colors
- `textOnPrimary`, `textOnSecondary` — text colors for contrast
- `logoUrl`, `bannerUrl` — club crest and banner images
- `brandStyle` — `classic` | `bold` | `minimal`

**Club CSS Variables** (set dynamically by ClubThemeProvider):
- `--club-primary`, `--club-secondary`, `--club-accent` — HSL values
- `--club-primary-foreground`, `--club-secondary-foreground`
- `--club-surface` (subtle tinted panel bg), `--club-surface-strong`, `--club-border`

**Tailwind Utilities**: `bg-club-primary`, `text-club-primary-foreground`, `border-club-border`, etc.

**Seeded Club Colors**:
- Sharks RFC: `#0A2342` navy / `#C8A951` gold / `#FFD700` accent
- Stone Town RFC: `#8B0000` dark red / `#FFFFFF` white / `#DC143C` accent
- Pemba RFC: `#006400` dark green / `#000000` black / `#32CD32` accent

### Club Theme Engine
- `client/src/hooks/use-club-theme.tsx` — React context + `hexToHSL()` / `lightenHSL()` utilities
- Fetches user's active membership → club data → sets CSS vars on `document.documentElement`
- Falls back to federation green (`152 62% 30%`) if no active club
- Wrapped in `ClubThemeProvider` inside `App.tsx` (inside AuthProvider)

## Architecture
- `shared/schema.ts` - All database models plus Zod validation schemas (including admin schemas)
- `server/db.ts` - Drizzle + pg pool connection
- `server/storage.ts` - DatabaseStorage class implementing IStorage interface (includes admin CRUD methods)
- `server/routes.ts` - All API routes with session auth + RBAC admin middleware
- `server/seed.ts` - Seeds ZRF federation, 3 clubs, 5 users, sample events/activities
- `client/src/App.tsx` - Main app with auth gating, ClubThemeProvider, club-branded header, bottom nav routing
- `client/src/hooks/use-auth.tsx` - AuthProvider context with login/register/updateProfile/logout
- `client/src/hooks/use-club-theme.tsx` - Club theme context provider (CSS vars, club data)
- `client/src/components/bottom-nav.tsx` - Mobile bottom navigation with club-branded active states
- `client/src/components/membership-card.tsx` - Digital membership card with club/tier gradients + photo
- `client/src/components/image-upload.tsx` - Shared image upload component (avatar & banner variants)
- `client/src/components/user-avatar.tsx` - Shared user avatar component (photo with initials fallback, 5 sizes)
- `client/src/pages/admin.tsx` - Admin dashboard with Overview/Members/Events/Clubs tabs + club branding editor

## Information Architecture (Bottom Nav)
**Home | Play | GO | Club | Profile** — 5 tabs for all users. Admin accessed from Profile settings.

## Pages
- `/` - Home: 4 blocks only — (1) Club Identity (flat row, no banner), (2) Next Session (dominant, no background box), (3) Today's Challenge (compact row + subtle weekly progress), (4) Club Activity (max 3 items with initials avatars + "View Club →"). No Quick Log (lives in GO). 32px vertical rhythm between sections.
- `/play` - Events | Training | Battle tabs: events with type filters, training library (accordions), weekly club battle standings
- `/check-in` - Event check-in (SCAN EVENT QR CTA) + duotone image card grid (first card full-width, rest 2-column) with bold white labels + XP overlay, success state with XP animation
- `/club` - Club page: Feed | Noticeboard | Roster tabs. Full club activity feed, announcements, member list with roles/tiers
- `/profile` - Membership card (club-branded), XP section with `id="xp"` anchor, tier progress, clubs, activity timeline, XP history, settings (dark mode, notifications, admin link for admins)
- `/complete-profile` - Full ZRF registration form with accordion sections
- `/admin` - Admin dashboard (admin role only, accessed from Profile settings) with 4 tabs + member detail + club branding editor
- `/clubs/:id` - Club community hub: banner hero, club identity, next session, split rank/momentum, members, activity feed
- `/events/:id` - Live event hub: hero header, check-in CTA, split type/status, attending, related activity

## App Header
- Left: Club crest (logo or initials in club-primary circle) + club name + "TEAMBASE" label
- Right: XP pill badge (tier-colored: emerald/blue/gray/amber) → taps to `/profile#xp`

## Admin Dashboard
Accessed via "Admin Dashboard" link in Profile settings (visible to any admin tier). 
Design philosophy: Lists → rows, Forms → vertical layout, Actions → buttons, Stats → small grids. No card wrappers.

### Three-Tier Admin Hierarchy:
| Level | Role Value | Scope | Can Assign |
|-------|-----------|-------|------------|
| TeamBase Admin | `teambase_admin` | Full platform access — all federations, clubs, users | Any role |
| Federation Admin | `federation_admin` | Their federation — all clubs, events, memberships, users within it | Up to `club_admin` |
| Club Admin | `club_admin` | Their own club only — club members, events, details | Cannot assign admin roles |

**Governance chain**: Each admin level can only be created by the level above:
- `club_admin` → confirmed by `federation_admin` or `teambase_admin`
- `federation_admin` → created by `teambase_admin` only
- No self-promotion. No peer promotion.

**Scoping**:
- `club_admin` scope determined by active membership(s)
- `federation_admin` scope determined by `user.federationId`
- Self-role-change blocked for all users

**Shared helpers** (in `shared/schema.ts`): `isAnyAdmin()`, `isTeambaseAdmin()`, `isFederationAdminOrAbove()`, `canAssignRole()`

### Server Middleware:
- `requireAnyAdmin` — any of the 3 admin roles
- `requireFederationAdmin` — `teambase_admin` or `federation_admin` only
- Club-scoped checks via `getUserClubIds()` for club admin routes

### Frontend Scoping:
- Club admins: see only their club's members, events, club details. No role dropdown. No overview tab.
- Federation admins: see all clubs, members, events. Role dropdown shows up to `club_admin`.
- TeamBase admins: see everything. Role dropdown shows all roles.
- Admin level badge shown at top of dashboard.

### Tabs:
1. **Overview** (federation+ only) - 3x2 compact stat grid + quick action buttons
2. **Members** - Flat rows with underline sub-tabs (All/Pending), search, drill-down detail
3. **Events** - Flat rows with inline create/edit forms
4. **Clubs** - Flat rows with inline club branding editor

### Demo Accounts:
- Phone: +255777100001 / Password: rugby123 (Juma Hassan, Player, Blue tier)
- Phone: +255777100002 / Password: rugby123 (Amina Said, Coach, Silver tier)
- Phone: +255777100003 / Password: rugby123 (Bakari Mohamed, Player, Blue tier)
- Phone: +255777100004 / Password: rugby123 (Fatma Ali, Club Admin - Pemba RFC, Green tier)
- Phone: +255777100005 / Password: rugby123 (Omar Khamis, Federation Admin, Gold tier)
- Phone: +255777100006 / Password: rugby123 (Salma Rashid, Supporter, Green tier)

## Registration Flow (Two-Step)
1. **Quick Sign-Up**: Name + Phone → auto-generated temp password → instant login
2. **Profile Completion**: Toast prompt → /complete-profile with accordion sections
3. Server sets `profileCompleted = true` when completion >= 80%

## Key Features
1. Club-first dynamic branding (per-club colors, logos, banners)
2. Club theme engine with CSS custom properties
3. Two-step registration (quick signup → profile completion)
4. Club directory with membership applications
5. Events calendar with check-in system (+25 XP)
6. Activity tracking (gym, running, SAQ, etc.) with server-controlled XP
7. XP system with 4 tiers: Green (0-199), Blue (200-499), Silver (500-999), Gold (1000+)
8. Digital membership card with club/tier-based gradient + QR flip
9. Club score system (50% of member XP)
10. Activity feed and leaderboards
11. Admin dashboard with full member/event/club management + branding editor
12. Rich training library with duotone image headers, expandable drills (description, duration, difficulty, coaching tips)
13. Event filtering by type
14. Branded bottom navigation with 56px GO button
15. Club logo/banner file uploads (multer, max 2MB, stored in /uploads/)
16. Push notifications (Web Push API + VAPID, per-club delivery, admin "Send Reminder" per event)
17. PWA offline support (cache-first for bundles/images, network-first for API, offline activity queue, offline banner)
18. Daily Club Challenge (rotating challenges with XP reward, weekly club goal progress bar)
19. Club Activity Feed (timeline-style on homepage, replaces heatmap + leaderboard)
20. Dark mode toggle (class-based, localStorage persisted)
21. Profile photo upload (mandatory in registration, editable from profile, shown across all avatar locations)

## API Endpoints
### Public
- POST `/api/register` - Quick register (fullName, phone)
- POST `/api/login` - Login (phone, password)
- POST `/api/logout` - Logout
- GET `/api/user` - Current user
- GET `/api/clubs`, `/api/events`, `/api/feed`, `/api/leaderboard/*`, `/api/daily-challenge`

### Authenticated
- PATCH `/api/user/profile` - Update profile
- POST `/api/activities` - Log activity
- POST `/api/check-in/event` - Event check-in
- POST `/api/memberships` - Join club
- GET `/api/memberships`, `/api/activities`, `/api/xp-history`, `/api/club/weekly-stats`, `/api/club/roster`

### Admin (tiered access)
- GET `/api/admin/stats` - Dashboard statistics (federation+)
- GET `/api/admin/users` - All users (federation+)
- GET `/api/admin/users/:id` - Full user detail (federation+)
- PATCH `/api/admin/users/:id/role` - Change user role (federation+, governance enforced)
- GET `/api/admin/memberships?status=` - Memberships (any admin, club admin scoped)
- PATCH `/api/admin/memberships/:id` - Approve/reject membership (any admin, club admin scoped)
- POST `/api/events` - Create event (any admin, club admin scoped)
- PATCH `/api/admin/events/:id` - Edit event (any admin, club admin scoped)
- DELETE `/api/admin/events/:id` - Delete event (any admin, club admin scoped)
- PATCH `/api/admin/clubs/:id` - Edit club (any admin, club admin scoped)
- POST `/api/admin/events/:id/notify` - Send push reminder (federation+)
- POST `/api/upload` - Upload image file (any admin)

### Push Notifications
- GET `/api/push/vapid-key` - Public VAPID key
- POST `/api/push/subscribe` - Save push subscription
- DELETE `/api/push/unsubscribe` - Remove push subscription
- GET `/api/push/status` - Check if user has active subscription

### Activity
- GET `/api/activities/heatmap` - Weekly activity counts (Mon-Sun) for user's club

## PWA Support
- `client/public/manifest.json` - Web app manifest with icons, shortcuts, theme
- `client/public/sw.js` - Service worker with multi-cache strategy (static v2, API v2, images v2), push handlers, notification click
- `client/public/icon.svg` / `icon-maskable.svg` - SVG app icons
- `client/src/components/pwa-install-prompt.tsx` - Install banner
- Service worker registered in `client/src/main.tsx`
- Offline: activity queue in localStorage, offline banner component, stale API cache fallback

## Running
`npm run dev` starts Express + Vite dev server on port 5000.
