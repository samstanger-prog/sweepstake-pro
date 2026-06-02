import type { ScoreDetailItem, TeamScoreDetail } from "@/lib/supabase/types";
import { TeamBadge } from "./TeamBadge";

function normalizeItems(team: TeamScoreDetail): ScoreDetailItem[] {
  if (team.items?.length) return team.items;
  if (team.details?.length) {
    return team.details.map((d) => ({ description: d, points: 0 }));
  }
  return [];
}

export function PointsBreakdown({ teams }: { teams: TeamScoreDetail[] }) {
  return (
    <div className="space-y-4">
      {teams.map((t) => {
        const items = normalizeItems(t);
        return (
          <div
            key={t.teamId}
            className="border-t border-slate-200 pt-3 dark:border-slate-600"
          >
            <TeamBadge name={t.teamName} flag={t.flagEmoji} pot={t.pot} />
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t.total} pts total (match {t.matchPoints}, progression{" "}
              {t.progressionPoints}, bonus {t.bonusPoints})
            </p>
            {items.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <span className="text-slate-600 dark:text-slate-300">
                      {item.description}
                    </span>
                    {item.points > 0 && (
                      <span className="shrink-0 font-semibold text-pitch-600 dark:text-pitch-500">
                        +{item.points}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-slate-400">No scored events yet</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
