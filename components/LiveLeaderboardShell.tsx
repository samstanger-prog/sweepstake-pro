"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { LiveEntryHint, LiveLeaderboardPayload } from "@/lib/leaderboard/live-data";
import { LeaderboardTable, type LeaderboardEntry } from "./LeaderboardTable";
import { LiveNowStrip } from "./LiveNowStrip";
import { ParticipantTeams } from "./ParticipantTeams";

const POLL_MS = 60_000;

function secondsAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}

export function LiveLeaderboardShell({
  competitionId,
  initialEntries,
  initialHints,
  initialLiveMatches,
  initialLastSyncAt,
  syncEnabled,
}: {
  competitionId: string;
  initialEntries: LeaderboardEntry[];
  initialHints: Record<string, LiveEntryHint>;
  initialLiveMatches: LiveLeaderboardPayload["liveMatches"];
  initialLastSyncAt: string | null;
  syncEnabled: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [hints, setHints] = useState(initialHints);
  const [liveMatches, setLiveMatches] = useState(initialLiveMatches);
  const [lastSyncAt, setLastSyncAt] = useState(initialLastSyncAt);
  const [polledAt, setPolledAt] = useState<string | null>(null);
  const [secondsSincePoll, setSecondsSincePoll] = useState(0);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/live?competitionId=${encodeURIComponent(competitionId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as LiveLeaderboardPayload;
      setEntries(data.entries);
      setHints(data.entryHints);
      setLiveMatches(data.liveMatches);
      setLastSyncAt(data.lastSyncAt);
      setPolledAt(data.polledAt);
      setSecondsSincePoll(0);
    } catch {
      /* keep last good data */
    }
  }, [competitionId]);

  useEffect(() => {
    if (!syncEnabled) return;
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll, syncEnabled]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (polledAt) setSecondsSincePoll(secondsAgo(polledAt));
    }, 1000);
    return () => clearInterval(tick);
  }, [polledAt]);

  return (
    <div className="space-y-4">
      <LiveNowStrip matches={liveMatches} />

      <div className="md:hidden">
        <LeaderboardTable entries={entries} entryHints={hints} />
      </div>

      <div className="hidden md:block overflow-x-auto card p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-600">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Player</th>
              <th className="p-3">Teams (Pot A + Pot B)</th>
              <th className="p-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const hint = hints[e.participantId];
              return (
                <tr
                  key={e.participantId}
                  className="border-b border-slate-100 dark:border-slate-700"
                >
                  <td className="p-3 font-bold">{e.rank}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={e.profileHref}
                        className="font-medium text-pitch-700 hover:underline dark:text-pitch-400"
                      >
                        {e.name}
                      </Link>
                      {hint?.isLive && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:bg-red-950/50 dark:text-red-300">
                          Live
                        </span>
                      )}
                    </div>
                    {hint?.liveLine && (
                      <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                        {hint.liveLine}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <ParticipantTeams teams={e.teams} compact />
                  </td>
                  <td className="p-3 text-right font-bold text-pitch-600">
                    {e.totalPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {syncEnabled && (
        <p className="text-center text-xs text-slate-400">
          {polledAt
            ? `Updated ${secondsSincePoll}s ago · refreshes every 60s`
            : "Live scores enabled · refreshes every 60s"}
          {lastSyncAt && (
            <>
              {" "}
              · last API sync {new Date(lastSyncAt).toLocaleTimeString()}
            </>
          )}
        </p>
      )}
    </div>
  );
}
