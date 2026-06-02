import type { MockFixtureTemplate } from "@/lib/supabase/types";

const GROUPS = ["A", "B", "C", "D", "E", "F"] as const;

/** Teams per group (codes) — matches DB seed */
const GROUP_TEAMS: Record<string, string[]> = {
  A: ["BRA", "ARG", "MAR", "SRB"],
  B: ["FRA", "ENG", "JPN", "POL"],
  C: ["ESP", "GER", "USA", "AUS"],
  D: ["POR", "NED", "MEX", "ECU"],
  E: ["BEL", "CRO", "SUI", "SEN"],
  F: ["ITA", "URU", "DEN", "WAL"],
};

function groupFixtures(): MockFixtureTemplate[] {
  const fixtures: MockFixtureTemplate[] = [];
  let fixtureId = 1;

  for (const group of GROUPS) {
    const teams = GROUP_TEAMS[group];
    const pairs: [string, string][] = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        pairs.push([teams[i], teams[j]]);
      }
    }
    for (const [home, away] of pairs) {
      fixtures.push({
        fixture_id: fixtureId++,
        home_code: home,
        away_code: away,
        round: "Group Stage",
        group_name: group,
      });
    }
  }
  return fixtures;
}

/** Knockout bracket: R16 (37-44), QF (45-48), SF (49-50), Final (51) */
function knockoutFixtures(startId: number): MockFixtureTemplate[] {
  const r16: MockFixtureTemplate[] = [
    { fixture_id: startId, home_code: "TBD", away_code: "TBD", round: "Round of 16", knockout_order: 1, next_match_fixture_id: startId + 8 },
    { fixture_id: startId + 1, home_code: "TBD", away_code: "TBD", round: "Round of 16", knockout_order: 2, next_match_fixture_id: startId + 8 },
    { fixture_id: startId + 2, home_code: "TBD", away_code: "TBD", round: "Round of 16", knockout_order: 3, next_match_fixture_id: startId + 9 },
    { fixture_id: startId + 3, home_code: "TBD", away_code: "TBD", round: "Round of 16", knockout_order: 4, next_match_fixture_id: startId + 9 },
    { fixture_id: startId + 4, home_code: "TBD", away_code: "TBD", round: "Round of 16", knockout_order: 5, next_match_fixture_id: startId + 10 },
    { fixture_id: startId + 5, home_code: "TBD", away_code: "TBD", round: "Round of 16", knockout_order: 6, next_match_fixture_id: startId + 10 },
    { fixture_id: startId + 6, home_code: "TBD", away_code: "TBD", round: "Round of 16", knockout_order: 7, next_match_fixture_id: startId + 11 },
    { fixture_id: startId + 7, home_code: "TBD", away_code: "TBD", round: "Round of 16", knockout_order: 8, next_match_fixture_id: startId + 11 },
  ];

  const qfStart = startId + 8;
  const qf: MockFixtureTemplate[] = [
    { fixture_id: qfStart, home_code: "TBD", away_code: "TBD", round: "Quarter-final", knockout_order: 9, next_match_fixture_id: qfStart + 4 },
    { fixture_id: qfStart + 1, home_code: "TBD", away_code: "TBD", round: "Quarter-final", knockout_order: 10, next_match_fixture_id: qfStart + 4 },
    { fixture_id: qfStart + 2, home_code: "TBD", away_code: "TBD", round: "Quarter-final", knockout_order: 11, next_match_fixture_id: qfStart + 5 },
    { fixture_id: qfStart + 3, home_code: "TBD", away_code: "TBD", round: "Quarter-final", knockout_order: 12, next_match_fixture_id: qfStart + 5 },
  ];

  const sfStart = qfStart + 4;
  const sf: MockFixtureTemplate[] = [
    { fixture_id: sfStart, home_code: "TBD", away_code: "TBD", round: "Semi-final", knockout_order: 13, next_match_fixture_id: sfStart + 2 },
    { fixture_id: sfStart + 1, home_code: "TBD", away_code: "TBD", round: "Semi-final", knockout_order: 14, next_match_fixture_id: sfStart + 2 },
  ];

  const finalStart = sfStart + 2;
  const finalF: MockFixtureTemplate[] = [
    { fixture_id: finalStart, home_code: "TBD", away_code: "TBD", round: "Final", knockout_order: 15 },
  ];

  return [...r16, ...qf, ...sf, ...finalF];
}

const groupFixturesList = groupFixtures();
export const MOCK_FIXTURES: MockFixtureTemplate[] = [
  ...groupFixturesList,
  ...knockoutFixtures(groupFixturesList.length + 1),
];

export { GROUP_TEAMS, GROUPS };
