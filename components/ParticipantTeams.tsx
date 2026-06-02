import { TeamBadge } from "./TeamBadge";

export interface AssignedTeam {
  name: string;
  flag: string;
  pot: string;
}

export function ParticipantTeams({
  teams,
  compact = false,
}: {
  teams: AssignedTeam[];
  compact?: boolean;
}) {
  if (teams.length === 0) {
    return (
      <span className="text-xs text-slate-400 italic">No teams assigned yet</span>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-1.5"}`}>
      {teams.map((t) => (
        <TeamBadge
          key={`${t.name}-${t.pot}`}
          name={t.name}
          flag={t.flag}
          pot={t.pot}
          className={compact ? "text-xs" : ""}
        />
      ))}
    </div>
  );
}
