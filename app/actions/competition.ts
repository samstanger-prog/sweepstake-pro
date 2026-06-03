"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { uniqueParticipantSlug } from "@/lib/participants/slug";
import { generateInviteCode } from "@/lib/utils/invite-code";
import { profilePath } from "@/lib/utils/slug";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { assignTeams } from "@/lib/draw/assign-teams";
import { testPlayerNames } from "@/lib/test/participants";
import { runSimulation, type SimMode } from "@/lib/simulation/run";

export async function createCompetition(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) {
    return {
      error:
        "Supabase is not configured. Add your project URL and keys to .env.local, then restart the dev server.",
    };
  }

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const supabase = createAdminClient();
  let inviteCode = generateInviteCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data, error } = await supabase
      .from("competitions")
      .insert({ name, invite_code: inviteCode, status: "open" })
      .select("id, invite_code")
      .single();

    if (!error && data) {
      revalidatePath("/admin");
      return { success: true, id: data.id, inviteCode: data.invite_code };
    }
    if (error?.code === "23505") {
      inviteCode = generateInviteCode();
      attempts++;
      continue;
    }
    return { error: error?.message ?? "Failed to create" };
  }
  return { error: "Could not generate unique invite code" };
}

export async function joinCompetition(formData: FormData) {
  const inviteCode = (formData.get("invite_code") as string)
    ?.trim()
    .toUpperCase();
  const name = (formData.get("name") as string)?.trim();

  if (!inviteCode || !name) {
    return { error: "Invite code and name are required" };
  }
  if (!isSupabaseAdminConfigured()) {
    return {
      error:
        "Database not configured yet. Ask the admin to connect Supabase in .env.local.",
    };
  }

  const supabase = createAdminClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, status")
    .eq("invite_code", inviteCode)
    .single();

  if (!competition) return { error: "Invalid invite code" };
  if (competition.status !== "open") {
    return { error: "This sweepstake is no longer accepting entries" };
  }

  const slug = await uniqueParticipantSlug(supabase, competition.id, name);

  const { data: participant, error } = await supabase
    .from("participants")
    .insert({ competition_id: competition.id, name, slug })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "That name is already in this sweepstake. Use “Find my profile” below to open your page.",
      };
    }
    return { error: error.message };
  }

  redirect(profilePath(inviteCode, participant.slug));
}

export async function findProfile(formData: FormData) {
  const inviteCode = (formData.get("invite_code") as string)
    ?.trim()
    .toUpperCase();
  const name = (formData.get("name") as string)?.trim();

  if (!inviteCode || !name) {
    return { error: "Invite code and name are required" };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Database not configured yet." };
  }

  const supabase = createAdminClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, invite_code")
    .eq("invite_code", inviteCode)
    .single();

  if (!competition) return { error: "Invalid invite code" };

  const { data: participant } = await supabase
    .from("participants")
    .select("slug")
    .eq("competition_id", competition.id)
    .ilike("name", name)
    .maybeSingle();

  if (!participant?.slug) {
    return {
      error:
        "No player found with that name and code. Check spelling or join first.",
    };
  }

  redirect(profilePath(competition.invite_code, participant.slug));
}

export async function runTeamDraw(competitionId: string) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  const result = await assignTeams(competitionId);
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return { success: true, assigned: result.assigned, potAEndRank: result.potAEndRank };
}

const DEFAULT_TEST_COUNT = 10;

/** Add test players and run team draw (no simulation). Competition must have 0 participants. */
export async function setupTestCompetition(
  competitionId: string,
  count = DEFAULT_TEST_COUNT
) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Database not configured." };
  }
  if (count < 1 || count > 20) {
    return { error: "Test player count must be between 1 and 20." };
  }

  const supabase = createAdminClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, status")
    .eq("id", competitionId)
    .single();

  if (!competition) return { error: "Competition not found" };

  const { data: existing } = await supabase
    .from("participants")
    .select("id")
    .eq("competition_id", competitionId);

  if (existing && existing.length > 0) {
    return {
      error:
        "Competition already has players. Reset tournament or create a fresh competition for test setup.",
    };
  }

  const names = testPlayerNames(count);
  for (const name of names) {
    const slug = await uniqueParticipantSlug(supabase, competitionId, name);
    const { error } = await supabase.from("participants").insert({
      competition_id: competitionId,
      name,
      slug,
    });
    if (error) return { error: error.message };
  }

  const draw = await assignTeams(competitionId);
  if (!draw.ok) {
    return {
      error:
        draw.error ??
        "Test players added but team draw failed. Fix the issue and run Team Draw.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/c");

  return {
    success: true,
    count: names.length,
    names,
    assigned: draw.assigned,
    potAEndRank: draw.potAEndRank,
  };
}

export async function resetTournament(
  competitionId: string,
  confirmCode: string
) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Database not configured." };
  }

  const supabase = createAdminClient();
  const code = confirmCode.trim().toUpperCase();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, invite_code")
    .eq("id", competitionId)
    .single();

  if (!competition) return { error: "Competition not found" };
  if (competition.invite_code.toUpperCase() !== code) {
    return { error: "Invite code does not match. Reset cancelled." };
  }

  await supabase.from("user_teams").delete().eq("competition_id", competitionId);
  await supabase.from("matches").delete().eq("competition_id", competitionId);
  await supabase.from("standings").delete().eq("competition_id", competitionId);
  await supabase
    .from("participant_scores")
    .delete()
    .eq("competition_id", competitionId);

  const { error } = await supabase
    .from("competitions")
    .update({ status: "open", third_place_slots: null })
    .eq("id", competitionId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/c");
  revalidatePath("/rules");
  return { success: true };
}

export async function runSim(competitionId: string, mode: SimMode) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  const result = await runSimulation(competitionId, mode);
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/c");
  return { success: true };
}

export async function adminLogin(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const configured = process.env.ADMIN_SECRET;
  if (!configured) {
    return {
      error:
        "ADMIN_SECRET is not set. Copy .env.example to .env.local, set ADMIN_SECRET, then restart npm run dev.",
    };
  }

  const secret = (formData.get("secret") as string)?.trim();
  if (!secret) {
    return { error: "Please enter the admin secret." };
  }

  const { setAdminCookie } = await import("@/lib/admin/auth");
  const ok = await setAdminCookie(secret);
  if (!ok) {
    return {
      error:
        "Invalid admin secret. Use the exact value from ADMIN_SECRET in .env.local (not the placeholder name).",
    };
  }

  revalidatePath("/admin");
  return { success: true };
}
