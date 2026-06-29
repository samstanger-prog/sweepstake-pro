import type { Match, ScoreDetailItem, Team, TeamScoreDetail } from "@/lib/supabase/types";
import {
  GROUP_DRAW_POINTS,
  GROUP_GOAL_POINTS,
  GROUP_WIN_POINTS,
  KNOCKOUT_GOAL_POINTS,
  KNOCKOUT_ROUND_POINTS,
  KNOCKOUT_ROUNDS_ORDER,
  type KnockoutRound,
  WORLD_CUP_WINNER_BONUS,
} from "./rules";

/** Highest knockout milestone reached (bracket slot), not merely rounds with FT results. */
function getKnockoutRoundsReached(
  teamId: string,
  matches: Match[]
): KnockoutRound[] {
  let highestIndex = -1;

  for (const m of matches) {
    if (m.home_team_id !== teamId && m.away_team_id !== teamId) continue;
    if (m.round === "Group Stage") continue;

    if (m.round === "Third-place") {
      const sfIndex = KNOCKOUT_ROUNDS_ORDER.indexOf("Semi-final");
      if (sfIndex > highestIndex) highestIndex = sfIndex;
      continue;
    }

    const idx = KNOCKOUT_ROUNDS_ORDER.indexOf(m.round as KnockoutRound);
    if (idx >= 0 && idx > highestIndex) highestIndex = idx;
  }

  if (highestIndex < 0) return [];

  return KNOCKOUT_ROUNDS_ORDER.slice(0, highestIndex + 1);
}

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
    total += GROUP_WIN_POINTS;
    parts.push(`win +${GROUP_WIN_POINTS}`);
  } else if (goalsFor === goalsAgainst) {
    total += GROUP_DRAW_POINTS;
    parts.push(`draw +${GROUP_DRAW_POINTS}`);
  }
  if (goalsFor > 0) {
    total += goalsFor * GROUP_GOAL_POINTS;
    parts.push(
      `${goalsFor} goal${goalsFor > 1 ? "s" : ""} +${goalsFor * GROUP_GOAL_POINTS}`
    );
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
      (m.home_team_id === teamId || m.away_team_id === teamId) &&
      (m.status === "FT" || (m.is_live && m.home_goals !== null && m.away_goals !== null))
  );

  const groupMatches = teamMatches
    .filter((m) => m.round === "Group Stage")
    .sort((a, b) => a.fixture_id - b.fixture_id);

  for (const m of groupMatches) {
    const isHome = m.home_team_id === teamId;
    const goalsFor = isHome ? m.home_goals! : m.away_goals!;
    const goalsAgainst = isHome ? m.away_goals! : m.home_goals!;
    const opponent = opponentName(m, teamId, teamMap);
    const prefix = m.group_name ? `Group ${m.group_name}` : "Group";

    if (m.is_live && m.status !== "FT") {
      const goalPts = goalsFor * GROUP_GOAL_POINTS;
      if (goalPts <= 0) continue;
      matchPoints += goalPts;
      items.push({
        description: `${prefix} · ${scoreLine(m, teamId)} vs ${opponent} (live) — ${goalsFor} goal${goalsFor > 1 ? "s" : ""} +${goalPts}`,
        points: goalPts,
      });
      continue;
    }

    const { total, parts } = groupMatchPoints(goalsFor, goalsAgainst);
    if (total === 0 && parts.length === 0) continue;

    matchPoints += total;
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
    const isHome = m.home_team_id === teamId;
    const goalsFor = isHome ? m.home_goals! : m.away_goals!;
    const goalPts = goalsFor * KNOCKOUT_GOAL_POINTS;
    const opponent = opponentName(m, teamId, teamMap);

    if (m.is_live && m.status !== "FT") {
      if (goalPts <= 0) continue;
      matchPoints += goalPts;
      items.push({
        description: `${m.round} · ${scoreLine(m, teamId)} vs ${opponent} (live) — ${goalsFor} goal${goalsFor > 1 ? "s" : ""} +${goalPts}`,
        points: goalPts,
      });
      continue;
    }

    const scoring =
      goalPts > 0
        ? ` — ${goalsFor} goal${goalsFor > 1 ? "s" : ""} +${goalPts}`
        : "";

    matchPoints += goalPts;
    items.push({
      description: `${m.round} · ${scoreLine(m, teamId)} vs ${opponent} (${resultLabel(m, teamId)})${scoring}`,
      points: goalPts,
    });
  }

  for (const roundName of getKnockoutRoundsReached(teamId, matches)) {
    const pts = KNOCKOUT_ROUND_POINTS[roundName];
    progressionPoints += pts;
    items.push({
      description: `Reached ${roundName} (cumulative)`,
      points: pts,
    });
  }

  const final = matches.find(
    (m) =>
      m.round === "Final" &&
      m.status === "FT" &&
      m.winner_team_id === teamId
  );
  if (final) {
    bonusPoints += WORLD_CUP_WINNER_BONUS;
    const opponent = opponentName(final, teamId, teamMap);
    items.push({
      description: `Win World Cup · ${scoreLine(final, teamId)} vs ${opponent} in the Final`,
      points: WORLD_CUP_WINNER_BONUS,
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
