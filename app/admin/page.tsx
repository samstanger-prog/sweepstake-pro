import {
  AdminMatchEntry,
  type AdminMatchRow,
} from "@/components/AdminMatchEntry";
import { AdminResetTournament } from "@/components/AdminResetTournament";
import { AdminSimButtons } from "@/components/AdminSimButtons";
import { AdminTestSetup } from "@/components/AdminTestSetup";
import { GROUP_STAGE_MATCH_COUNT } from "@/lib/simulation/bracket";
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
  let adminMatches: AdminMatchRow[] = [];
  let groupFinishedCount = 0;
  let hasFtMatches = false;
  let r32Populated = false;
  let assignedTeamIds: string[] = [];

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

    const [{ data: matchRows }, { data: teams }, { data: userTeamRows }] =
      await Promise.all([
        supabase
          .from("matches")
          .select(
            "id, fixture_id, round, group_name, status, home_goals, away_goals, home_team_id, away_team_id"
          )
          .eq("competition_id", latest.id)
          .order("fixture_id"),
        supabase.from("teams").select("id, name, flag_emoji, code"),
        supabase
          .from("user_teams")
          .select("team_id")
          .eq("competition_id", latest.id),
      ]);

    assignedTeamIds = [
      ...new Set(userTeamRows?.map((ut) => ut.team_id) ?? []),
    ];

    const teamMap = new Map(teams?.map((t) => [t.id, t]) ?? []);
    const tbdId = teams?.find((t) => t.code === "TBD")?.id;

    adminMatches = (matchRows ?? []).map((m) => {
      const home = teamMap.get(m.home_team_id);
      const away = teamMap.get(m.away_team_id);
      return {
        id: m.id,
        fixtureId: m.fixture_id,
        round: m.round,
        groupName: m.group_name,
        status: m.status,
        homeGoals: m.home_goals,
        awayGoals: m.away_goals,
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        homeName: home?.name ?? "?",
        homeFlag: home?.flag_emoji ?? "",
        homeCode: home?.code ?? "",
        awayName: away?.name ?? "?",
        awayFlag: away?.flag_emoji ?? "",
        awayCode: away?.code ?? "",
      };
    });

    hasFtMatches = adminMatches.some((m) => m.status === "FT");
    groupFinishedCount = adminMatches.filter(
      (m) => m.round === "Group Stage" && m.status === "FT"
    ).length;
    r32Populated =
      !!tbdId &&
      adminMatches.some(
        (m) =>
          m.round === "Round of 32" &&
          m.homeCode !== "TBD" &&
          m.awayCode !== "TBD"
      );
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

          <AdminSimButtons
            competitionId={latest.id}
            hasFtMatches={hasFtMatches}
          />
          {adminMatches.length > 0 && (
            <AdminMatchEntry
              competitionId={latest.id}
              matches={adminMatches}
              assignedTeamIds={assignedTeamIds}
              groupFinishedCount={groupFinishedCount}
              groupTotal={GROUP_STAGE_MATCH_COUNT}
              r32Populated={r32Populated}
            />
          )}
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
