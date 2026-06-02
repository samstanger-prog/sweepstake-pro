import { createAdminClient } from "@/lib/supabase/admin";
import { calculateTeamPoints } from "./calculate-points";
import type { Match, Team } from "@/lib/supabase/types";

export async function recalculateCompetition(competitionId: string) {
  const supabase = createAdminClient();

  const { data: participants } = await supabase
    .from("participants")
    .select("id")
    .eq("competition_id", competitionId);

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId);

  const { data: teams } = await supabase.from("teams").select("*");

  if (!participants || !matches || !teams) return;

  const teamMap = new Map(teams.map((t) => [t.id, t as Team]));

  for (const p of participants) {
    const { data: userTeams } = await supabase
      .from("user_teams")
      .select("team_id, pot")
      .eq("participant_id", p.id);

    if (!userTeams?.length) continue;

    const teamDetails = userTeams.map((ut) => {
      const team = teamMap.get(ut.team_id);
      if (!team) throw new Error("Team not found");
      return calculateTeamPoints(
        ut.team_id,
        team,
        matches as Match[],
        teamMap
      );
    });

    const match_points = teamDetails.reduce((s, t) => s + t.matchPoints, 0);
    const progression_points = teamDetails.reduce(
      (s, t) => s + t.progressionPoints,
      0
    );
    const bonus_points = teamDetails.reduce((s, t) => s + t.bonusPoints, 0);
    const total_points = match_points + progression_points + bonus_points;

    await supabase.from("participant_scores").upsert(
      {
        participant_id: p.id,
        competition_id: competitionId,
        match_points,
        progression_points,
        bonus_points,
        total_points,
        breakdown: { teams: teamDetails },
      },
      { onConflict: "participant_id" }
    );
  }
}
