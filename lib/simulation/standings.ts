import type { Match, Standing } from "@/lib/supabase/types";

export function rebuildStandingsFromMatches(
  matches: Match[],
  teamIdsByGroup: Map<string, string[]>
): Omit<Standing, "id" | "competition_id">[] {
  const stats = new Map<
    string,
    {
      group_name: string;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      gf: number;
      ga: number;
    }
  >();

  for (const [, teamIds] of teamIdsByGroup) {
    for (const teamId of teamIds) {
      const group = [...teamIdsByGroup.entries()].find(([, ids]) =>
        ids.includes(teamId)
      )?.[0];
      if (!group) continue;
      stats.set(teamId, {
        group_name: group,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
      });
    }
  }

  const groupMatches = matches.filter(
    (m) => m.round === "Group Stage" && m.status === "FT"
  );

  for (const m of groupMatches) {
    if (m.home_goals === null || m.away_goals === null) continue;
    const home = stats.get(m.home_team_id);
    const away = stats.get(m.away_team_id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.gf += m.home_goals;
    home.ga += m.away_goals;
    away.gf += m.away_goals;
    away.ga += m.home_goals;

    if (m.home_goals > m.away_goals) {
      home.won++;
      away.lost++;
    } else if (m.home_goals < m.away_goals) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }

  return [...stats.entries()].map(([team_id, s]) => ({
    team_id,
    group_name: s.group_name,
    played: s.played,
    won: s.won,
    drawn: s.drawn,
    lost: s.lost,
    gf: s.gf,
    ga: s.ga,
    gd: s.gf - s.ga,
    pts: s.won * 3 + s.drawn,
  }));
}

export function getTopTeamsFromGroups(
  standings: Omit<Standing, "id" | "competition_id">[],
  perGroup = 2
): string[] {
  const byGroup = new Map<string, typeof standings>();
  for (const s of standings) {
    const list = byGroup.get(s.group_name) ?? [];
    list.push(s);
    byGroup.set(s.group_name, list);
  }

  const qualified: string[] = [];
  const thirdPlaces: (typeof standings)[0][] = [];

  for (const [, list] of byGroup) {
    const sorted = [...list].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
    for (let i = 0; i < perGroup && i < sorted.length; i++) {
      qualified.push(sorted[i].team_id);
    }
    if (sorted[2]) thirdPlaces.push(sorted[2]);
  }

  const sortedThird = thirdPlaces.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  while (qualified.length < 16 && sortedThird.length > 0) {
    const t = sortedThird.shift();
    if (t && !qualified.includes(t.team_id)) qualified.push(t.team_id);
  }

  return qualified.slice(0, 16);
}
