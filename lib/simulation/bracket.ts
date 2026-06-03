import { createAdminClient } from "@/lib/supabase/admin";
import { GROUP_TEAMS } from "@/lib/mock/fixtures";
import {
  rebuildStandingsFromMatches,
  getQualifiedTeams,
} from "./standings";
import type { Match } from "@/lib/supabase/types";

export const KNOCKOUT_ROUND_SEQUENCE = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Third-place",
  "Final",
] as const;

export const GROUP_STAGE_MATCH_COUNT = 72;

export async function getTbdTeamId(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("teams")
    .select("id")
    .eq("code", "TBD")
    .single();
  return data?.id ?? null;
}

export async function buildTeamIdsByGroup(): Promise<Map<string, string[]>> {
  const supabase = createAdminClient();
  const { data: teams } = await supabase.from("teams").select("id, code");
  const codeToId = new Map(teams?.map((t) => [t.code, t.id]) ?? []);
  const teamIdsByGroup = new Map<string, string[]>();

  for (const [group, codes] of Object.entries(GROUP_TEAMS)) {
    teamIdsByGroup.set(
      group,
      codes.map((c) => codeToId.get(c)!).filter(Boolean)
    );
  }
  return teamIdsByGroup;
}

export async function syncGroupStandings(competitionId: string) {
  const supabase = createAdminClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId);

  const teamIdsByGroup = await buildTeamIdsByGroup();
  const standings = rebuildStandingsFromMatches(
    (matches ?? []) as Match[],
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

  return standings;
}

/** Top 2 × 12 groups + 8 best thirds → 32 teams into R32 (1 vs 32, 2 vs 31, …). */
export async function fillKnockoutBracket(
  competitionId: string,
  standings?: ReturnType<typeof rebuildStandingsFromMatches>
) {
  const supabase = createAdminClient();
  const resolved =
    standings ?? (await syncGroupStandings(competitionId));
  const qualified = getQualifiedTeams(resolved, 2, 8);

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

export async function advanceWinner(
  competitionId: string,
  match: Match,
  winnerId: string
) {
  if (
    !match.next_match_fixture_id ||
    !match.knockout_order ||
    match.round === "Third-place"
  ) {
    return;
  }

  const supabase = createAdminClient();
  const { data: nextMatch } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("fixture_id", match.next_match_fixture_id)
    .single();

  if (!nextMatch) return;

  const isHomeSlot = match.knockout_order % 2 === 1;
  await supabase
    .from("matches")
    .update(
      isHomeSlot ? { home_team_id: winnerId } : { away_team_id: winnerId }
    )
    .eq("id", nextMatch.id);
}

export async function assignThirdPlaceFromSemis(competitionId: string) {
  const supabase = createAdminClient();
  const { data: sfMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("round", "Semi-final")
    .order("fixture_id");

  if (!sfMatches || sfMatches.length < 2) return;

  const losers: string[] = [];
  for (const m of sfMatches) {
    if (m.status !== "FT" || !m.winner_team_id) return;
    losers.push(
      m.winner_team_id === m.home_team_id
        ? m.away_team_id
        : m.home_team_id
    );
  }

  const { data: thirdMatch } = await supabase
    .from("matches")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("round", "Third-place")
    .single();

  if (!thirdMatch || losers.length !== 2) return;

  await supabase
    .from("matches")
    .update({
      home_team_id: losers[0],
      away_team_id: losers[1],
    })
    .eq("id", thirdMatch.id);
}

/** Re-apply winner advancement for all FT knockout matches from a round onward. */
export async function propagateFromRound(
  competitionId: string,
  fromRound: string
) {
  const start = KNOCKOUT_ROUND_SEQUENCE.indexOf(
    fromRound as (typeof KNOCKOUT_ROUND_SEQUENCE)[number]
  );
  if (start === -1) return;

  const supabase = createAdminClient();

  for (let i = start; i < KNOCKOUT_ROUND_SEQUENCE.length; i++) {
    const round = KNOCKOUT_ROUND_SEQUENCE[i];

    if (round === "Third-place") {
      await assignThirdPlaceFromSemis(competitionId);
      continue;
    }

    const { data: matches } = await supabase
      .from("matches")
      .select("*")
      .eq("competition_id", competitionId)
      .eq("round", round)
      .order("fixture_id");

    for (const m of (matches ?? []) as Match[]) {
      if (m.status === "FT" && m.winner_team_id) {
        await advanceWinner(competitionId, m, m.winner_team_id);
      }
    }

    if (round === "Semi-final") {
      await assignThirdPlaceFromSemis(competitionId);
    }
  }
}

export async function countGroupStageFinished(
  competitionId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("competition_id", competitionId)
    .eq("round", "Group Stage")
    .eq("status", "FT");
  return count ?? 0;
}

export async function isR32Populated(competitionId: string): Promise<boolean> {
  const tbdId = await getTbdTeamId();
  if (!tbdId) return false;

  const supabase = createAdminClient();
  const { data: r32 } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id")
    .eq("competition_id", competitionId)
    .eq("round", "Round of 32");

  if (!r32?.length) return false;

  return r32.some(
    (m) => m.home_team_id !== tbdId && m.away_team_id !== tbdId
  );
}

export async function hasKnockoutTeamsAssigned(
  competitionId: string
): Promise<boolean> {
  const tbdId = await getTbdTeamId();
  if (!tbdId) return false;

  const supabase = createAdminClient();
  const { data: knockout } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id")
    .eq("competition_id", competitionId)
    .neq("round", "Group Stage");

  return (
    knockout?.some(
      (m) => m.home_team_id !== tbdId || m.away_team_id !== tbdId
    ) ?? false
  );
}
