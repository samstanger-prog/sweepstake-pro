"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/app/actions/competition";

export function AdminLoginForm({
  envConfigured,
}: {
  envConfigured: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(adminLogin, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state?.success, router]);

  return (
    <form action={action} className="card max-w-sm space-y-4">
      {!envConfigured && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
          Server has no <code className="font-mono">ADMIN_SECRET</code>. Create{" "}
          <code className="font-mono">.env.local</code> from{" "}
          <code className="font-mono">.env.example</code>, set a secret value,
          and restart the dev server.
        </p>
      )}
      <div>
        <label htmlFor="secret" className="mb-1 block text-sm font-medium">
          Admin Secret
        </label>
        <input
          id="secret"
          name="secret"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Value from .env.local"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
        />
        <p className="mt-1 text-xs text-slate-500">
          Enter the secret you chose in <code>ADMIN_SECRET</code>, not the word
          &quot;ADMIN_SECRET&quot;.
        </p>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-pitch-600">Logged in. Loading admin…</p>
      )}
      <button
        type="submit"
        disabled={pending || !envConfigured}
        className="w-full rounded-lg bg-pitch-600 py-2 text-white hover:bg-pitch-700 disabled:opacity-50"
      >
        {pending ? "Checking…" : "Login"}
      </button>
    </form>
  );
}
