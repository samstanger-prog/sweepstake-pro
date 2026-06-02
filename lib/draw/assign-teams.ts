import { createAdminClient } from "@/lib/supabase/admin";
import { getDataProvider } from "@/lib/data";
import { shuffle } from "@/lib/utils/shuffle";
import { WC2026_TEAM_COUNT } from "@/lib/mock/wc2026-teams";

const MAX_PLAYERS = 20;

export async function assignTeams(competitionId: string): Promise<{
  ok: boolean;
  error?: string;
  assigned?: number;
  potAEndRank?: number;
}> {
  const supabase = createAdminClient();

  const { data: participants, error: pErr } = await supabase
    .from("participants")
    .select("id")
    .eq("competition_id", competitionId);

  if (pErr) return { ok: false, error: pErr.message };
  if (!participants?.length) {
    return { ok: false, error: "No participants to assign" };
  }

  const count = participants.length;
  if (count > MAX_PLAYERS) {
    return { ok: false, error: `Too many participants (max ${MAX_PLAYERS})` };
  }
  if (WC2026_TEAM_COUNT - count < count) {
    return {
      ok: false,
      error: `Not enough teams in Pot B (${WC2026_TEAM_COUNT - count} available, need ${count}). Reduce players or expand the team pool.`,
    };
  }

  const { data: teams, error: tErr } = await supabase
    .from("teams")
    .select("id, fifa_rank, seed")
    .neq("code", "TBD");

  if (tErr || !teams?.length) {
    return { ok: false, error: tErr?.message ?? "Team pool not seeded" };
  }

  const sorted = [...teams].sort((a, b) => {
    const rankA = a.fifa_rank ?? a.seed;
    const rankB = b.fifa_rank ?? b.seed;
    return rankA - rankB;
  });

  if (sorted.length < WC2026_TEAM_COUNT) {
    return {
      ok: false,
      error: `Expected ${WC2026_TEAM_COUNT} teams in database (found ${sorted.length}). Run migration 004_48_teams.sql.`,
    };
  }

  const potAPool = sorted.slice(0, count);
  const potBPool = sorted.slice(count);
  const shuffledA = shuffle(potAPool.map((t) => t.id)).slice(0, count);
  const shuffledB = shuffle(potBPool.map((t) => t.id)).slice(0, count);

  await supabase
    .from("user_teams")
    .delete()
    .eq("competition_id", competitionId);

  const rows = participants.flatMap((p, i) => [
    {
      participant_id: p.id,
      team_id: shuffledA[i],
      pot: "A" as const,
      competition_id: competitionId,
    },
    {
      participant_id: p.id,
      team_id: shuffledB[i],
      pot: "B" as const,
      competition_id: competitionId,
    },
  ]);

  const { error: insertErr } = await supabase.from("user_teams").insert(rows);
  if (insertErr) return { ok: false, error: insertErr.message };

  await supabase
    .from("competitions")
    .update({ status: "drawn" })
    .eq("id", competitionId);

  try {
    const provider = getDataProvider();
    await provider.seedCompetition(competitionId);
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Draw saved but failed to seed fixtures. Check Supabase teams table.",
    };
  }

  const topRank = potAPool[potAPool.length - 1]?.fifa_rank ?? count;

  return { ok: true, assigned: count, potAEndRank: topRank };
}
