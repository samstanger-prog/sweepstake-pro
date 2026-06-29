import { notFound } from "next/navigation";
import { ProfileView } from "@/components/ProfileView";
import { SupabaseSetupPanel } from "@/components/SupabaseSetupPanel";
import { buildAssignedTeamsWithStatus } from "@/lib/leaderboard/team-status";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Match, Team } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const PROFILE_SELECT = `
  id,
  name,
  slug,
  competition_id,
  competitions (name, invite_code, status),
  user_teams (
    pot,
    team_id,
    teams (id, name, flag_emoji, pot)
  ),
  participant_scores (
    match_points,
    progression_points,
    bonus_points,
    total_points,
    breakdown
  )
`;

export default async function ProfileBySlugPage({
  params,
}: {
  params: Promise<{ code: string; slug: string }>;
}) {
  const { code, slug } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <SupabaseSetupPanel />
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const inviteCode = code.trim().toUpperCase();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id")
    .eq("invite_code", inviteCode)
    .single();

  if (!competition) notFound();

  const { data: participant } = await supabase
    .from("participants")
    .select(PROFILE_SELECT)
    .eq("competition_id", competition.id)
    .eq("slug", slug.toLowerCase())
    .single();

  if (!participant) notFound();

  const [{ data: allTeams }, { data: allMatches }] = await Promise.all([
    supabase.from("teams").select("*"),
    supabase
      .from("matches")
      .select("*")
      .eq("competition_id", competition.id),
  ]);

  const teamMap = new Map((allTeams ?? []).map((t) => [t.id, t as Team]));
  const teams = buildAssignedTeamsWithStatus(
    participant.user_teams,
    (allMatches ?? []) as Match[],
    teamMap
  );

  const competitionInfo = Array.isArray(participant.competitions)
    ? participant.competitions[0]
    : participant.competitions;

  return (
    <ProfileView
      participant={{
        ...participant,
        competition: competitionInfo ?? null,
      }}
      teams={teams}
    />
  );
}
