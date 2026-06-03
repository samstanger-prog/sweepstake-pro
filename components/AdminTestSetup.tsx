"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setupTestCompetition } from "@/app/actions/competition";

type Props = {
  competitionId: string;
  participantCount: number;
  participantNames: string[];
  hasRealPlayers: boolean;
  allTestPlayers: boolean;
};

export function AdminTestSetup({
  competitionId,
  participantCount,
  participantNames,
  hasRealPlayers,
  allTestPlayers,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  async function handleSetup() {
    const msg =
      "Adds 10 test players and runs team draw. No scores will be entered. Use Reset tournament to clear scores and run again.";
    if (!window.confirm(msg)) return;

    setMessage(null);
    setPending(true);
    try {
      const result = await setupTestCompetition(competitionId);
      if (result.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        const potNote =
          result.potAEndRank != null
            ? ` Pot A = top ${result.assigned} ranked (through #${result.potAEndRank}).`
            : "";
        setMessage({
          text: `Test setup complete — ${result.count} players added and team draw run.${potNote}`,
          type: "success",
        });
        router.refresh();
      }
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Something went wrong",
        type: "error",
      });
    } finally {
      setPending(false);
    }
  }

  const canSetup = participantCount === 0;

  return (
    <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Test / dry-run
      </h3>

      {allTestPlayers && participantCount > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Test sweepstake — reset before real players join, or create a new
          competition for the real World Cup.
        </p>
      )}

      {hasRealPlayers && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Competition has real players
          {participantNames.length > 0
            ? ` (${participantNames.slice(0, 3).join(", ")}${participantNames.length > 3 ? "…" : ""})`
            : ""}
          . Test setup only works on an empty competition.
        </p>
      )}

      {!canSetup && !allTestPlayers && participantCount > 0 && (
        <p className="text-sm text-slate-500">
          {participantCount} participant(s) joined. Create a new competition
          or remove players before test setup.
        </p>
      )}

      <button
        type="button"
        disabled={pending || !canSetup}
        onClick={handleSetup}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        {pending ? "Working…" : "Setup test (10 players)"}
      </button>

      {canSetup && (
        <p className="text-xs text-slate-500">
          Adds Test Player 1–10, runs team draw, leaves all matches unplayed.
        </p>
      )}

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-pitch-50 text-pitch-800 dark:bg-pitch-950/40 dark:text-pitch-200"
          }`}
          role="alert"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
