"use client";

import Link from "next/link";
import { useState } from "react";
import { PointsBreakdown } from "./PointsBreakdown";
import { ParticipantTeams, type AssignedTeam } from "./ParticipantTeams";
import type { ScoreBreakdown } from "@/lib/supabase/types";

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  name: string;
  profileHref: string;
  totalPoints: number;
  teams: AssignedTeam[];
  breakdown?: ScoreBreakdown;
}

export function LeaderboardTable({
  entries,
  entryHints = {},
}: {
  entries: LeaderboardEntry[];
  entryHints?: Record<string, { liveLine?: string; isLive: boolean }>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <p className="text-center text-slate-500 py-8">
        No scores yet. Run a simulation from Admin.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const hint = entryHints[e.participantId];
        return (
        <div key={e.participantId} className="card">
          <button
            type="button"
            className="flex w-full items-start justify-between gap-2 text-left"
            onClick={() =>
              setExpanded(expanded === e.participantId ? null : e.participantId)
            }
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    e.rank === 1
                      ? "bg-yellow-400 text-yellow-900"
                      : e.rank === 2
                        ? "bg-slate-300 text-slate-800"
                        : e.rank === 3
                          ? "bg-amber-600 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700"
                  }`}
                >
                  {e.rank}
                </span>
                <Link
                  href={e.profileHref}
                  className="font-semibold text-pitch-700 hover:underline dark:text-pitch-400"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  {e.name}
                </Link>
                {hint?.isLive && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    Live
                  </span>
                )}
              </div>
              <ParticipantTeams teams={e.teams} />
              {hint?.liveLine && (
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                  {hint.liveLine}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xl font-bold text-pitch-600 dark:text-pitch-500">
              {e.totalPoints} pts
            </span>
          </button>

          {expanded === e.participantId && e.breakdown?.teams && (
            <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-600">
              <PointsBreakdown teams={e.breakdown.teams} />
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
