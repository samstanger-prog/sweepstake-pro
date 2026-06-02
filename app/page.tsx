import { FindProfileForm } from "@/components/FindProfileForm";
import { JoinForm } from "@/components/JoinForm";
import { SupabaseSetupPanel } from "@/components/SupabaseSetupPanel";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function HomePage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Join a Sweepstake</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Enter your invite code and name to join. You&apos;ll get a personal
          page like <code className="text-sm">/c/CODE/your-name</code> for your
          teams and points.
        </p>
      </div>
      {!supabaseReady && <SupabaseSetupPanel />}
      <JoinForm disabled={!supabaseReady} />

      <section className="space-y-3 border-t border-slate-200 pt-8 dark:border-slate-700">
        <h2 className="text-lg font-semibold">Already joined?</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter the same invite code and name to open your profile again.
        </p>
        <FindProfileForm disabled={!supabaseReady} />
      </section>
    </div>
  );
}
