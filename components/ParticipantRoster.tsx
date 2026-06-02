import Link from "next/link";
import { ParticipantTeams, type AssignedTeam } from "./ParticipantTeams";

export interface RosterEntry {
  id: string;
  name: string;
  profileHref: string;
  totalPoints: number;
  teams: AssignedTeam[];
}

export function ParticipantRoster({ entries }: { entries: RosterEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">No participants yet. Share the invite code.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <li key={e.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-600">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={e.profileHref}
              className="font-medium text-pitch-700 hover:underline dark:text-pitch-400"
            >
              {e.name}
            </Link>
            {e.totalPoints > 0 && (
              <span className="shrink-0 text-sm font-bold text-pitch-600">
                {e.totalPoints} pts
              </span>
            )}
          </div>
          <ParticipantTeams teams={e.teams} />
        </li>
      ))}
    </ul>
  );
}
