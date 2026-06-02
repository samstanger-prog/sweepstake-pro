"use client";

import { useActionState } from "react";
import { findProfile } from "@/app/actions/competition";

export function FindProfileForm({ disabled = false }: { disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        await findProfile(formData);
        return null;
      } catch (e) {
        if (e && typeof e === "object" && "digest" in e) throw e;
        return { error: e instanceof Error ? e.message : "Could not find profile" };
      }
    },
    null
  );

  return (
    <form action={formAction} className="card space-y-4">
      <div>
        <label htmlFor="find_invite_code" className="mb-1 block text-sm font-medium">
          Invite Code
        </label>
        <input
          id="find_invite_code"
          name="invite_code"
          required
          placeholder="ABC123"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase dark:border-slate-600 dark:bg-slate-700"
        />
      </div>
      <div>
        <label htmlFor="find_name" className="mb-1 block text-sm font-medium">
          Your Name
        </label>
        <input
          id="find_name"
          name="name"
          required
          placeholder="Same name you joined with"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending || disabled}
        className="w-full rounded-lg border-2 border-pitch-600 py-3 font-semibold text-pitch-700 hover:bg-pitch-50 disabled:opacity-50 dark:text-pitch-400 dark:hover:bg-pitch-900/30"
      >
        {disabled ? "Database not configured" : pending ? "Opening…" : "Find my profile"}
      </button>
    </form>
  );
}
