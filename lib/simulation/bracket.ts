import { createAdminClient } from "@/lib/supabase/admin";
import { GROUP_TEAMS } from "@/lib/mock/fixtures";
import {
  rebuildStandingsFromMatches,
  getGroupRanks,
  getQualifyingThirdPlaceTeams,
} from "./standings";
import {
  R32_SLOT_TEMPLATE,
  getKnockoutAdvancement,
  resolveBracketSlot,
  isThirdPlaceSlotMapComplete,
  buildDefaultThirdPlaceSlots,
  THIRD_PLACE_SLOT_KEYS,
  type ThirdPlaceSlotMap,
} from "@/lib/bracket/fifa-wc2026";
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

/** Apply FIFA knockout advancement links to existing matches (repairs old competitions). */
export async function syncKnockoutGraph(competitionId: string) {
  const supabase = createAdminClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("id, fixture_id")
    .eq("competition_id", competitionId)
    .neq("round", "Group Stage");

  for (const m of matches ?? []) {
    const adv = getKnockoutAdvancement(m.fixture_id);
    if (!adv) continue;
    await supabase
      .from("matches")
      .update({ next_match_fixture_id: adv.nextFixtureId })
      .eq("id", m.id);
  }
}

export async function getThirdPlaceSlots(
  competitionId: string
): Promise<ThirdPlaceSlotMap> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("competitions")
    .select("third_place_slots")
    .eq("id", competitionId)
    .single();
  return (data?.third_place_slots as ThirdPlaceSlotMap) ?? {};
}

export async function saveThirdPlaceSlots(
  competitionId: string,
  slots: ThirdPlaceSlotMap
) {
  const supabase = createAdminClient();
  await supabase
    .from("competitions")
    .update({ third_place_slots: slots })
    .eq("id", competitionId);
}

/** Auto-map qualifying thirds to slot keys (sim / testing — not Annexe C). */
export async function autoAssignThirdPlaceSlots(
  competitionId: string,
  standings?: ReturnType<typeof rebuildStandingsFromMatches>
) {
  const resolved = standings ?? (await syncGroupStandings(competitionId));
  const thirds = getQualifyingThirdPlaceTeams(resolved);
  const slots = buildDefaultThirdPlaceSlots(thirds.map((t) => t.team_id));
  await saveThirdPlaceSlots(competitionId, slots);
  return slots;
}

/** Fill R32 from FIFA slot template (Art. 12.6) + stored third-place assignments. */
export async function fillKnockoutBracket(
  competitionId: string,
  standings?: ReturnType<typeof rebuildStandingsFromMatches>,
  options?: { autoThirdSlots?: boolean }
) {
  const supabase = createAdminClient();
  const resolved =
    standings ?? (await syncGroupStandings(competitionId));
  const groupRanks = getGroupRanks(resolved);

  let thirdSlots = await getThirdPlaceSlots(competitionId);
  if (!isThirdPlaceSlotMapComplete(thirdSlots)) {
    if (options?.autoThirdSlots) {
      thirdSlots = await autoAssignThirdPlaceSlots(competitionId, resolved);
    } else {
      throw new Error(
        "Third-place slot assignments incomplete. Assign all eight slots before generating knockouts."
      );
    }
  }

  await syncKnockoutGraph(competitionId);

  const { data: r32Matches } = await supabase
    .from("matches")
    .select("id, fixture_id")
    .eq("competition_id", competitionId)
    .eq("round", "Round of 32")
    .order("fixture_id");

  if (!r32Matches?.length) return;

  const r32Start = r32Matches[0].fixture_id;

  for (const slot of R32_SLOT_TEMPLATE) {
    const fixtureId = r32Start + (slot.fixtureId - R32_SLOT_TEMPLATE[0].fixtureId);
    const match = r32Matches.find((m) => m.fixture_id === fixtureId);
    if (!match) continue;

    const homeId = resolveBracketSlot(slot.home, groupRanks, thirdSlots);
    const awayId = resolveBracketSlot(slot.away, groupRanks, thirdSlots);
    if (!homeId || !awayId) {
      throw new Error(
        `Could not resolve R32 slot ${slot.home} vs ${slot.away} (fixture ${fixtureId}).`
      );
    }

    await supabase
      .from("matches")
      .update({
        home_team_id: homeId,
        away_team_id: awayId,
      })
      .eq("id", match.id);
  }
}

export async function advanceWinner(
  competitionId: string,
  match: Match,
  winnerId: string
) {
  if (match.round === "Third-place") return;

  const adv = getKnockoutAdvancement(match.fixture_id);
  if (!adv) return;

  const supabase = createAdminClient();
  const { data: nextMatch } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("fixture_id", adv.nextFixtureId)
    .single();

  if (!nextMatch) return;

  await supabase
    .from("matches")
    .update(
      adv.slot === "home"
        ? { home_team_id: winnerId }
        : { away_team_id: winnerId }
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

export { THIRD_PLACE_SLOT_KEYS };
