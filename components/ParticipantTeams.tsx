import { TeamBadge } from "./TeamBadge";

export interface AssignedTeam {
  teamId: string;
  name: string;
  flag: string;
  pot: string;
  eliminated?: boolean;
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
          key={`${t.teamId}-${t.pot}`}
          name={t.name}
          flag={t.flag}
          pot={t.pot}
          eliminated={t.eliminated}
          compact={compact}
        />
      ))}
    </div>
  );
}
