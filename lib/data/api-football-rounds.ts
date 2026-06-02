/**
 * API-Football / API-Sports — FIFA World Cup 2026
 *
 * Guide: https://www.api-football.com/news/post/fifa-world-cup-2026-guide-to-using-data-with-api-sports
 *
 * Key identifiers: league=1, season=2026
 *
 * Endpoints (sync server-side → Supabase; never call per page view):
 *   GET /leagues?id=1&season=2026           — coverage flags
 *   GET /teams?league=1&season=2026           — 48 teams (team.id, code, name, logo)
 *   GET /fixtures?league=1&season=2026        — ~104 fixtures (fixture.id, league.round, goals, status)
 *   GET /fixtures/rounds?league=1&season=2026 — round names ("Group Stage - 1", …)
 *   GET /standings?league=1&season=2026       — 12 groups ("Group A", …)
 *
 * Live (future cron, ~hourly on free tier): fixtures?league=1&season=2026&status=…
 * Batch details: fixtures?ids=ID1-ID2-… (max 20 per request)
 *
 * Map API round labels → internal matches.round (see KNOCKOUT_ROUNDS_ORDER in rules.ts).
 */

export const API_FOOTBALL_WORLD_CUP = {
  leagueId: 1,
  season: 2026,
  baseUrl: "https://v3.football.api-sports.io",
} as const;

/** "Group A" → "A" for standings / matches.group_name */
export function normalizeApiGroup(apiGroup: string): string {
  const m = apiGroup.match(/Group\s+([A-L])/i);
  return m ? m[1].toUpperCase() : apiGroup;
}

/** Map API fixture round string → internal round (null = skip, e.g. unknown). */
export function normalizeApiRound(apiRound: string): string | null {
  const trimmed = apiRound.trim();
  const map: Record<string, string> = {
    "Group stage": "Group Stage",
    "Group Stage": "Group Stage",
    "Round of 32": "Round of 32",
    "Round of 16": "Round of 16",
    "Quarter-finals": "Quarter-final",
    "Quarter-final": "Quarter-final",
    "Semi-finals": "Semi-final",
    "Semi-final": "Semi-final",
    Final: "Final",
    "3rd Place Final": "Third-place",
    "Third Place": "Third-place",
    "Third-place": "Third-place",
  };

  if (map[trimmed]) return map[trimmed];
  if (/^Group Stage\s*-\s*\d+$/i.test(trimmed)) return "Group Stage";
  if (/3rd|third/i.test(trimmed) && /place/i.test(trimmed)) return "Third-place";

  return trimmed;
}
