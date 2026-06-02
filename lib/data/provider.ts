export interface DataProvider {
  seedCompetition(competitionId: string): Promise<void>;
}
