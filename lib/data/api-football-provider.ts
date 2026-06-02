import type { DataProvider } from "./provider";
import { API_FOOTBALL_WORLD_CUP } from "./api-football-rounds";

/**
 * API-Football provider — seed from live WC 2026 data when implemented.
 *
 * seedCompetition() outline (mirror MockDataProvider):
 *   1. GET /teams?league=1&season=2026 → upsert teams (api_team_id, code, fifa_rank TBD)
 *   2. GET /fixtures?league=1&season=2026 → insert matches (fixture.id, normalizeApiRound, group)
 *   3. GET /standings?league=1&season=2026 → init standings for 12 groups
 *
 * Requires API_FOOTBALL_API_KEY. App reads Supabase only; sync via cron (~hourly fits free tier).
 */
export class ApiFootballProvider implements DataProvider {
  async seedCompetition(_competitionId: string): Promise<void> {
    void _competitionId;
    void API_FOOTBALL_WORLD_CUP;

    if (!process.env.API_FOOTBALL_API_KEY) {
      throw new Error(
        "API_FOOTBALL_API_KEY is not set. Set USE_MOCK_DATA=true or add your API key."
      );
    }

    throw new Error(
      "API-Football seedCompetition not implemented yet. Set USE_MOCK_DATA=true for development."
    );
  }
}
