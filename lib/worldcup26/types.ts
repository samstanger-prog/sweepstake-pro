export interface Worldcup26Game {
  id: string;
  home_score: string;
  away_score: string;
  home_penalty_score?: string;
  away_penalty_score?: string;
  finished: string;
  time_elapsed: string;
  type: string;
  group: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
}

export interface Worldcup26GamesResponse {
  games: Worldcup26Game[];
}
