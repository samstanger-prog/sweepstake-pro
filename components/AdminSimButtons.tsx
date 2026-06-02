"use client";

import { useState, useTransition } from "react";
import { runSim, runTeamDraw } from "@/app/actions/competition";
import type { SimMode } from "@/lib/simulation/run";

export function AdminSimButtons({ competitionId }: { competitionId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string; success?: boolean; assigned?: number }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setMessage(result.error);
      else if (result.assigned) setMessage(`Assigned ${result.assigned} participants`);
      else setMessage("Done!");
    });
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
            run(() =>
              b.draw
                ? runTeamDraw(competitionId)
                : runSim(competitionId, b.mode!)
            )
          }
          className="w-full rounded-lg bg-pitch-600 px-4 py-3 text-sm font-medium text-white hover:bg-pitch-700 disabled:opacity-50"
        >
          {b.label}
        </button>
      ))}
      {message && (
        <p className="text-sm text-pitch-700 dark:text-pitch-400">{message}</p>
      )}
    </div>
  );
}
