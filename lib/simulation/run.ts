import { createAdminClient } from "@/lib/supabase/admin";
import { generateScore, getWinner } from "./match-result";
import {
  fillKnockoutBracket,
  syncGroupStandings,
  advanceWinner,
  assignThirdPlaceFromSemis,
  KNOCKOUT_ROUND_SEQUENCE,
  getTbdTeamId,
} from "./bracket";
import { recalculateCompetition } from "@/lib/scoring/recalculate";

export type SimMode = "group" | "knockout" | "full" | "fast";

export async function runSimulation(
  competitionId: string,
  mode: SimMode
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (mode === "group" || mode === "full" || mode === "fast") {
      await simulateGroupStage(competitionId, mode === "fast");
    }
    if (mode === "knockout" || mode === "full" || mode === "fast") {
      await simulateKnockout(competitionId, mode === "fast");
    }
    await recalculateCompetition(competitionId);

    const supabase = createAdminClient();
    if (mode === "full" || mode === "fast") {
      await supabase
        .from("competitions")
        .update({ status: "complete" })
        .eq("id", competitionId);
    } else if (mode === "group") {
      await supabase
        .from("competitions")
        .update({ status: "active" })
        .eq("id", competitionId);
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Simulation failed" };
  }
}

async function simulateGroupStage(competitionId: string, fast: boolean) {
  const supabase = createAdminClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("round", "Group Stage");

  if (error || !matches) throw new Error(error?.message ?? "No matches");

  for (const m of matches) {
    const { home, away } = generateScore(fast);
    await supabase
      .from("matches")
      .update({
        home_goals: home,
        away_goals: away,
        status: "FT",
        winner_team_id: getWinner(home, away, m.home_team_id, m.away_team_id),
      })
      .eq("id", m.id);
  }

  const standings = await syncGroupStandings(competitionId);
  await fillKnockoutBracket(competitionId, standings);
}

async function simulateKnockout(competitionId: string, fast: boolean) {
  const supabase = createAdminClient();
  const tbdId = await getTbdTeamId();
  const sfLosers: string[] = [];

  for (const round of KNOCKOUT_ROUND_SEQUENCE) {
    if (round === "Third-place" && sfLosers.length === 2) {
      const { data: thirdMatch } = await supabase
        .from("matches")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("round", "Third-place")
        .single();

      if (thirdMatch) {
        await supabase
          .from("matches")
          .update({
            home_team_id: sfLosers[0],
            away_team_id: sfLosers[1],
          })
          .eq("id", thirdMatch.id);
      }
    }

    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .eq("competition_id", competitionId)
      .eq("round", round)
      .order("fixture_id");

    if (!matches) continue;

    for (const m of matches) {
      if (
        tbdId &&
        (m.home_team_id === tbdId || m.away_team_id === tbdId)
      ) {
        continue;
      }

      const { home, away } = generateScore(fast);
      const winnerId = getWinner(
        home,
        away,
        m.home_team_id,
        m.away_team_id
      );
      const loserId =
        winnerId === m.home_team_id ? m.away_team_id : m.home_team_id;

      await supabase
        .from("matches")
        .update({
          home_goals: home,
          away_goals: away,
          status: "FT",
          winner_team_id: winnerId,
        })
        .eq("id", m.id);

      if (round === "Semi-final") {
        sfLosers.push(loserId);
      }

      if (round !== "Third-place") {
        await advanceWinner(competitionId, m, winnerId);
      }
    }

    if (round === "Semi-final") {
      await assignThirdPlaceFromSemis(competitionId);
    }
  }
}
