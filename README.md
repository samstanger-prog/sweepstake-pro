# SweepStake Pro

Private football sweepstake for 12–20 players. Fully functional with **mock tournament data** before any real API integration.

## Features

- Join with invite code + name (no account required)
- Two-pot team draw (Pot A = 8 strong teams, Pot B = 16 others)
- Mock 24-team tournament (group stage + knockout)
- Admin simulation: group stage, knockout, full, or fast simulate
- Scoring: match results + tournament progression + winner bonus
- Mobile-first leaderboard and admin panel

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Deploy on Vercel

## Quick Start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run both migrations:
   - [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)
   - [`supabase/migrations/002_participant_slug.sql`](supabase/migrations/002_participant_slug.sql)
3. Copy **Project URL**, **anon key**, and **service role key** from Settings → API

### 2. Environment

Copy `.env.example` to `.env.local`:

```bash
USE_MOCK_DATA=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET=your-strong-secret
```

On `/admin`, enter **the secret value** you set (e.g. `your-strong-secret`), not the text `ADMIN_SECRET`. Restart `npm run dev` after changing `.env.local`.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage Flow

1. **Admin** (`/admin`) — log in with `ADMIN_SECRET`, create a competition, copy invite code
2. **Players** (`/`) — join with code + name → profile at `/c/CODE/your-name`
3. **Already joined?** — use **Find my profile** on the home page (same code + name)
4. **Admin** — Run Team Draw (assigns 1 Pot A + 1 Pot B team per player)
5. **Admin** — Run Full Tournament Simulation (or step through group → knockout)
6. **Leaderboard** (`/leaderboard`) — rankings; tap a name for their profile

## Mock vs Real Data

| `USE_MOCK_DATA` | Behavior |
|-----------------|----------|
| `true` (default) | All fixtures from local mock templates; simulation generates scores |
| `false` | Reserved for API-Football (not implemented yet) |

## Scoring Rules

See **`/rules`** in the app for the full breakdown.

**Goals — all stages:** +1 per goal (group and knockout).

**Group stage only:** +3 win, +1 draw.

**Knockout (cumulative — each round the team plays in adds once):**

| Round reached | Points |
|---------------|--------|
| Round of 32 | +5 |
| Round of 16 | +10 |
| Quarter-final | +10 |
| Semi-final | +10 |
| Final | +10 |
| Win World Cup | +15 bonus |

Example: R16 → QF → SF → Final and win = 10+10+10+10 + 15 = **45** progression/bonus (plus +1 per goal in every match).

**24-team mock note:** No Round of 32 until 48-team expansion. Re-run simulation in Admin after rule changes.

**Simulation:** ~10% forced draws in random mode; use **Fast Simulate** for 2–1 every match.

**Reset:** Admin → Reset tournament (type invite code to confirm) clears draw/scores but keeps players.

## Deploy on Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add the same env vars from `.env.local`
4. Deploy

## Project Structure

```
app/              # Pages and server actions
components/       # UI components
lib/
  mock/           # Tournament JSON + fixture templates
  simulation/     # Group/knockout simulation
  scoring/        # Points calculation
  draw/           # Two-pot assignment
  supabase/       # DB clients
supabase/migrations/
```

## License

MIT
