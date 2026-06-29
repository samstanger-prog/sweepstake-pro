import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/components/ProfileView";
import { SupabaseSetupPanel } from "@/components/SupabaseSetupPanel";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { profilePath } from "@/lib/utils/slug";

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

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <SupabaseSetupPanel />
      </div>
    );
  }

  const supabase = await createServerSupabase();

  const { data: participant } = await supabase
    .from("participants")
    .select(PROFILE_SELECT)
    .eq("id", id)
    .single();

  if (!participant) notFound();

  const competition = Array.isArray(participant.competitions)
    ? participant.competitions[0]
    : participant.competitions;

  if (competition?.invite_code && participant.slug) {
    redirect(profilePath(competition.invite_code, participant.slug));
  }

  return (
    <ProfileView
      participant={{
        ...participant,
        competition: competition ?? null,
      }}
    />
  );
}
