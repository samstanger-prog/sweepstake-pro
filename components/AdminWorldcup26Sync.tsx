"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { syncWorldcup26FromAdmin } from "@/app/actions/worldcup26-sync";

export function AdminWorldcup26Sync({
  competitionId,
  lastSyncAt,
  syncEnabled,
}: {
  competitionId: string;
  lastSyncAt: string | null;
  syncEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const enabled = syncEnabled;

  async function handleSync() {
    setPending(true);
    setMessage(null);
    try {
      const result = await syncWorldcup26FromAdmin(competitionId);
      if (result.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        setMessage({
          text: result.message ?? "Synced.",
          type: "success",
        });
        router.refresh();
      }
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Sync failed",
        type: "error",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border-t border-slate-200 pt-4 dark:border-slate-600">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Live scores (worldcup26.ir)
      </h3>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        Pull live and finished match scores from{" "}
        <a
          href="https://worldcup26.ir"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pitch-600 hover:underline"
        >
          worldcup26.ir
        </a>
        . Does not assign third-place slots or generate R32.
      </p>
      {lastSyncAt && (
        <p className="mb-2 text-xs text-slate-500">
          Last synced: {new Date(lastSyncAt).toLocaleString()}
        </p>
      )}
      {!enabled && (
        <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">
          Set WORLDCUP26_SYNC_ENABLED=true for automatic cron + leaderboard
          polling.
        </p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={handleSync}
        className="w-full rounded-lg bg-pitch-600 px-4 py-3 text-sm font-medium text-white hover:bg-pitch-700 disabled:opacity-50"
      >
        {pending ? "Syncing…" : "Sync now"}
      </button>
      {message && (
        <p
          className={`mt-3 rounded-lg p-3 text-sm ${
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
