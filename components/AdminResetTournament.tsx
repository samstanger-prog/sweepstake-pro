"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetTournament } from "@/app/actions/competition";

export function AdminResetTournament({
  competitionId,
  inviteCode,
}: {
  competitionId: string;
  inviteCode: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [confirmCode, setConfirmCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const codeMatches =
    confirmCode.trim().toUpperCase() === inviteCode.toUpperCase();

  async function handleReset() {
    if (!codeMatches) return;
    setPending(true);
    setMessage(null);
    try {
      const result = await resetTournament(competitionId, confirmCode.trim());
      if (result.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        setMessage({
          text: "Tournament reset. Players kept — run team draw again.",
          type: "success",
        });
        setStep("idle");
        setConfirmCode("");
        router.refresh();
      }
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Reset failed",
        type: "error",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-600">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
        Danger zone
      </h3>

      {step === "idle" ? (
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setStep("confirm");
          }}
          className="w-full rounded-lg border-2 border-red-300 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          Reset tournament
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-200">
            This clears team assignments, match results, standings, and scores.
            <strong> All {inviteCode} players are kept.</strong> You can run a
            new draw and simulation after.
          </p>
          <div>
            <label
              htmlFor="reset_confirm_code"
              className="mb-1 block text-sm font-medium"
            >
              Type invite code <code>{inviteCode}</code> to confirm
            </label>
            <input
              id="reset_confirm_code"
              type="text"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder={inviteCode}
              className="w-full rounded-lg border border-red-300 px-3 py-2 uppercase dark:border-red-800 dark:bg-slate-900"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || !codeMatches}
              onClick={handleReset}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "Resetting…" : "Confirm reset"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setStep("idle");
                setConfirmCode("");
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
