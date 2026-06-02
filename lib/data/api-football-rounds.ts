/**
 * TODO (API-Football / API-Sports — World Cup 2026)
 *
 * Guide: https://www.api-football.com/news/post/fifa-world-cup-2026-guide-to-using-data-with-api-sports
 *
 * Integration targets:
 *   - league=1, season=2026
 *   - GET /fixtures?league=1&season=2026  (~104 matches)
 *   - GET /fixtures/rounds?league=1&season=2026  (round name strings)
 *   - GET /standings?league=1&season=2026  (12 groups)
 *
 * Map API round labels → internal `matches.round` values used in scoring
 * (see KNOCKOUT_ROUNDS_ORDER in lib/scoring/rules.ts).
 *
 * Example mappings to verify when implementing ApiFootballProvider:
 *   "Group stage"     → "Group Stage"
 *   "Round of 32"     → "Round of 32"
 *   "Round of 16"     → "Round of 16"
 *   "Quarter-finals"  → "Quarter-final"   (API may use plural / different casing)
 *   "Semi-finals"     → "Semi-final"
 *   "Final"           → "Final"
 *
 * Use coverage flags from GET /leagues before relying on live data.
 */

export const API_FOOTBALL_WORLD_CUP = {
  leagueId: 1,
  season: 2026,
} as const;

/** Placeholder — fill when implementing sync from /fixtures/rounds */
export function normalizeApiRound(apiRound: string): string {
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
  };
  return map[apiRound] ?? apiRound;
}
