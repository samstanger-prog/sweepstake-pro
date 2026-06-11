import { createAdminClient } from "@/lib/supabase/admin";
import { getWinner } from "@/lib/simulation/match-result";
import {
  propagateFromRound,
  syncGroupStandings,
  getTbdTeamId,
} from "@/lib/simulation/bracket";
import { recalculateCompetition } from "@/lib/scoring/recalculate";
import type { Match, Team } from "@/lib/supabase/types";
import {
  fetchWorldcup26Games,
  isGameFinished,
  isGameLive,
  parseGameScores,
} from "./fetch-games";
import { buildTeamLookup, resolveTeamId } from "./team-names";
import type { Worldcup26Game } from "./types";

export type SyncResult = {
  ok: boolean;
  error?: string;
  updated?: number;
  live?: number;
  finished?: number;
  skipped?: number;
};

const GROUP_STAGE_MAX_FIXTURE = 72;
const MIN_SYNC_INTERVAL_MS = 55_000;

function orientScores(
  dbMatch: Match,
  apiHomeId: string,
  apiAwayId: string,
  apiHomeGoals: number,
  apiAwayGoals: number
): { homeGoals: number; awayGoals: number } {
  if (
    dbMatch.home_team_id === apiHomeId &&
    dbMatch.away_team_id === apiAwayId
  ) {
    return { homeGoals: apiHomeGoals, awayGoals: apiAwayGoals };
  }
  if (
    dbMatch.home_team_id === apiAwayId &&
    dbMatch.away_team_id === apiHomeId
  ) {
    return { homeGoals: apiAwayGoals, awayGoals: apiHomeGoals };
  }
  return { homeGoals: apiHomeGoals, awayGoals: apiAwayGoals };
}

function findGroupMatch(
  matches: Match[],
  homeId: string,
  awayId: string
): Match | undefined {
  return matches.find(
    (m) =>
      m.fixture_id <= GROUP_STAGE_MAX_FIXTURE &&
      ((m.home_team_id === homeId && m.away_team_id === awayId) ||
        (m.home_team_id === awayId && m.away_team_id === homeId))
  );
}

function resolveApiTeams(
  game: Worldcup26Game,
  lookup: Map<string, string>
): { homeId?: string; awayId?: string } {
  const homeId = resolveTeamId(lookup, game.home_team_name_en);
  const awayId = resolveTeamId(lookup, game.away_team_name_en);
  return { homeId, awayId };
}

function findDbMatch(
  matches: Match[],
  game: Worldcup26Game,
  lookup: Map<string, string>
): Match | undefined {
  const fixtureId = parseInt(game.id, 10);
  if (!Number.isFinite(fixtureId)) return undefined;

  if (fixtureId > GROUP_STAGE_MAX_FIXTURE) {
    return matches.find((m) => m.fixture_id === fixtureId);
  }

  const { homeId, awayId } = resolveApiTeams(game, lookup);
  if (!homeId || !awayId) return undefined;
  return findGroupMatch(matches, homeId, awayId);
}

async function applyFinishedMatch(
  competitionId: string,
  match: Match,
  homeGoals: number,
  awayGoals: number,
  tbdId: string | null
) {
  const supabase = createAdminClient();
  const isKnockout = match.round !== "Group Stage";

  if (
    isKnockout &&
    tbdId &&
    (match.home_team_id === tbdId || match.away_team_id === tbdId)
  ) {
    return false;
  }

  let winnerId: string;
  if (homeGoals === awayGoals) {
    if (!isKnockout) {
      winnerId = getWinner(
        homeGoals,
        awayGoals,
        match.home_team_id,
        match.away_team_id
      );
    } else {
      winnerId = getWinner(
        homeGoals,
        awayGoals,
        match.home_team_id,
        match.away_team_id
      );
    }
  } else {
    winnerId = getWinner(
      homeGoals,
      awayGoals,
      match.home_team_id,
      match.away_team_id
    );
  }

  const alreadyFt =
    match.status === "FT" &&
    match.home_goals === homeGoals &&
    match.away_goals === awayGoals &&
    !match.is_live;

  if (alreadyFt) return false;

  await supabase
    .from("matches")
    .update({
      home_goals: homeGoals,
      away_goals: awayGoals,
      status: "FT",
      is_live: false,
      winner_team_id: winnerId,
    })
    .eq("id", match.id);

  if (match.round === "Group Stage") {
    await syncGroupStandings(competitionId);
  } else {
    await propagateFromRound(competitionId, match.round);
  }

  return true;
}

