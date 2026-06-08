"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { runSim, runTeamDraw } from "@/app/actions/competition";
import type { SimMode } from "@/lib/simulation/run";

type ActionResult = {
  error?: string;
  success?: boolean;
  assigned?: number;
  potAEndRank?: number;
};

type ButtonDef = {
  key: string;
  label: string;
  mode?: SimMode;
  draw?: boolean;
  warning: string;
  needsConfirm: boolean;
};

export function AdminSimButtons({
  competitionId,
  hasFtMatches = false,
  hasDrawn = false,
}: {
  competitionId: string;
  hasFtMatches?: boolean;
  hasDrawn?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const manualScoreNote = hasFtMatches
    ? " Manual scores you entered will be lost."
    : "";

  const buttons: ButtonDef[] = [
    {
      key: "draw",
      label: "Run Team Draw",
      draw: true,
      needsConfirm: hasDrawn,
      warning:
        "This replaces all team assignments with a new random draw. Players stay the same.",
    },
    {
      key: "group",
      label: "Run Group Stage Simulation",
      mode: "group",
      needsConfirm: true,
      warning: `Generate group stage scores? This overwrites group match results.${manualScoreNote}`,
    },
    {
      key: "knockout",
      label: "Run Knockout Simulation",
      mode: "knockout",
      needsConfirm: true,
      warning: `Generate knockout scores? This overwrites knockout match results.${manualScoreNote}`,
    },
    {
      key: "full",
      label: "Run Full Tournament Simulation",
      mode: "full",
      needsConfirm: true,
      warning: `Run the full tournament simulation? All match scores will be overwritten.${manualScoreNote}`,
    },
    {
      key: "fast",
      label: "Fast Simulate (instant)",
      mode: "fast",
      needsConfirm: true,
      warning: `Fast simulate every match as 2–1? All scores will be overwritten instantly.${manualScoreNote}`,
    },
  ];

  async function run(label: string, action: () => Promise<ActionResult>) {
    setMessage(null);
    setPending(true);
    try {
      const result = await action();
      if (result.error) {
        setMessage({ text: result.error, type: "error" });
      } else if (result.assigned) {
        const potNote =
          result.potAEndRank != null
            ? ` Pot A = top ${result.assigned} ranked (through #${result.potAEndRank}); Pot B = the other ${48 - result.assigned} teams.`
            : "";
        setMessage({
          text: `Team draw complete — ${result.assigned} players assigned.${potNote}`,
          type: "success",
        });
        setConfirming(null);
        router.refresh();
      } else {
        setMessage({ text: `${label} complete.`, type: "success" });
        setConfirming(null);
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

  function getAction(b: ButtonDef) {
    return () =>
      b.draw
        ? runTeamDraw(competitionId)
        : runSim(competitionId, b.mode!);
  }

  return (
    <div className="space-y-2">
      {hasFtMatches && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Manual scores entered — simulation will overwrite match results.
        </p>
      )}
      {buttons.map((b) => (
        <div key={b.key}>
          {confirming === b.key ? (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                {b.warning}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(b.label, getAction(b))}
                  className="flex-1 rounded-lg bg-pitch-600 px-4 py-2 text-sm font-medium text-white hover:bg-pitch-700 disabled:opacity-50"
                >
                  {pending ? "Working…" : "Confirm"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirming(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={pending || confirming !== null}
              onClick={() => {
                setMessage(null);
                if (b.needsConfirm) {
                  setConfirming(b.key);
                } else {
                  run(b.label, getAction(b));
                }
              }}
              className="w-full rounded-lg bg-pitch-600 px-4 py-3 text-sm font-medium text-white hover:bg-pitch-700 disabled:opacity-50"
            >
              {pending ? "Working…" : b.label}
            </button>
          )}
        </div>
      ))}
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
