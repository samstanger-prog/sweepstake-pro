import { SUPABASE_SETUP_STEPS } from "@/lib/supabase/env";

export function SupabaseSetupPanel() {
  return (
    <section className="card space-y-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40">
      <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
        Connect Supabase to continue
      </h2>
      <p className="text-sm text-amber-900/80 dark:text-amber-100/80">
        Admin login worked, but the database is not configured yet. Add your
        Supabase keys to <code className="font-mono">.env.local</code>:
      </p>
      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...`}
      </pre>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-amber-900 dark:text-amber-100">
        {SUPABASE_SETUP_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="text-xs text-amber-800 dark:text-amber-200">
        Find keys at:{" "}
        <a
          href="https://supabase.com/dashboard/project/_/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          supabase.com → Project Settings → API
        </a>
      </p>
    </section>
  );
}
