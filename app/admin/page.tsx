import { AdminResetTournament } from "@/components/AdminResetTournament";
import { AdminSimButtons } from "@/components/AdminSimButtons";
import { AdminTestSetup } from "@/components/AdminTestSetup";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { CreateCompetitionForm } from "@/components/CreateCompetitionForm";
import { InviteCodeCopy } from "@/components/InviteCodeCopy";
import { ParticipantRoster, type RosterEntry } from "@/components/ParticipantRoster";
import { SupabaseSetupPanel } from "@/components/SupabaseSetupPanel";
import { parseAssignedTeams } from "@/lib/leaderboard/parse-teams";
import { profilePath } from "@/lib/utils/slug";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isMockDataEnabled } from "@/lib/config";
import { isTestPlayerName } from "@/lib/test/participants";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  const mockMode = isMockDataEnabled();
  const adminSecretConfigured = Boolean(process.env.ADMIN_SECRET);
  const supabaseReady = isSupabaseConfigured();

  if (!authed) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Enter your admin secret to manage competitions and run simulations.
        </p>
        {!supabaseReady && <SupabaseSetupPanel />}
        <AdminLoginForm envConfigured={adminSecretConfigured} />
      </div>
    );
  }

  if (!supabaseReady) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            Logged in successfully
          </p>
        </div>
        <SupabaseSetupPanel />
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, invite_code, status, created_at")
    .order("created_at", { ascending: false });

  const latest = competitions?.[0];

  let participantCount = 0;
  let roster: RosterEntry[] = [];
  let participantNames: string[] = [];
  let allTestPlayers = false;
  let hasRealPlayers = false;

  if (latest) {
    const { data: participants } = await supabase
      .from("participants")
      .select(
        `
        id,
        name,
        slug,
        user_teams (
          pot,
          teams ( name, flag_emoji, pot )
        ),
        participant_scores ( total_points )
      `
      )
      .eq("competition_id", latest.id)
      .order("name");

    roster = (participants ?? []).map((p) => {
      const scores = Array.isArray(p.participant_scores)
        ? p.participant_scores[0]
        : p.participant_scores;
      return {
        id: p.id,
        name: p.name,
        profileHref:
          latest.invite_code && p.slug
            ? profilePath(latest.invite_code, p.slug as string)
            : `/user/${p.id}`,
        totalPoints: scores?.total_points ?? 0,
        teams: parseAssignedTeams(p.user_teams),
      };
    });
    participantCount = roster.length;
    participantNames = roster.map((r) => r.name);
    allTestPlayers =
      participantCount > 0 &&
      participantNames.every((n) => isTestPlayerName(n));
    hasRealPlayers =
      participantCount > 0 &&
      participantNames.some((n) => !isTestPlayerName(n));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mock mode: {mockMode ? "ON" : "OFF"} · USE_MOCK_DATA env
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Create Competition</h2>
        <CreateCompetitionForm />
      </section>

      {latest && (
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Active: {latest.name}</h2>
          <p className="text-sm text-slate-500">Status: {latest.status}</p>
          <InviteCodeCopy code={latest.invite_code} />
          <p className="text-sm">{participantCount} participants joined (max 20)</p>
          {participantCount > 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Team draw: Pot A = top {participantCount} FIFA-ranked teams; Pot
              B = remaining {48 - participantCount} teams (shuffled separately).
            </p>
          )}

          {roster.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Team assignments
              </h3>
              <ParticipantRoster entries={roster} />
            </div>
          )}

          <AdminSimButtons competitionId={latest.id} />
          <AdminTestSetup
            competitionId={latest.id}
            participantCount={participantCount}
            participantNames={participantNames}
            hasRealPlayers={hasRealPlayers}
            allTestPlayers={allTestPlayers}
          />
          <AdminResetTournament
            competitionId={latest.id}
            inviteCode={latest.invite_code}
          />
        </section>
      )}

      {competitions && competitions.length > 1 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">All Competitions</h2>
          <ul className="space-y-2 text-sm">
            {competitions.map((c) => (
              <li key={c.id} className="card flex justify-between">
                <span>{c.name}</span>
                <span className="text-slate-500">{c.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
