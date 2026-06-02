import type { AssignedTeam } from "@/components/ParticipantTeams";

type UserTeamRow = {
  pot: string;
  teams:
    | { name: string; flag_emoji: string; pot: string }
    | { name: string; flag_emoji: string; pot: string }[]
    | null;
};

export function parseAssignedTeams(userTeams: UserTeamRow[] | null | undefined): AssignedTeam[] {
  if (!userTeams?.length) return [];

  return userTeams
    .map((ut) => {
      const team = Array.isArray(ut.teams) ? ut.teams[0] : ut.teams;
      if (!team) return null;
      return {
        name: team.name,
        flag: team.flag_emoji,
        pot: ut.pot,
      };
    })
    .filter((t): t is AssignedTeam => t !== null)
    .sort((a, b) => a.pot.localeCompare(b.pot));
}
