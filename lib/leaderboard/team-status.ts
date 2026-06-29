import type { AssignedTeam } from "@/components/ParticipantTeams";
import type { Match, Team } from "@/lib/supabase/types";
import { parseAssignedTeams } from "@/lib/leaderboard/parse-teams";

function isTbd(teamId: string, teamMap: Map<string, Team>): boolean {
  return teamMap.get(teamId)?.code === "TBD";
}

/** True when the team has no remaining knockout path (display-only). */
export function isTeamEliminated(
  teamId: string,
  matches: Match[],
  teamMap: Map<string, Team>
): boolean {
  const involved = matches.filter(
    (m) => m.home_team_id === teamId || m.away_team_id === teamId
  );

  if (involved.some((m) => m.is_live)) return false;

  const knockout = involved.filter((m) => m.round !== "Group Stage");

  const hasUpcomingKnockout = knockout.some(
    (m) =>
      m.status !== "FT" &&
      !isTbd(m.home_team_id, teamMap) &&
      !isTbd(m.away_team_id, teamMap)
  );
  if (hasUpcomingKnockout) return false;

  const r32Populated = matches.some(
    (m) =>
      m.round === "Round of 32" &&
      !isTbd(m.home_team_id, teamMap) &&
      !isTbd(m.away_team_id, teamMap)
  );

  if (r32Populated && knockout.length === 0) return true;

  const finishedKnockout = knockout.filter((m) => m.status === "FT");
  if (finishedKnockout.length === 0) return false;

  const latest = [...finishedKnockout].sort(
    (a, b) => (b.knockout_order ?? 0) - (a.knockout_order ?? 0)
  )[0];

  return latest.winner_team_id !== teamId;
}

export function withEliminationStatus(
  teams: AssignedTeam[],
  matches: Match[],
  teamMap: Map<string, Team>
): AssignedTeam[] {
  return teams.map((t) => ({
    ...t,
    eliminated: isTeamEliminated(t.teamId, matches, teamMap),
  }));
}

export function buildAssignedTeamsWithStatus(
  userTeams: Parameters<typeof parseAssignedTeams>[0],
  matches: Match[],
  teamMap: Map<string, Team>
): AssignedTeam[] {
  return withEliminationStatus(parseAssignedTeams(userTeams), matches, teamMap);
}
