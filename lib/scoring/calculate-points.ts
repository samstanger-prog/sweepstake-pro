import type { Match, Team, TeamScoreDetail } from "@/lib/supabase/types";

const ROUND_POINTS: Record<string, number> = {
  "Round of 16": 5,
  "Quarter-final": 10,
  "Semi-final": 15,
  Final: 20,
};

const WINNER_BONUS = 30;

export function calculateTeamPoints(
  teamId: string,
  team: Team,
  matches: Match[]
): TeamScoreDetail {
  const details: string[] = [];
  let matchPoints = 0;
  let progressionPoints = 0;
  let bonusPoints = 0;

  const teamMatches = matches.filter(
    (m) =>
      m.status === "FT" &&
      (m.home_team_id === teamId || m.away_team_id === teamId)
  );

  for (const m of teamMatches) {
    const isHome = m.home_team_id === teamId;
    const goalsFor = isHome ? m.home_goals! : m.away_goals!;
    const goalsAgainst = isHome ? m.away_goals! : m.home_goals!;

    if (m.round === "Group Stage") {
      if (goalsFor > goalsAgainst) {
        matchPoints += 3;
        details.push(`Win vs opponent (+3)`);
      } else if (goalsFor === goalsAgainst) {
        matchPoints += 1;
        details.push(`Draw (+1)`);
      }
      if (goalsFor > 0) {
        matchPoints += goalsFor;
        details.push(`${goalsFor} goal(s) scored (+${goalsFor})`);
      }
      if (goalsAgainst === 0) {
        matchPoints += 2;
        details.push(`Clean sheet (+2)`);
      }
    }
  }

  const knockoutMatches = teamMatches
    .filter((m) => m.round !== "Group Stage")
    .sort((a, b) => (b.knockout_order ?? 0) - (a.knockout_order ?? 0));

  if (knockoutMatches.length > 0) {
    const deepest = knockoutMatches[0];
    const pts = ROUND_POINTS[deepest.round] ?? 0;
    if (pts > 0) {
      progressionPoints += pts;
      details.push(`${deepest.round} reached (+${pts})`);
    }
  }

  const final = matches.find(
    (m) => m.round === "Final" && m.status === "FT" && m.winner_team_id === teamId
  );
  if (final) {
    bonusPoints += WINNER_BONUS;
    details.push(`Tournament winner (+${WINNER_BONUS})`);
  }

  const total = matchPoints + progressionPoints + bonusPoints;

  return {
    teamId,
    teamName: team.name,
    flagEmoji: team.flag_emoji,
    pot: team.pot,
    matchPoints,
    progressionPoints,
    bonusPoints,
    total,
    details,
  };
}
