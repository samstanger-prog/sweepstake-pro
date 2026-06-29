import { createAdminClient } from "@/lib/supabase/admin";
import { isWorldcup26SyncEnabled } from "@/lib/config";
import { syncWorldcup26Scores } from "@/lib/worldcup26/sync-scores";
import type { Match, ScoreBreakdown, Team } from "@/lib/supabase/types";
import { parseAssignedTeams } from "@/lib/leaderboard/parse-teams";
import { withEliminationStatus } from "@/lib/leaderboard/team-status";
import { buildEntryNextUpLines } from "@/lib/leaderboard/next-up";
import { profilePath } from "@/lib/utils/slug";
import type { LeaderboardEntry } from "@/components/LeaderboardTable";

export type LiveMatchRow = {
  id: string;
  homeName: string;
  homeFlag: string;
  awayName: string;
  awayFlag: string;
  homeGoals: number;
  awayGoals: number;
  roundLabel: string;
  homeTeamId: string;
  awayTeamId: string;
};

export type LiveEntryHint = {
  participantId: string;
  liveLine?: string;
  nextUpLines?: string[];
  isLive: boolean;
};

export type LiveLeaderboardPayload = {
  liveMatches: LiveMatchRow[];
  entries: LeaderboardEntry[];
  entryHints: Record<string, LiveEntryHint>;
  lastSyncAt: string | null;
  polledAt: string;
};

function roundLabel(round: string, groupName: string | null): string {
  if (round === "Group Stage" && groupName) return `Group ${groupName}`;
  return round;
}

function formatLiveLine(m: LiveMatchRow, teamName: string): string {
  const isHome = m.homeName === teamName;
  const us = isHome ? m.homeName : m.awayName;
  const them = isHome ? m.awayName : m.homeName;
  const usGoals = isHome ? m.homeGoals : m.awayGoals;
  const themGoals = isHome ? m.awayGoals : m.homeGoals;
  return `🔴 ${us} ${usGoals}–${themGoals} ${them} · live`;
}

export async function buildLiveLeaderboardPayload(
  competitionId: string,
  options?: { runSync?: boolean }
): Promise<LiveLeaderboardPayload> {
  if (options?.runSync && isWorldcup26SyncEnabled()) {
    await syncWorldcup26Scores(competitionId);
  }

  const supabase = createAdminClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("invite_code, worldcup26_last_sync_at")
    .eq("id", competitionId)
    .single();

  const { data: teams } = await supabase.from("teams").select("*");
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t as Team]));

  const { data: allMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId);

  const matches = (allMatches ?? []) as Match[];

  const { data: liveRows } = await supabase
    .from("matches")
    .select(
      "id, home_team_id, away_team_id, home_goals, away_goals, round, group_name"
    )
    .eq("competition_id", competitionId)
    .eq("is_live", true);

  const liveMatches: LiveMatchRow[] = [];

  for (const m of liveRows ?? []) {
    if (m.home_goals === null || m.away_goals === null) continue;
    const home = teamMap.get(m.home_team_id);
    const away = teamMap.get(m.away_team_id);
    if (!home || !away || home.code === "TBD" || away.code === "TBD") continue;

    const row: LiveMatchRow = {
      id: m.id,
      homeTeamId: m.home_team_id,
      awayTeamId: m.away_team_id,
      homeName: home.name,
      homeFlag: home.flag_emoji,
      awayName: away.name,
      awayFlag: away.flag_emoji,
      homeGoals: m.home_goals,
      awayGoals: m.away_goals,
      roundLabel: roundLabel(m.round, m.group_name),
    };
    liveMatches.push(row);
  }

  const { data: rows } = await supabase
    .from("participants")
    .select(
      `
      id,
      name,
      slug,
      user_teams (
        pot,
        team_id,
        teams ( name, flag_emoji, pot )
      ),
      participant_scores (
        total_points,
        breakdown
      )
    `
    )
    .eq("competition_id", competitionId);

  const inviteCode = competition?.invite_code ?? "";
  const entryHints: Record<string, LiveEntryHint> = {};

  const entries: LeaderboardEntry[] = (rows ?? [])
    .map((r) => {
      const scores = Array.isArray(r.participant_scores)
        ? r.participant_scores[0]
        : r.participant_scores;
      const slug = r.slug as string | undefined;
      const teamsParsed = withEliminationStatus(
        parseAssignedTeams(r.user_teams),
        matches,
        teamMap
      );

      let liveLine: string | undefined;
      let isLive = false;
      for (const t of teamsParsed) {
        const live = liveMatches.find(
          (m) =>
            m.homeTeamId === t.teamId || m.awayTeamId === t.teamId
        );
        if (live) {
          liveLine = formatLiveLine(live, t.name);
          isLive = true;
          break;
        }
      }

      const nextUpLines = isLive
        ? undefined
        : buildEntryNextUpLines(teamsParsed, matches, teamMap);

      entryHints[r.id] = {
        participantId: r.id,
        liveLine,
        nextUpLines: nextUpLines?.length ? nextUpLines : undefined,
        isLive,
      };

      return {
        participantId: r.id,
        name: r.name,
        profileHref:
          inviteCode && slug
            ? profilePath(inviteCode, slug)
            : `/user/${r.id}`,
        teams: teamsParsed,
        totalPoints: scores?.total_points ?? 0,
        breakdown: scores?.breakdown as ScoreBreakdown | undefined,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return {
    liveMatches,
    entries,
    entryHints,
    lastSyncAt: competition?.worldcup26_last_sync_at ?? null,
    polledAt: new Date().toISOString(),
  };
}
