import type { MockFixtureTemplate } from "@/lib/supabase/types";
import { WC2026_TEAMS } from "./wc2026-teams";

const GROUPS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

const GROUP_TEAMS: Record<string, string[]> = {};
for (const t of WC2026_TEAMS) {
  if (!GROUP_TEAMS[t.group_name]) GROUP_TEAMS[t.group_name] = [];
  GROUP_TEAMS[t.group_name].push(t.code);
}

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

/** Knockout: R32 (16) → R16 (8) → QF (4) → SF (2) → Third-place (1) + Final (1) */
function knockoutFixtures(startId: number): MockFixtureTemplate[] {
  const fixtures: MockFixtureTemplate[] = [];
  const r32Start = startId;
  const r16Start = r32Start + 16;
  const qfStart = r16Start + 8;
  const sfStart = qfStart + 4;
  const thirdStart = sfStart + 2;
  const finalStart = thirdStart + 1;
  let order = 1;

  for (let i = 0; i < 16; i++) {
    fixtures.push({
      fixture_id: r32Start + i,
      home_code: "TBD",
      away_code: "TBD",
      round: "Round of 32",
      knockout_order: order++,
      next_match_fixture_id: r16Start + Math.floor(i / 2),
    });
  }

  for (let i = 0; i < 8; i++) {
    fixtures.push({
      fixture_id: r16Start + i,
      home_code: "TBD",
      away_code: "TBD",
      round: "Round of 16",
      knockout_order: order++,
      next_match_fixture_id: qfStart + Math.floor(i / 2),
    });
  }

  for (let i = 0; i < 4; i++) {
    fixtures.push({
      fixture_id: qfStart + i,
      home_code: "TBD",
      away_code: "TBD",
      round: "Quarter-final",
      knockout_order: order++,
      next_match_fixture_id: sfStart + Math.floor(i / 2),
    });
  }

  for (let i = 0; i < 2; i++) {
    fixtures.push({
      fixture_id: sfStart + i,
      home_code: "TBD",
      away_code: "TBD",
      round: "Semi-final",
      knockout_order: order++,
      next_match_fixture_id: finalStart,
    });
  }

  fixtures.push({
    fixture_id: thirdStart,
    home_code: "TBD",
    away_code: "TBD",
    round: "Third-place",
    knockout_order: order++,
  });

  fixtures.push({
    fixture_id: finalStart,
    home_code: "TBD",
    away_code: "TBD",
    round: "Final",
    knockout_order: order++,
  });

  return fixtures;
}

const groupFixturesList = groupFixtures();
export const MOCK_FIXTURES: MockFixtureTemplate[] = [
  ...groupFixturesList,
  ...knockoutFixtures(groupFixturesList.length + 1),
];

export const MOCK_FIXTURE_COUNT = MOCK_FIXTURES.length;
export { GROUP_TEAMS, GROUPS };
