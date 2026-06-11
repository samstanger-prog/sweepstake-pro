import { NextResponse } from "next/server";
import { isWorldcup26SyncEnabled } from "@/lib/config";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { syncLatestCompetition } from "@/lib/worldcup26/sync-scores";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isWorldcup26SyncEnabled()) {
    return NextResponse.json({ ok: true, skipped: "WORLDCUP26_SYNC_ENABLED is not true" });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const result = await syncLatestCompetition({ force: true });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    competitionId: result.competitionId,
    updated: result.updated,
    live: result.live,
    finished: result.finished,
  });
}
