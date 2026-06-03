"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getWinner } from "@/lib/simulation/match-result";
import {
  fillKnockoutBracket,
  syncGroupStandings,
  propagateFromRound,
  countGroupStageFinished,
  GROUP_STAGE_MATCH_COUNT,
  getTbdTeamId,
  hasKnockoutTeamsAssigned,
  getThirdPlaceSlots,
  saveThirdPlaceSlots,
} from "@/lib/simulation/bracket";
import {
  isThirdPlaceSlotMapComplete,
  THIRD_PLACE_SLOT_KEYS,
  type ThirdPlaceSlotKey,
} from "@/lib/bracket/fifa-wc2026";
import { getQualifyingThirdPlaceTeams, rebuildStandingsFromMatches } from "@/lib/simulation/standings";
import { buildTeamIdsByGroup } from "@/lib/simulation/bracket";
import type { Match } from "@/lib/supabase/types";
import { recalculateCompetition } from "@/lib/scoring/recalculate";

function revalidateCompetitionPaths() {
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/c");
}

export async function saveMatchResult(
  competitionId: string,
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  winnerTeamId?: string
) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Database not configured." };
  }
  if (homeGoals < 0 || awayGoals < 0) {
    return { error: "Goals cannot be negative." };
  }

  const supabase = createAdminClient();
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .eq("competition_id", competitionId)
    .single();

  if (!match) return { error: "Match not found." };

  const tbdId = await getTbdTeamId();
  const isKnockout = match.round !== "Group Stage";

  if (
    isKnockout &&
    tbdId &&
    (match.home_team_id === tbdId || match.away_team_id === tbdId)
  ) {
    return {
      error:
        "Cannot save knockout match until both teams are assigned. Use Knockout setup → Generate Round of 32.",
    };
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
    } else if (
      !winnerTeamId ||
      (winnerTeamId !== match.home_team_id &&
        winnerTeamId !== match.away_team_id)
    ) {
      return {
        error: "Knockout draw — select the winner (e.g. after penalties).",
      };
    } else {
      winnerId = winnerTeamId;
    }
  } else {
    winnerId = getWinner(
      homeGoals,
      awayGoals,
      match.home_team_id,
      match.away_team_id
    );
  }

  await supabase
    .from("matches")
    .update({
      home_goals: homeGoals,
      away_goals: awayGoals,
      status: "FT",
      winner_team_id: winnerId,
    })
    .eq("id", matchId);

  if (match.round === "Group Stage") {
    await syncGroupStandings(competitionId);
  } else {
    await propagateFromRound(competitionId, match.round);
  }

  await recalculateCompetition(competitionId);
  revalidateCompetitionPaths();

  const warnR32 =
    match.round === "Group Stage" &&
    (await hasKnockoutTeamsAssigned(competitionId));

  return {
    success: true,
    warning: warnR32
      ? "Group standings changed — re-assign third-place slots and regenerate Round of 32 in Knockout setup."
      : undefined,
  };
}

export async function saveThirdPlaceSlotAssignments(
  competitionId: string,
  slots: Record<ThirdPlaceSlotKey, string>
) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Database not configured." };
  }

  const finished = await countGroupStageFinished(competitionId);
  if (finished < GROUP_STAGE_MATCH_COUNT) {
    return {
      error: `Group stage incomplete (${finished}/${GROUP_STAGE_MATCH_COUNT} matches finished).`,
    };
  }

  for (const key of THIRD_PLACE_SLOT_KEYS) {
    if (!slots[key]) {
      return { error: `Missing assignment for slot ${key}.` };
    }
  }

  const teamIds = Object.values(slots);
  if (new Set(teamIds).size !== teamIds.length) {
    return { error: "Each third-placed team can only fill one slot." };
  }

  const supabase = createAdminClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("round", "Group Stage")
    .eq("status", "FT");

  if (!matches?.length) {
    return { error: "No finished group matches yet." };
  }

  const teamIdsByGroup = await buildTeamIdsByGroup();
  const standings = rebuildStandingsFromMatches(matches as Match[], teamIdsByGroup);
  const qualifying = getQualifyingThirdPlaceTeams(standings);
  const qualifyingIds = new Set(qualifying.map((t) => t.team_id));

  for (const id of teamIds) {
    if (!qualifyingIds.has(id)) {
      return {
        error: "All assigned teams must be one of the eight qualifying third-placed teams.",
      };
    }
  }

  await saveThirdPlaceSlots(competitionId, slots);
  revalidateCompetitionPaths();
  return { success: true };
}

export async function fillRoundOf32FromStandings(
  competitionId: string,
  force = false
) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Database not configured." };
  }

  const finished = await countGroupStageFinished(competitionId);
  if (finished < GROUP_STAGE_MATCH_COUNT) {
    return {
      error: `Group stage incomplete (${finished}/${GROUP_STAGE_MATCH_COUNT} matches finished). Finish all group games first.`,
    };
  }

  const thirdSlots = await getThirdPlaceSlots(competitionId);
  if (!isThirdPlaceSlotMapComplete(thirdSlots)) {
    return {
      error:
        "Third-place slot assignments incomplete. Save all eight slot assignments first.",
    };
  }

  if (!force && (await hasKnockoutTeamsAssigned(competitionId))) {
    return {
      error: "R32 already populated. Confirm replace to run again.",
      needsForce: true,
    };
  }

  const standings = await syncGroupStandings(competitionId);
  try {
    await fillKnockoutBracket(competitionId, standings);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate knockouts.",
    };
  }
  await recalculateCompetition(competitionId);
  revalidateCompetitionPaths();

  return { success: true };
}

export async function recalculateAllPoints(competitionId: string) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Database not configured." };
  }

  await recalculateCompetition(competitionId);
  revalidateCompetitionPaths();
  return { success: true };
}
