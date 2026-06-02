export type CompetitionStatus = "open" | "drawn" | "active" | "complete";
export type MatchStatus = "NS" | "FT";
export type Pot = "A" | "B";

export interface Team {
  id: string;
  name: string;
  code: string;
  flag_emoji: string;
  pot: Pot;
  seed: number;
  fifa_rank: number | null;
  api_team_id: number | null;
  group_name: string | null;
}

export interface Competition {
  id: string;
  name: string;
  invite_code: string;
  status: CompetitionStatus;
  created_at: string;
}

export interface Participant {
  id: string;
  competition_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface UserTeam {
  id: string;
  participant_id: string;
  team_id: string;
  pot: Pot;
  competition_id: string;
}

export interface Match {
  id: string;
  competition_id: string;
  fixture_id: number;
  home_team_id: string;
  away_team_id: string;
  home_goals: number | null;
  away_goals: number | null;
  status: MatchStatus;
  round: string;
  group_name: string | null;
  knockout_order: number | null;
  winner_team_id: string | null;
  next_match_fixture_id: number | null;
}

export interface Standing {
  id: string;
  competition_id: string;
  team_id: string;
  group_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface ParticipantScore {
  id: string;
  participant_id: string;
  competition_id: string;
  match_points: number;
  progression_points: number;
  bonus_points: number;
  total_points: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  teams: TeamScoreDetail[];
}

export interface ScoreDetailItem {
  description: string;
  points: number;
}

export interface TeamScoreDetail {
  teamId: string;
  teamName: string;
  flagEmoji: string;
  pot: Pot;
  matchPoints: number;
  progressionPoints: number;
  bonusPoints: number;
  total: number;
  /** @deprecated use items — kept for old cached breakdowns */
  details?: string[];
  items: ScoreDetailItem[];
}

export interface MockFixtureTemplate {
  fixture_id: number;
  home_code: string;
  away_code: string;
  round: string;
  group_name?: string;
  knockout_order?: number;
  next_match_fixture_id?: number;
}