async function applyLiveMatch(
  match: Match,
  homeGoals: number,
  awayGoals: number
) {
  if (
    match.is_live &&
    match.home_goals === homeGoals &&
    match.away_goals === awayGoals
  ) {
    return false;
  }

  const supabase = createAdminClient();
  await supabase
    .from("matches")
    .update({
      home_goals: homeGoals,
      away_goals: awayGoals,
      is_live: true,
      status: "NS",
    })
    .eq("id", match.id);

  return true;
}

export async function syncWorldcup26Scores(
  competitionId: string,
  options?: { force?: boolean }
): Promise<SyncResult> {
  const supabase = createAdminClient();

  if (!options?.force) {
    const { data: comp } = await supabase
      .from("competitions")
      .select("worldcup26_last_sync_at")
      .eq("id", competitionId)
      .single();

    if (comp?.worldcup26_last_sync_at) {
      const last = new Date(comp.worldcup26_last_sync_at).getTime();
      if (Date.now() - last < MIN_SYNC_INTERVAL_MS) {
        return { ok: true, updated: 0, skipped: 0 };
      }
    }
  }

  let games;
  try {
    games = await fetchWorldcup26Games();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to fetch scores",
    };
  }

  const { data: teams } = await supabase.from("teams").select("*");
  if (!teams?.length) {
    return { ok: false, error: "No teams in database" };
  }

  const lookup = buildTeamLookup(teams as Team[]);
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId);

  if (!matches?.length) {
    return { ok: false, error: "No matches for this competition" };
  }

  const tbdId = await getTbdTeamId();
  let updated = 0;
  let live = 0;
  let finished = 0;
  let skipped = 0;

  for (const game of games) {
    if (!isGameFinished(game) && !isGameLive(game)) {
      skipped++;
      continue;
    }

    const dbMatch = findDbMatch(matches as Match[], game, lookup);
    if (!dbMatch) {
      skipped++;
      continue;
    }

    if (dbMatch.status === "FT" && !isGameFinished(game)) {
      skipped++;
      continue;
    }

    const { homeId, awayId } = resolveApiTeams(game, lookup);
    if (!homeId || !awayId) {
      skipped++;
      continue;
    }

    const { home, away } = parseGameScores(game);
    const { homeGoals, awayGoals } = orientScores(
      dbMatch,
      homeId,
      awayId,
      home,
      away
    );

    if (isGameFinished(game)) {
      const changed = await applyFinishedMatch(
        competitionId,
        dbMatch,
        homeGoals,
        awayGoals,
        tbdId
      );
      if (changed) {
        updated++;
        finished++;
      }
    } else if (isGameLive(game)) {
      const changed = await applyLiveMatch(dbMatch, homeGoals, awayGoals);
      if (changed) {
        updated++;
        live++;
      }
    }
  }

  await supabase
    .from("competitions")
    .update({ worldcup26_last_sync_at: new Date().toISOString() })
    .eq("id", competitionId);

  if (updated > 0) {
    await recalculateCompetition(competitionId);
  }

  return { ok: true, updated, live, finished, skipped };
}

/** Sync the most recently created competition (for cron). */
export async function syncLatestCompetition(
  options?: { force?: boolean }
): Promise<SyncResult & { competitionId?: string }> {
  const supabase = createAdminClient();
  const { data: latest } = await supabase
    .from("competitions")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) {
    return { ok: false, error: "No competition found" };
  }

  const result = await syncWorldcup26Scores(latest.id, options);
  return { ...result, competitionId: latest.id };
}
