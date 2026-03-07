# ZRF Rugby App — TeamBase
## Overview
A mobile-first PWA for the Zanzibar Rugby Federation. A premium club-first sports platform where each user enters "their club's digital home" with dynamic club branding, premium design system, and club-led UX across all screens.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Shadcn/ui, Wouter routing, TanStack Query
- **Backend**: Express.js, PostgreSQL with Drizzle ORM
- **Auth**: Session-based with express-session + connect-pg-simple, scrypt password hashing

## Design System
- **Style**: Premium sports platform — section-based layout, NOT card-heavy dashboard
- **Layout Philosophy**: Hero → space → section → divider → section. Cards used sparingly (Next Session, Membership Card only). Everything else: flat sections with thin dividers.
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
- `client/src/components/membership-card.tsx` - Digital membership card with club/tier gradients
- `client/src/pages/admin.tsx` - Admin dashboard with Overview/Members/Events/Clubs tabs + club branding editor

## Pages
- `/` - Home: 5 blocks only — (1) Club Hero, (2) Next Session, (3) Today's Challenge + weekly club goal, (4) Club Activity timeline feed, (5) Quick Log
- `/play` - Events & Clubs: underline tab switcher, underline filter indicators, event/club rows with dividers (not cards)
- `/check-in` - Event check-in (SCAN EVENT QR CTA) + 2-column quick activity grid with club-colored tiles, success state with XP animation
- `/train` - Training library: accordion sections with category-colored accent bars, grouped drills
- `/profile` - Membership card (club-branded), XP section with `id="xp"` anchor, tier progress, clubs, activity timeline, XP history
- `/complete-profile` - Full ZRF registration form with accordion sections
- `/admin` - Admin dashboard (admin role only) with 4 tabs + member detail + club branding editor
- `/clubs/:id` - Club community hub: banner hero, club identity, next session, split rank/momentum, members, activity feed
- `/events/:id` - Live event hub: hero header, check-in CTA, split type/status, attending, related activity

## App Header
- Left: Club crest (logo or initials in club-primary circle) + club name + "TEAMBASE" label
- Right: XP pill badge (tier-colored: emerald/blue/gray/amber) → taps to `/profile#xp`

## Admin Dashboard
Accessible only to users with role="admin". Bottom nav shows Admin tab (shield icon) instead of Train for admin users.
Design philosophy: Lists → rows, Forms → vertical layout, Actions → buttons, Stats → small grids. No card wrappers.
- Underline tabs (not pills) for navigation
- Flat row + divider lists (no bordered containers)
- Forms use vertical rhythm without card wrapper
- Cancel buttons use ghost variant, primary buttons use club primary
- Icons use `strokeWidth={1.5}` for lighter visual weight
- Section headers with helper text in club form

### Tabs:
1. **Overview** - 3x2 compact stat grid + quick action buttons (flat rows, divider separated)
2. **Members** - Flat rows with underline sub-tabs (All/Pending), search, drill-down detail
3. **Events** - Flat rows with inline create/edit forms (no card wrapper)
4. **Clubs** - Flat rows with inline club branding editor (no card wrapper), section headers with helper text
   - Logo/Banner URL inputs
   - Color pickers: Primary, Secondary, Accent, Text on Primary/Secondary
   - Brand Style selector (Classic/Bold/Minimal)
   - Live Preview showing club hero, buttons in real-time

### Member Detail View:
Full drill-down showing profile, role change, player/coach fields, memberships, activities, XP history.

### RBAC:
- `requireAdmin` middleware checks user role is "admin"
- Event creation restricted to admins only
- All admin mutations validated with Zod schemas

### Demo Accounts:
- Phone: +255777100001 / Password: rugby123 (Juma Hassan, Player, Blue tier)
- Phone: +255777100002 / Password: rugby123 (Amina Said, Coach, Silver tier)
- Phone: +255777100003 / Password: rugby123 (Bakari Mohamed, Player, Blue tier)
- Phone: +255777100004 / Password: rugby123 (Fatma Ali, Player, Green tier)
- Phone: +255777100005 / Password: rugby123 (Omar Khamis, Admin, Gold tier)
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
12. Collapsible training programs (accordion sections)
13. Event filtering by type
14. Branded bottom navigation with 56px GO button
15. Club logo/banner file uploads (multer, max 2MB, stored in /uploads/)
16. Push notifications (Web Push API + VAPID, per-club delivery, admin "Send Reminder" per event)
17. PWA offline support (cache-first for bundles/images, network-first for API, offline activity queue, offline banner)
18. Daily Club Challenge (rotating challenges with XP reward, weekly club goal progress bar)
19. Club Activity Feed (timeline-style on homepage, replaces heatmap + leaderboard)
20. Dark mode toggle (class-based, localStorage persisted)

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
- GET `/api/memberships`, `/api/activities`, `/api/xp-history`, `/api/club/weekly-stats`

### Admin Only (requireAdmin)
- GET `/api/admin/stats` - Dashboard statistics
- GET `/api/admin/users` - All users (password excluded)
- GET `/api/admin/users/:id` - Full user detail
- PATCH `/api/admin/users/:id/role` - Change user role
- GET `/api/admin/memberships?status=` - All memberships (filterable)
- PATCH `/api/admin/memberships/:id` - Approve/reject membership
- POST `/api/events` - Create event
- PATCH `/api/admin/events/:id` - Edit event
- DELETE `/api/admin/events/:id` - Delete event
- PATCH `/api/admin/clubs/:id` - Edit club (including branding fields)
- POST `/api/admin/events/:id/notify` - Send push reminder to club members
- POST `/api/upload` - Upload image file (returns URL)

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
