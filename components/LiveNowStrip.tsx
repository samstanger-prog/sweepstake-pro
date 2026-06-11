import type { LiveMatchRow } from "@/lib/leaderboard/live-data";

export function LiveNowStrip({ matches }: { matches: LiveMatchRow[] }) {
  if (matches.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Live now
        </h2>
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {matches.length} live
        </span>
      </div>
      {matches.map((m) => (
        <div
          key={m.id}
          className="card border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs font-semibold uppercase text-red-600 dark:text-red-400">
              Live
            </span>
            <span className="text-xs text-slate-500">{m.roundLabel}</span>
          </div>
          <p className="text-sm font-medium">
            {m.homeFlag} {m.homeName}{" "}
            <span className="font-bold text-pitch-700 dark:text-pitch-400">
              {m.homeGoals} – {m.awayGoals}
            </span>{" "}
            {m.awayName} {m.awayFlag}
          </p>
        </div>
      ))}
    </section>
  );
}
