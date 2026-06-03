"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  saveThirdPlaceSlotAssignments,
  fillRoundOf32FromStandings,
} from "@/app/actions/matches";
import {
  THIRD_PLACE_SLOT_KEYS,
  type ThirdPlaceSlotKey,
} from "@/lib/bracket/fifa-wc2026";

export type QualifyingThirdRow = {
  teamId: string;
  name: string;
  flag: string;
  groupName: string;
};

type Props = {
  competitionId: string;
  groupFinishedCount: number;
  groupTotal: number;
  qualifyingThirds: QualifyingThirdRow[];
  savedSlots: Partial<Record<ThirdPlaceSlotKey, string>>;
  r32Populated: boolean;
  slotsComplete: boolean;
};

const SLOT_LABELS: Record<ThirdPlaceSlotKey, string> = {
  ABCDF: "1E vs 3rd (ABCDF)",
  CDFGH: "1I vs 3rd (CDFGH)",
  CEFHI: "1A vs 3rd (CEFHI)",
  EHIJK: "1L vs 3rd (EHIJK)",
  BEFIJ: "1D vs 3rd (BEFIJ)",
  AEHIJ: "1G vs 3rd (AEHIJ)",
  EFGIJ: "1B vs 3rd (EFGIJ)",
  DEIJL: "1K vs 3rd (DEIJL)",
};

export function AdminKnockoutSetup({
  competitionId,
  groupFinishedCount,
  groupTotal,
  qualifyingThirds,
  savedSlots,
  r32Populated,
  slotsComplete,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [assignments, setAssignments] = useState<
    Partial<Record<ThirdPlaceSlotKey, string>>
  >(() => {
    const initial: Partial<Record<ThirdPlaceSlotKey, string>> = {
      ...savedSlots,
    };
    if (!slotsComplete && qualifyingThirds.length === 8) {
      THIRD_PLACE_SLOT_KEYS.forEach((key, i) => {
        if (!initial[key] && qualifyingThirds[i]) {
          initial[key] = qualifyingThirds[i].teamId;
        }
      });
    }
    return initial;
  });
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const groupComplete = groupFinishedCount >= groupTotal;
  const allAssigned = THIRD_PLACE_SLOT_KEYS.every((k) => assignments[k]);

  async function handleSaveSlots() {
    setMessage(null);
    setPending(true);
    try {
      const result = await saveThirdPlaceSlotAssignments(
        competitionId,
        assignments as Record<ThirdPlaceSlotKey, string>
      );
      if (result.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        setMessage({ text: "Third-place slots saved.", type: "success" });
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

  async function handleGenerateR32(force = false) {
    if (!groupComplete) return;
    if (!allAssigned) {
      setMessage({
        text: "Assign all eight third-place slots first.",
        type: "error",
      });
      return;
    }

    let msg =
      "Generate Round of 32 from group standings and third-place assignments?";
    if (r32Populated && !force) {
      msg =
        "Replace existing Round of 32 teams from current standings and slot assignments?";
    }
    if (!window.confirm(msg)) return;

    setMessage(null);
    setPending(true);
    try {
      if (!slotsComplete || Object.keys(savedSlots).length === 0) {
        const saveResult = await saveThirdPlaceSlotAssignments(
          competitionId,
          assignments as Record<ThirdPlaceSlotKey, string>
        );
        if (saveResult.error) {
          setMessage({ text: saveResult.error, type: "error" });
          return;
        }
      }

      const result = await fillRoundOf32FromStandings(
        competitionId,
        r32Populated || force
      );
      if (result.error) {
        if ("needsForce" in result && result.needsForce) {
          await handleGenerateR32(true);
          return;
        }
        setMessage({ text: result.error, type: "error" });
      } else {
        setMessage({
          text: "Round of 32 generated (FIFA bracket structure).",
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

  if (!groupComplete && qualifyingThirds.length === 0) {
    return (
      <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Knockout setup
        </h3>
        <p className="text-xs text-slate-500">
          Group stage: {groupFinishedCount}/{groupTotal} finished — complete all
          group matches, then assign third-place slots and generate R32.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Knockout setup
      </h3>
      <p className="text-xs text-slate-500">
        FIFA WC 2026 structure: assign each qualifying third-placed team to its
        R32 slot (match Annexe C / TV bracket), then generate Round of 32.
      </p>

      {qualifyingThirds.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Eight qualifying third-placed teams
          </p>
          <ul className="text-sm text-slate-600 dark:text-slate-400">
            {qualifyingThirds.map((t) => (
              <li key={t.teamId}>
                {t.flag} {t.name} (3rd Group {t.groupName})
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            {THIRD_PLACE_SLOT_KEYS.map((key) => (
              <label key={key} className="block text-sm">
                <span className="mb-1 block text-slate-600 dark:text-slate-400">
                  {SLOT_LABELS[key]}
                </span>
                <select
                  value={assignments[key] ?? ""}
                  onChange={(e) =>
                    setAssignments((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="">Select team…</option>
                  {qualifyingThirds.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.flag} {t.name} (3rd {t.groupName})
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <button
            type="button"
            disabled={pending || !allAssigned}
            onClick={handleSaveSlots}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            {pending ? "Working…" : "Save third-place slot assignments"}
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={pending || !groupComplete || !allAssigned}
        onClick={() => handleGenerateR32()}
        className="w-full rounded-lg border border-pitch-600 bg-white px-4 py-3 text-sm font-medium text-pitch-700 hover:bg-pitch-50 disabled:opacity-50 dark:bg-slate-800 dark:text-pitch-300 dark:hover:bg-slate-700"
      >
        {pending ? "Working…" : "Generate Round of 32"}
      </button>

      {!groupComplete && (
        <p className="text-xs text-slate-500">
          Group stage: {groupFinishedCount}/{groupTotal} finished.
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
