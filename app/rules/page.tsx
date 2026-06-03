import Link from "next/link";
import { WC2026_TEAMS } from "@/lib/mock/wc2026-teams";
import {
  GOAL_POINTS,
  GROUP_DRAW_POINTS,
  GROUP_WIN_POINTS,
  KNOCKOUT_ROUNDS_ORDER,
  KNOCKOUT_ROUND_POINTS,
  WORLD_CUP_WINNER_BONUS,
} from "@/lib/scoring/rules";

const RANKED_TEAMS = [...WC2026_TEAMS].sort(
  (a, b) => a.fifa_rank - b.fifa_rank
);

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">How points work</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          You get two teams at the draw: one strong team (Pot A) and one from
          the rest (Pot B). Your score is both teams added together.
        </p>
      </div>

      <section className="card space-y-3">
        <h2 className="font-semibold">Goals — all stages</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Every goal your team scores in the group stage, knockout, or
          third-place match earns points.
        </p>
        <RuleRow label="Goal scored" points={GOAL_POINTS} suffix="per goal" />
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Group stage only</h2>
        <RuleRow label="Win" points={GROUP_WIN_POINTS} />
        <RuleRow label="Draw" points={GROUP_DRAW_POINTS} />
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Knockout — cumulative</h2>
        {KNOCKOUT_ROUNDS_ORDER.map((round) => (
          <RuleRow
            key={round}
            label={`Reach ${round}`}
            points={KNOCKOUT_ROUND_POINTS[round]}
          />
        ))}
        <RuleRow label="Win World Cup" points={WORLD_CUP_WINNER_BONUS} />
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="font-semibold">World Cup 2026 teams (FIFA ranking)</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Rankings as at draw —{" "}
            <a
              href="https://inside.fifa.com/fifa-world-ranking/men"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pitch-600 hover:underline dark:text-pitch-500"
            >
              verify on FIFA.com →
            </a>
          </p>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {RANKED_TEAMS.map((team) => (
            <li
              key={team.code}
              className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-8 shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400">
                  #{team.fifa_rank}
                </span>
                <span className="truncate">
                  {team.flag_emoji} {team.name}
                </span>
              </span>
              <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                Group {team.group_name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/leaderboard"
        className="block text-center text-pitch-600 hover:underline"
      >
        View leaderboard →
      </Link>
    </div>
  );
}

function RuleRow({
  label,
  points,
  suffix,
}: {
  label: string;
  points: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0 dark:border-slate-700">
      <span>{label}</span>
      <span className="font-semibold text-pitch-600 dark:text-pitch-500">
        +{points}
        {suffix ? ` ${suffix}` : ""}
      </span>
    </div>
  );
}
