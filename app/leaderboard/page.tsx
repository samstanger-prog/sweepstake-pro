import { LeaderboardTable, type LeaderboardEntry } from "@/components/LeaderboardTable";
import { ParticipantTeams } from "@/components/ParticipantTeams";
import { SupabaseSetupPanel } from "@/components/SupabaseSetupPanel";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { parseAssignedTeams } from "@/lib/leaderboard/parse-teams";
import type { ScoreBreakdown } from "@/lib/supabase/types";
import Link from "next/link";
import { profilePath } from "@/lib/utils/slug";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string }>;
}) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <SupabaseSetupPanel />
      </div>
    );
  }

  const supabase = await createServerSupabase();

  let competitionId = params.competition;

  if (!competitionId) {
    const { data: latest } = await supabase
      .from("competitions")
      .select("id, name, invite_code")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    competitionId = latest?.id;
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, invite_code")
    .order("created_at", { ascending: false });

  if (!competitionId) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-4 text-slate-500">No competitions yet. Create one in Admin.</p>
      </div>
    );
  }

  const { data: rows } = await supabase
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
      participant_scores (
        total_points,
        breakdown
      )
    `
    )
    .eq("competition_id", competitionId);

  const current = competitions?.find((c) => c.id === competitionId);
  const inviteCode = current?.invite_code ?? "";

  const entries: LeaderboardEntry[] = (rows ?? [])
    .map((r) => {
      const scores = Array.isArray(r.participant_scores)
        ? r.participant_scores[0]
        : r.participant_scores;
      const slug = r.slug as string | undefined;
      return {
        participantId: r.id,
        name: r.name,
        profileHref:
          inviteCode && slug
            ? profilePath(inviteCode, slug)
            : `/user/${r.id}`,
        teams: parseAssignedTeams(r.user_teams),
        totalPoints: scores?.total_points ?? 0,
        breakdown: scores?.breakdown as ScoreBreakdown | undefined,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        {current && (
          <p className="text-sm text-slate-500">
            {current.name} · Code {current.invite_code}
          </p>
        )}
        <p className="text-xs text-slate-400">
          Each player has two teams (Pot A + Pot B). Tap a row for points breakdown.
        </p>
      </div>

      {competitions && competitions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {competitions.map((c) => (
            <a
              key={c.id}
              href={`/leaderboard?competition=${c.id}`}
              className={`rounded-full px-3 py-1 text-sm ${
                c.id === competitionId
                  ? "bg-pitch-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              {c.name}
            </a>
          ))}
        </div>
      )}

      <div className="md:hidden">
        <LeaderboardTable entries={entries} />
      </div>

      <div className="hidden md:block overflow-x-auto card p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-600">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Player</th>
              <th className="p-3">Teams (Pot A + Pot B)</th>
              <th className="p-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.participantId} className="border-b border-slate-100 dark:border-slate-700">
                <td className="p-3 font-bold">{e.rank}</td>
                <td className="p-3">
                  <Link
                    href={e.profileHref}
                    className="font-medium text-pitch-700 hover:underline dark:text-pitch-400"
                  >
                    {e.name}
                  </Link>
                </td>
                <td className="p-3">
                  <ParticipantTeams teams={e.teams} compact />
                </td>
                <td className="p-3 text-right font-bold text-pitch-600">{e.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
