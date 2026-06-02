import { createAdminClient } from "@/lib/supabase/admin";
import { GROUP_TEAMS } from "@/lib/mock/fixtures";
import { generateScore, getWinner } from "./match-result";
import {
  rebuildStandingsFromMatches,
  getTopTeamsFromGroups,
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

async function fillKnockoutBracket(
  competitionId: string,
  standings: ReturnType<typeof rebuildStandingsFromMatches>
) {
  const supabase = createAdminClient();
  const qualified = getTopTeamsFromGroups(standings, 2);

  const { data: r16 } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("round", "Round of 16")
    .order("fixture_id");

  if (!r16) return;

  const pairs: [string, string][] = [];
  for (let i = 0; i < 8; i++) {
    const home = qualified[i] ?? qualified[0];
    const away = qualified[15 - i] ?? qualified[1];
    pairs.push([home, away]);
  }

  for (let i = 0; i < r16.length && i < pairs.length; i++) {
    const [homeId, awayId] = pairs[i];
    await supabase
      .from("matches")
      .update({
        home_team_id: homeId,
        away_team_id: awayId,
      })
      .eq("id", r16[i].id);
  }
}

async function simulateKnockout(competitionId: string, fast: boolean) {
  const supabase = createAdminClient();
  const rounds = ["Round of 16", "Quarter-final", "Semi-final", "Final"];

  for (const round of rounds) {
    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .eq("competition_id", competitionId)
      .eq("round", round)
      .order("fixture_id");

    if (!matches) continue;

    for (const m of matches) {
      const { data: tbdTeam } = await supabase
        .from("teams")
        .select("id")
        .eq("code", "TBD")
        .single();

      if (
        tbdTeam &&
        (m.home_team_id === tbdTeam.id || m.away_team_id === tbdTeam.id)
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

      await supabase
        .from("matches")
        .update({
          home_goals: home,
          away_goals: away,
          status: "FT",
          winner_team_id: winnerId,
        })
        .eq("id", m.id);

      if (m.next_match_fixture_id && m.knockout_order) {
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
