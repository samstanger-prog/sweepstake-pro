import { LiveLeaderboardShell } from "@/components/LiveLeaderboardShell";
import { SupabaseSetupPanel } from "@/components/SupabaseSetupPanel";
import { buildLiveLeaderboardPayload } from "@/lib/leaderboard/live-data";
import { isWorldcup26SyncEnabled } from "@/lib/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>;
}) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <SupabaseSetupPanel />
      </div>
    );
  }

  const supabase = await createServerSupabase();

  let competitionId = params.competition;

  if (!competitionId) {
    const { data: latest } = await supabase
      .from("competitions")
      .select("id, name, invite_code")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    competitionId = latest?.id;
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, invite_code")
    .order("created_at", { ascending: false });

  if (!competitionId) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-4 text-slate-500">No competitions yet. Create one in Admin.</p>
      </div>
    );
  }

  const current = competitions?.find((c) => c.id === competitionId);
  const syncEnabled = isWorldcup26SyncEnabled();

  let livePayload;
  try {
    livePayload = await buildLiveLeaderboardPayload(competitionId, {
      runSync: false,
    });
  } catch {
    livePayload = {
      liveMatches: [],
      entries: [],
      entryHints: {},
      lastSyncAt: null,
      polledAt: new Date().toISOString(),
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        {current && (
          <p className="text-sm text-slate-500">
            {current.name} · Code {current.invite_code}
          </p>
        )}
        <p className="text-xs text-slate-400">
          Each player has two teams (Pot A + Pot B). Tap a row for points breakdown.
        </p>
      </div>

      {competitions && competitions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {competitions.map((c) => (
            <a
              key={c.id}
              href={`/leaderboard?competition=${c.id}`}
              className={`rounded-full px-3 py-1 text-sm ${
                c.id === competitionId
                  ? "bg-pitch-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              {c.name}
            </a>
          ))}
        </div>
      )}

      {livePayload.entries.length === 0 ? (
        <p className="text-center text-slate-500 py-8">
          No participants yet. Share the invite code.
        </p>
      ) : (
        <LiveLeaderboardShell
          competitionId={competitionId}
          initialEntries={livePayload.entries}
          initialHints={livePayload.entryHints}
          initialLiveMatches={livePayload.liveMatches}
          initialLastSyncAt={livePayload.lastSyncAt}
          syncEnabled={syncEnabled}
        />
      )}
    </div>
  );
}
