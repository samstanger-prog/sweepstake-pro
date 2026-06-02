"use client";

import { useActionState } from "react";
import { createCompetition } from "@/app/actions/competition";
import { InviteCodeCopy } from "./InviteCodeCopy";

export function CreateCompetitionForm() {
  const [state, action, pending] = useActionState(
    async (
      _prev: { error?: string; inviteCode?: string; id?: string } | null,
      formData: FormData
    ) => {
      return createCompetition(formData);
    },
    null
  );

  return (
    <div className="space-y-4">
      <form action={action} className="card space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Competition Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="World Cup 2026 Office Pool"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-pitch-600 py-2 text-white hover:bg-pitch-700 disabled:opacity-50"
        >
          Create Competition
        </button>
      </form>

      {state?.inviteCode && (
        <div className="card">
          <p className="mb-2 text-sm font-medium">Share this invite code:</p>
          <InviteCodeCopy code={state.inviteCode} />
        </div>
      )}
    </div>
  );
}
