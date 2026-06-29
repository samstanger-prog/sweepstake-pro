import Link from "next/link";
import { TeamBadge } from "@/components/TeamBadge";
import { NextUpSection } from "@/components/NextUpSection";
import { PointsBreakdown } from "@/components/PointsBreakdown";
import type { TeamNextUp } from "@/lib/leaderboard/next-up";
import { profilePath } from "@/lib/utils/slug";
import { parseAssignedTeams } from "@/lib/leaderboard/parse-teams";
import type { AssignedTeam } from "@/components/ParticipantTeams";
import type { ScoreBreakdown } from "@/lib/supabase/types";

export interface ProfileData {
  id: string;
  name: string;
  slug: string;
  competition_id: string;
  competition: {
    name: string;
    invite_code: string;
    status: string;
  } | null;
  user_teams: Parameters<typeof parseAssignedTeams>[0];
  participant_scores:
    | {
        match_points: number;
        progression_points: number;
        bonus_points: number;
        total_points: number;
        breakdown: ScoreBreakdown;
      }
    | {
        match_points: number;
        progression_points: number;
        bonus_points: number;
        total_points: number;
        breakdown: ScoreBreakdown;
      }[]
    | null;
}

export function ProfileView({
  participant,
  teams: teamsProp,
  nextUp = [],
}: {
  participant: ProfileData;
  teams?: AssignedTeam[];
  nextUp?: TeamNextUp[];
}) {
  const competition = participant.competition;
  const scores = Array.isArray(participant.participant_scores)
    ? participant.participant_scores[0]
    : participant.participant_scores;
  const breakdown = scores?.breakdown as ScoreBreakdown | undefined;
  const teams = teamsProp ?? parseAssignedTeams(participant.user_teams);
  const sharePath =
    competition && participant.slug
      ? profilePath(competition.invite_code, participant.slug)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{participant.name}</h1>
        {competition && (
          <p className="text-sm text-slate-500">
            {competition.name} · {competition.status}
          </p>
        )}
        {sharePath && (
          <p className="mt-2 text-xs text-slate-400">
            Your page:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
              {sharePath}
            </code>
          </p>
        )}
      </div>

      {teams.length > 0 ? (
        <section className="card">
          <h2 className="mb-3 font-semibold">Your Teams</h2>
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <TeamBadge
                key={t.pot}
                name={t.name}
                flag={t.flag}
                pot={t.pot}
                eliminated={t.eliminated}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="card text-slate-500">
          Waiting for team draw. Check back after the admin runs the draw.
        </p>
      )}

      {teams.length > 0 && nextUp.length > 0 && <NextUpSection items={nextUp} />}

      {scores ? (
        <section className="card">
          <h2 className="mb-3 font-semibold">Points Breakdown</h2>
          <p className="text-3xl font-bold text-pitch-600 dark:text-pitch-500">
            {scores.total_points} pts
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Match {scores.match_points} · Progression {scores.progression_points}{" "}
            · Bonus {scores.bonus_points}
          </p>
          {breakdown?.teams && breakdown.teams.length > 0 && (
            <div className="mt-4">
              <PointsBreakdown teams={breakdown.teams} />
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm text-slate-500">
          Points appear after tournament simulation.
        </p>
      )}

      <Link
        href={`/leaderboard?competition=${participant.competition_id}`}
        className="block text-center text-pitch-600 hover:underline"
      >
        View Leaderboard →
      </Link>
    </div>
  );
}
