import { createAdminClient } from "@/lib/supabase/admin";
import { getDataProvider } from "@/lib/data";
import { shuffle } from "@/lib/utils/shuffle";

export async function assignTeams(competitionId: string): Promise<{
  ok: boolean;
  error?: string;
  assigned?: number;
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
  if (count > 24) {
    return { ok: false, error: "Too many participants (max 24)" };
  }

  const { data: potA } = await supabase
    .from("teams")
    .select("id")
    .eq("pot", "A")
    .neq("code", "TBD");

  const { data: potB } = await supabase
    .from("teams")
    .select("id")
    .eq("pot", "B")
    .neq("code", "TBD");

  if (!potA?.length || !potB?.length) {
    return { ok: false, error: "Team pool not seeded" };
  }
  if (potA.length < count || potB.length < count) {
    const maxPlayers = Math.min(potA.length, potB.length);
    return {
      ok: false,
      error: `Too many players (${count}). Maximum ${maxPlayers} with the current team pool (${potA.length} Pot A, ${potB.length} Pot B). Run migration 003_rebalance_pots.sql in Supabase if you have 9–12 players.`,
    };
  }

  const shuffledA = shuffle(potA.map((t) => t.id)).slice(0, count);
  const shuffledB = shuffle(potB.map((t) => t.id)).slice(0, count);

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

  return { ok: true, assigned: count };
}
