import type { DataProvider } from "./provider";

/**
 * Phase 2: API-Football integration
 *
 * TODO: See lib/data/api-football-rounds.ts for World Cup 2026 (league=1, season=2026)
 * fixture/round/standings endpoints and round-name normalization.
 */
export class ApiFootballProvider implements DataProvider {
  async seedCompetition(_competitionId: string): Promise<void> {
    void _competitionId;
    throw new Error(
      "API-Football provider not implemented. Set USE_MOCK_DATA=true for development."
    );
  }
}
