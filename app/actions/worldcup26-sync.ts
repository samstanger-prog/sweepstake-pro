"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { syncWorldcup26Scores } from "@/lib/worldcup26/sync-scores";

export async function syncWorldcup26FromAdmin(competitionId: string) {
  if (!(await isAdminAuthenticated())) {
    return { error: "Unauthorized" };
  }
  if (!isSupabaseAdminConfigured()) {
    return { error: "Database not configured." };
  }

  const result = await syncWorldcup26Scores(competitionId, { force: true });
  if (!result.ok) {
    return { error: result.error ?? "Sync failed" };
  }

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath("/c");

  const parts: string[] = [];
  if (result.updated) parts.push(`${result.updated} match(es) updated`);
  if (result.live) parts.push(`${result.live} live`);
  if (result.finished) parts.push(`${result.finished} finished`);
  const detail =
    parts.length > 0 ? parts.join(", ") : "Already up to date";

  return { success: true, message: `Synced from worldcup26.ir — ${detail}.` };
}
