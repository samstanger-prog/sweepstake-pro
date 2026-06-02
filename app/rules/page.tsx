import Link from "next/link";
import {
  GOAL_POINTS,
  GROUP_DRAW_POINTS,
  GROUP_WIN_POINTS,
  KNOCKOUT_ROUNDS_ORDER,
  KNOCKOUT_ROUND_POINTS,
  WORLD_CUP_WINNER_BONUS,
} from "@/lib/scoring/rules";

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">How points work</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Each player gets two teams (Pot A + Pot B). Your total is the sum of
          both teams.
        </p>
      </div>

      <section className="card space-y-3">
        <h2 className="font-semibold">Goals — all stages</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Every goal your team scores in the group stage or knockout earns
          points.
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
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Each knockout round your team completes adds once (they stack).
        </p>
        {KNOCKOUT_ROUNDS_ORDER.map((round) => (
          <RuleRow
            key={round}
            label={`Reach ${round}`}
            points={KNOCKOUT_ROUND_POINTS[round]}
          />
        ))}
        <RuleRow label="Win World Cup" points={WORLD_CUP_WINNER_BONUS} />
      </section>

      <section className="card text-sm text-slate-600 dark:text-slate-400">
        <p>
          <strong className="text-slate-800 dark:text-slate-200">Example:</strong>{" "}
          A team reaches the Final and wins the World Cup: 10 + 10 + 10 + 10
          progression (from R16 onward in the 24-team mock), plus{" "}
          {WORLD_CUP_WINNER_BONUS} winner bonus, plus +1 per goal in every match
          they played.
        </p>
        <p className="mt-2">
          The current mock tournament has no Round of 32 (starts at Round of
          16). R32 points apply when the 48-team bracket is added.
        </p>
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
