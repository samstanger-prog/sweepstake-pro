import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isWorldcup26SyncEnabled } from "@/lib/config";
import { buildLiveLeaderboardPayload } from "@/lib/leaderboard/live-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const competitionId = searchParams.get("competitionId");

  if (!competitionId) {
    return NextResponse.json({ error: "competitionId required" }, { status: 400 });
  }

  try {
    const payload = await buildLiveLeaderboardPayload(competitionId, {
      runSync: isWorldcup26SyncEnabled(),
    });
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load live data" },
      { status: 500 }
    );
  }
}
