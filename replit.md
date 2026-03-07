# ZRF Rugby App — TeamBase
## Overview
A mobile-first PWA for the Zanzibar Rugby Federation. A premium club-first sports platform where each user enters "their club's digital home" with dynamic club branding, premium design system, and club-led UX across all screens.

## Tech Stack
- **Frontend**: React + TypeScript, Vite, TailwindCSS, Shadcn/ui, Wouter routing, TanStack Query
- **Backend**: Express.js, PostgreSQL with Drizzle ORM
- **Auth**: Session-based with express-session + connect-pg-simple, scrypt password hashing

## Design System
- **Style**: Premium sports platform — Strava + Apple Fitness + Notion inspired, flat, clean, club-branded
- **Radius**: 0.375rem (6px) globally via `--radius` in index.css
- **Shadows**: Flat (no shadows), border-based card styling (1px border)
- **Layout**: Dividers instead of card wrapping where possible, compact grids, split grid sections, timeline feeds
- **Typography**: Section headers use `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
- **Background**: Warm light `40 10% 98%` instead of pure white
- **Font**: Montserrat, mobile-first bottom nav

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
- `/` - Home: Club Hero, Next Session block, Split Grid (Club Momentum | Activity Feed), Quick Log strip, ZRF Club Table
- `/play` - Events & Clubs directory: premium filter row, event cards with club identity, clubs tab with color swatches
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

### Tabs:
1. **Overview** - 3x2 compact stat grid + quick action buttons
2. **Members** - Compact rows with drill-down, search + pending membership tabs
3. **Events** - Create, edit, delete events with inline forms
4. **Clubs** - View/edit club details + Club Branding Editor:
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
8. Digital membership card with club/tier-based gradient
9. Club score system (50% of member XP)
10. Activity feed and leaderboards
11. Admin dashboard with full member/event/club management + branding editor
12. Collapsible training programs (accordion sections)
13. Event filtering by type
14. Branded bottom navigation

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

## PWA Support
- `client/public/manifest.json` - Web app manifest with icons, shortcuts, theme
- `client/public/sw.js` - Service worker with stale-while-revalidate caching
- `client/public/icon.svg` / `icon-maskable.svg` - SVG app icons
- `client/src/components/pwa-install-prompt.tsx` - Install banner
- Service worker registered in `client/src/main.tsx`

## Running
`npm run dev` starts Express + Vite dev server on port 5000.
