import type { TeamNextUp } from "@/lib/leaderboard/next-up";

export function NextUpSection({ items }: { items: TeamNextUp[] }) {
  if (items.length === 0) return null;

  return (
    <section className="card space-y-3">
      <h2 className="font-semibold">Next up</h2>

      {items.map((item) => {
        if (item.kind === "live") {
          return (
            <div
              key={`live-${item.pot}`}
              className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900/50 dark:bg-red-950/20"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs font-semibold uppercase text-red-600 dark:text-red-400">
                  Live
                </span>
                <span className="text-xs text-slate-500">{item.roundLabel}</span>
                <span className="text-xs text-slate-400">· Pot {item.pot}</span>
              </div>
              <p className="text-sm font-medium">
                {item.homeFlag} {item.homeName}{" "}
                <span className="font-bold text-pitch-700 dark:text-pitch-400">
                  {item.homeGoals} – {item.awayGoals}
                </span>{" "}
                {item.awayName} {item.awayFlag}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Your team: {item.teamFlag} {item.teamName}
              </p>
            </div>
          );
        }

        if (item.kind === "upcoming") {
          const opp = item.opponentFlag
            ? `${item.opponentFlag} ${item.opponentName}`
            : item.opponentName;
          return (
            <div
              key={`upcoming-${item.pot}`}
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-600 dark:bg-slate-800/50"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {item.roundLabel}
                </span>
                <span className="text-xs text-slate-400">· Pot {item.pot}</span>
              </div>
              <p className="text-sm font-medium">
                {item.teamFlag} {item.teamName}{" "}
                <span className="text-slate-400">vs</span> {opp}
              </p>
              <p className="mt-1 text-xs text-slate-500">Not played yet</p>
            </div>
          );
        }

        return (
          <p
            key={`out-${item.pot}`}
            className="text-sm text-slate-400 line-through decoration-slate-400"
          >
            {item.teamFlag} {item.teamName}{" "}
            <span className="no-underline text-xs font-semibold uppercase tracking-wide text-slate-400">
              · Out
            </span>
            <span className="no-underline text-xs text-slate-400"> · Pot {item.pot}</span>
          </p>
        );
      })}
    </section>
  );
}
