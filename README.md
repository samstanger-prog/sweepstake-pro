# SweepStake Pro

Private football sweepstake for up to **20 players**. Mock **48-team FIFA World Cup 2026** format before live API sync.

## Features

- Join with invite code + name (no account required)
- **Dynamic two-pot draw:** N players → top N FIFA-ranked teams (Pot A) + remaining 48−N (Pot B)
- 48 teams, 12 groups (A–L), 104 fixtures (group + R32 → Final + third-place)
- Admin simulation: group stage, knockout, full, or fast simulate
- Scoring: goals all stages, cumulative knockout milestones, World Cup winner bonus
- Mobile-first leaderboard, rules page, and admin panel

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Deploy on Vercel

## Quick Start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run all migrations in order:
   - [`001_initial.sql`](supabase/migrations/001_initial.sql)
   - [`002_participant_slug.sql`](supabase/migrations/002_participant_slug.sql)
   - [`003_rebalance_pots.sql`](supabase/migrations/003_rebalance_pots.sql) *(optional if 004 run on fresh DB)*
   - [`004_48_teams.sql`](supabase/migrations/004_48_teams.sql)
3. Copy **Project URL**, **anon key**, and **service role key** from Settings → API

### 2. Environment

Copy `.env.example` to `.env.local`:

```bash
USE_MOCK_DATA=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET=your-strong-secret
# API_FOOTBALL_API_KEY=...  # when USE_MOCK_DATA=false (future)
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
3. **Admin** — Run Team Draw (dynamic Pot A / Pot B from FIFA rankings)
4. **Admin** — Run Full Tournament Simulation (or step through group → knockout)
5. **Leaderboard** (`/leaderboard`) — rankings; tap a name for their profile

After upgrading to 48 teams: **Reset tournament** → **Team Draw** → **Simulate**.

## Mock vs Real Data

| `USE_MOCK_DATA` | Behavior |
|-----------------|----------|
| `true` (default) | Fixtures from local templates; simulation generates scores |
| `false` | API-Football stub (`league=1`, `season=2026`) — seed not implemented yet |

**Live API plan:** Hourly cron fetches `fixtures?league=1&season=2026` → writes Supabase → app reads DB only (~24 req/day fits [API-Football free tier](https://www.api-football.com/pricing)). Never call the API on each page view.

## Scoring Rules

See **`/rules`** in the app for the full breakdown.

**Goals — all stages:** +1 per goal (group, knockout, third-place match).

**Group stage only:** +3 win, +1 draw.

**Knockout (cumulative):** R32 +5, R16/QF/SF/Final +10 each, +15 World Cup winner.

**Third-place match:** goal points only (no round milestone).

**Reset:** Admin → Reset tournament (type invite code) clears draw/scores but keeps players.

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
  mock/           # WC 2026 teams + 104 fixture templates
  simulation/     # Group/knockout simulation
  scoring/        # Points calculation
  draw/           # Dynamic two-pot assignment
  data/           # Mock + API-Football providers
  supabase/       # DB clients
supabase/migrations/
```

## License

MIT
