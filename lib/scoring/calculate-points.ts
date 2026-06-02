import type { Match, ScoreDetailItem, Team, TeamScoreDetail } from "@/lib/supabase/types";

const ROUND_POINTS: Record<string, number> = {
  "Round of 16": 5,
  "Quarter-final": 10,
  "Semi-final": 15,
  Final: 20,
};

const WINNER_BONUS = 30;

function opponentName(
  match: Match,
  teamId: string,
  teamMap: Map<string, Team>
): string {
  const oppId =
    match.home_team_id === teamId ? match.away_team_id : match.home_team_id;
  const opp = teamMap.get(oppId);
  if (opp?.code === "TBD") return "TBD";
  return opp ? `${opp.flag_emoji} ${opp.name}`.trim() : "Unknown";
}

function scoreLine(match: Match, teamId: string): string {
  const isHome = match.home_team_id === teamId;
  const gf = isHome ? match.home_goals! : match.away_goals!;
  const ga = isHome ? match.away_goals! : match.home_goals!;
  return `${gf}–${ga}`;
}

function resultLabel(match: Match, teamId: string): string {
  const isHome = match.home_team_id === teamId;
  const gf = isHome ? match.home_goals! : match.away_goals!;
  const ga = isHome ? match.away_goals! : match.home_goals!;
  if (gf > ga) return "W";
  if (gf < ga) return "L";
  return "D";
}

function groupMatchPoints(
  goalsFor: number,
  goalsAgainst: number
): { total: number; parts: string[] } {
  const parts: string[] = [];
  let total = 0;

  if (goalsFor > goalsAgainst) {
    total += 3;
    parts.push("win +3");
  } else if (goalsFor === goalsAgainst) {
    total += 1;
    parts.push("draw +1");
  }
  if (goalsFor > 0) {
    total += goalsFor;
    parts.push(`${goalsFor} goal${goalsFor > 1 ? "s" : ""} +${goalsFor}`);
  }
  if (goalsAgainst === 0) {
    total += 2;
    parts.push("clean sheet +2");
  }

  return { total, parts };
}

export function calculateTeamPoints(
  teamId: string,
  team: Team,
  matches: Match[],
  teamMap: Map<string, Team>
): TeamScoreDetail {
  const items: ScoreDetailItem[] = [];
  let matchPoints = 0;
  let progressionPoints = 0;
  let bonusPoints = 0;

  const teamMatches = matches.filter(
    (m) =>
      m.status === "FT" &&
      (m.home_team_id === teamId || m.away_team_id === teamId)
  );

  const groupMatches = teamMatches
    .filter((m) => m.round === "Group Stage")
    .sort((a, b) => a.fixture_id - b.fixture_id);

  for (const m of groupMatches) {
    const isHome = m.home_team_id === teamId;
    const goalsFor = isHome ? m.home_goals! : m.away_goals!;
    const goalsAgainst = isHome ? m.away_goals! : m.home_goals!;
    const { total, parts } = groupMatchPoints(goalsFor, goalsAgainst);
    if (total === 0 && parts.length === 0) continue;

    matchPoints += total;
    const prefix = m.group_name ? `Group ${m.group_name}` : "Group";
    const opponent = opponentName(m, teamId, teamMap);
    const scoring = parts.length > 0 ? ` — ${parts.join(", ")}` : "";

    items.push({
      description: `${prefix} · ${scoreLine(m, teamId)} vs ${opponent} (${resultLabel(m, teamId)})${scoring}`,
      points: total,
    });
  }

  const knockoutMatches = teamMatches
    .filter((m) => m.round !== "Group Stage")
    .sort((a, b) => (a.knockout_order ?? 0) - (b.knockout_order ?? 0));

  for (const m of knockoutMatches) {
    const opponent = opponentName(m, teamId, teamMap);
    items.push({
      description: `${m.round} · ${scoreLine(m, teamId)} vs ${opponent} (${resultLabel(m, teamId)})`,
      points: 0,
    });
  }

  if (knockoutMatches.length > 0) {
    const deepest = knockoutMatches[knockoutMatches.length - 1];
    const pts = ROUND_POINTS[deepest.round] ?? 0;
    if (pts > 0) {
      progressionPoints += pts;
      items.push({
        description: `Reached ${deepest.round}`,
        points: pts,
      });
    }
  }

  const final = matches.find(
    (m) =>
      m.round === "Final" &&
      m.status === "FT" &&
      m.winner_team_id === teamId
  );
  if (final) {
    bonusPoints += WINNER_BONUS;
    const opponent = opponentName(final, teamId, teamMap);
    items.push({
      description: `Tournament winner · ${scoreLine(final, teamId)} vs ${opponent} in the Final`,
      points: WINNER_BONUS,
    });
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
    items,
  };
}
