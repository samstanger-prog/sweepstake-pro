"use client";

import { useActionState } from "react";
import { joinCompetition } from "@/app/actions/competition";

export function JoinForm({ disabled = false }: { disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        await joinCompetition(formData);
        return null;
      } catch (e) {
        if (e && typeof e === "object" && "digest" in e) throw e;
        return { error: e instanceof Error ? e.message : "Failed to join" };
      }
    },
    null
  );

  return (
    <form action={formAction} className="card space-y-4">
      <div>
        <label htmlFor="invite_code" className="mb-1 block text-sm font-medium">
          Invite Code
        </label>
        <input
          id="invite_code"
          name="invite_code"
          required
          placeholder="ABC123"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase dark:border-slate-600 dark:bg-slate-700"
        />
      </div>
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Your Name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Alex"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending || disabled}
        className="w-full rounded-lg bg-pitch-600 py-3 font-semibold text-white hover:bg-pitch-700 disabled:opacity-50"
      >
        {disabled ? "Database not configured" : pending ? "Joining…" : "Join Sweepstake"}
      </button>
    </form>
  );
}
