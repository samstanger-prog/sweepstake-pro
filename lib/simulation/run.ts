import { createAdminClient } from "@/lib/supabase/admin";
import { GROUP_TEAMS } from "@/lib/mock/fixtures";
import { generateScore, getWinner } from "./match-result";
import {
  rebuildStandingsFromMatches,
  getQualifiedTeams,
} from "./standings";
import type { Match } from "@/lib/supabase/types";
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

  const { data: updated } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId);

  const teamIdsByGroup = new Map<string, string[]>();
  const { data: teams } = await supabase.from("teams").select("id, code");
  const codeToId = new Map(teams?.map((t) => [t.code, t.id]) ?? []);

  for (const [group, codes] of Object.entries(GROUP_TEAMS)) {
    teamIdsByGroup.set(
      group,
      codes.map((c) => codeToId.get(c)!).filter(Boolean)
    );
  }

  const standings = rebuildStandingsFromMatches(
    (updated ?? []) as Match[],
    teamIdsByGroup
  );

  for (const s of standings) {
    await supabase
      .from("standings")
      .update({
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        gf: s.gf,
        ga: s.ga,
        gd: s.gd,
        pts: s.pts,
      })
      .eq("competition_id", competitionId)
      .eq("team_id", s.team_id);
  }

  await fillKnockoutBracket(competitionId, standings);
}

/** Top 2 × 12 groups + 8 best thirds → 32 teams into R32 (1 vs 32, 2 vs 31, …). */
async function fillKnockoutBracket(
  competitionId: string,
  standings: ReturnType<typeof rebuildStandingsFromMatches>
) {
  const supabase = createAdminClient();
  const qualified = getQualifiedTeams(standings, 2, 8);

  const { data: r32 } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("round", "Round of 32")
    .order("fixture_id");

  if (!r32?.length) return;

  for (let i = 0; i < r32.length && i < 16; i++) {
    const homeId = qualified[i] ?? qualified[0];
    const awayId = qualified[31 - i] ?? qualified[1];
    await supabase
      .from("matches")
      .update({
        home_team_id: homeId,
        away_team_id: awayId,
      })
      .eq("id", r32[i].id);
  }
}

async function simulateKnockout(competitionId: string, fast: boolean) {
  const supabase = createAdminClient();
  const rounds = [
    "Round of 32",
    "Round of 16",
    "Quarter-final",
    "Semi-final",
    "Third-place",
    "Final",
  ];

  const { data: tbdTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("code", "TBD")
    .single();

  const tbdId = tbdTeam?.id;
  const sfLosers: string[] = [];

  for (const round of rounds) {
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

      if (m.next_match_fixture_id && m.knockout_order && round !== "Third-place") {
        const { data: nextMatch } = await supabase
          .from("matches")
          .select("*")
          .eq("competition_id", competitionId)
          .eq("fixture_id", m.next_match_fixture_id)
          .single();

        if (nextMatch) {
          const isHomeSlot = m.knockout_order % 2 === 1;
          await supabase
            .from("matches")
            .update(
              isHomeSlot
                ? { home_team_id: winnerId }
                : { away_team_id: winnerId }
            )
            .eq("id", nextMatch.id);
        }
      }
    }
  }
}
