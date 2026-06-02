import type { DataProvider } from "./provider";

/** Phase 2: API-Football integration */
export class ApiFootballProvider implements DataProvider {
  async seedCompetition(_competitionId: string): Promise<void> {
    void _competitionId;
    throw new Error(
      "API-Football provider not implemented. Set USE_MOCK_DATA=true for development."
    );
  }
}
