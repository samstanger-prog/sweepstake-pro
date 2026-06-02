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

export function AdminSimButtons({ competitionId }: { competitionId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  async function run(
    label: string,
    action: () => Promise<ActionResult>
  ) {
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
        router.refresh();
      } else {
        setMessage({ text: `${label} complete.`, type: "success" });
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

  const buttons: { label: string; mode?: SimMode; draw?: boolean }[] = [
    { label: "Run Team Draw", draw: true },
    { label: "Run Group Stage Simulation", mode: "group" },
    { label: "Run Knockout Simulation", mode: "knockout" },
    { label: "Run Full Tournament Simulation", mode: "full" },
    { label: "Fast Simulate (instant)", mode: "fast" },
  ];

  return (
    <div className="space-y-2">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          disabled={pending}
          onClick={() =>
            run(b.label, () =>
              b.draw
                ? runTeamDraw(competitionId)
                : runSim(competitionId, b.mode!)
            )
          }
          className="w-full rounded-lg bg-pitch-600 px-4 py-3 text-sm font-medium text-white hover:bg-pitch-700 disabled:opacity-50"
        >
          {pending ? "Working…" : b.label}
        </button>
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
