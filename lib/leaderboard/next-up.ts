import type { AssignedTeam } from "@/components/ParticipantTeams";
import type { Match, Team } from "@/lib/supabase/types";
import { isTeamEliminated } from "@/lib/leaderboard/team-status";

function isTbd(teamId: string, teamMap: Map<string, Team>): boolean {
  return teamMap.get(teamId)?.code === "TBD";
}

function roundLabel(round: string, groupName: string | null): string {
  if (round === "Group Stage" && groupName) return `Group ${groupName}`;
  return round;
}

function matchSortKey(m: Match): number {
  return m.knockout_order ?? m.fixture_id;
}

function opponentForMatch(
  match: Match,
  teamId: string,
  teamMap: Map<string, Team>
): { name: string; flag: string } {
  const oppId =
    match.home_team_id === teamId ? match.away_team_id : match.home_team_id;
  const opp = teamMap.get(oppId);
  if (!opp || opp.code === "TBD") return { name: "TBD", flag: "" };
  return { name: opp.name, flag: opp.flag_emoji };
}

export type TeamNextUpLive = {
  kind: "live";
  pot: string;
  teamName: string;
  teamFlag: string;
  roundLabel: string;
  homeName: string;
  homeFlag: string;
  awayName: string;
  awayFlag: string;
  homeGoals: number;
  awayGoals: number;
};

export type TeamNextUpUpcoming = {
  kind: "upcoming";
  pot: string;
  teamName: string;
  teamFlag: string;
  roundLabel: string;
  opponentName: string;
  opponentFlag: string;
};

export type TeamNextUpOut = {
  kind: "out";
  pot: string;
  teamName: string;
  teamFlag: string;
};

export type TeamNextUp = TeamNextUpLive | TeamNextUpUpcoming | TeamNextUpOut;

function toLivePreview(
  match: Match,
  team: AssignedTeam,
  teamMap: Map<string, Team>
): TeamNextUpLive | null {
  if (match.home_goals === null || match.away_goals === null) return null;
  const home = teamMap.get(match.home_team_id);
  const away = teamMap.get(match.away_team_id);
  if (!home || !away || home.code === "TBD" || away.code === "TBD") return null;

  return {
    kind: "live",
    pot: team.pot,
    teamName: team.name,
    teamFlag: team.flag,
    roundLabel: roundLabel(match.round, match.group_name),
    homeName: home.name,
    homeFlag: home.flag_emoji,
    awayName: away.name,
    awayFlag: away.flag_emoji,
    homeGoals: match.home_goals,
    awayGoals: match.away_goals,
  };
}

function toUpcomingPreview(
  match: Match,
  team: AssignedTeam,
  teamMap: Map<string, Team>
): TeamNextUpUpcoming {
  const opp = opponentForMatch(match, team.teamId, teamMap);
  return {
    kind: "upcoming",
    pot: team.pot,
    teamName: team.name,
    teamFlag: team.flag,
    roundLabel: roundLabel(match.round, match.group_name),
    opponentName: opp.name,
    opponentFlag: opp.flag,
  };
}

export function getTeamNextUp(
  team: AssignedTeam,
  matches: Match[],
  teamMap: Map<string, Team>
): TeamNextUp | null {
  const teamId = team.teamId;
  const involved = matches.filter(
    (m) => m.home_team_id === teamId || m.away_team_id === teamId
  );

  const live = involved.find((m) => m.is_live);
  if (live) {
    return toLivePreview(live, team, teamMap);
  }

  if (isTeamEliminated(teamId, matches, teamMap)) {
    return {
      kind: "out",
      pot: team.pot,
      teamName: team.name,
      teamFlag: team.flag,
    };
  }

  const upcoming = involved
    .filter(
      (m) =>
        m.status === "NS" &&
        !isTbd(m.home_team_id, teamMap) &&
        !isTbd(m.away_team_id, teamMap)
    )
    .sort((a, b) => matchSortKey(a) - matchSortKey(b))[0];

  if (upcoming) {
    return toUpcomingPreview(upcoming, team, teamMap);
  }

  return null;
}

export function buildNextUpForTeams(
  teams: AssignedTeam[],
  matches: Match[],
  teamMap: Map<string, Team>
): TeamNextUp[] {
  return teams
    .map((t) => getTeamNextUp(t, matches, teamMap))
    .filter((x): x is TeamNextUp => x !== null);
}

export function formatUpcomingLine(item: TeamNextUpUpcoming): string {
  const opp = item.opponentFlag
    ? `${item.opponentFlag} ${item.opponentName}`
    : item.opponentName;
  return `${item.teamFlag} ${item.teamName} vs ${opp} · ${item.roundLabel}`;
}

export function formatLiveLineForTeam(item: TeamNextUpLive): string {
  return `🔴 ${item.homeFlag} ${item.homeName} ${item.homeGoals}–${item.awayGoals} ${item.awayName} ${item.awayFlag} · live`;
}

export function buildEntryNextUpLines(
  teams: AssignedTeam[],
  matches: Match[],
  teamMap: Map<string, Team>
): string[] {
  const lines: string[] = [];
  for (const t of teams) {
    const next = getTeamNextUp(t, matches, teamMap);
    if (next?.kind === "upcoming") {
      lines.push(formatUpcomingLine(next));
    }
  }
  return lines;
}
