import { JoinForm } from "@/components/JoinForm";
import { SupabaseSetupPanel } from "@/components/SupabaseSetupPanel";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function HomePage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Join a Sweepstake</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Enter your invite code and name to join. Click your name on the
          leaderboard to see your points breakdown.{" "}
          <Link href="/rules" className="text-pitch-600 hover:underline">
            How points work
          </Link>
        </p>
      </div>
      {!supabaseReady && <SupabaseSetupPanel />}
      <JoinForm disabled={!supabaseReady} />
    </div>
  );
}
