import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_FIXTURES } from "@/lib/mock/fixtures";
import { GROUPS, GROUP_TEAMS } from "@/lib/mock/fixtures";
import type { DataProvider } from "./provider";

export class MockDataProvider implements DataProvider {
  async seedCompetition(competitionId: string): Promise<void> {
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("matches")
      .select("id")
      .eq("competition_id", competitionId)
      .limit(1);

    if (existing && existing.length > 0) return;

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, code")
      .neq("code", "TBD");

    if (teamsError || !teams) throw new Error(teamsError?.message ?? "Teams not found");

    const { data: tbdTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("code", "TBD")
      .single();

    if (!tbdTeam) throw new Error("TBD team missing — run migration");

    const codeToId = new Map(teams.map((t) => [t.code, t.id]));
    const tbdId = tbdTeam.id;

    const matchRows = MOCK_FIXTURES.map((f) => {
      const homeId =
        f.home_code === "TBD" ? tbdId : codeToId.get(f.home_code);
      const awayId =
        f.away_code === "TBD" ? tbdId : codeToId.get(f.away_code);
      if (!homeId || !awayId) {
        throw new Error(`Unknown team code: ${f.home_code} vs ${f.away_code}`);
      }
      return {
        competition_id: competitionId,
        fixture_id: f.fixture_id,
        home_team_id: homeId,
        away_team_id: awayId,
        home_goals: null,
        away_goals: null,
        status: "NS" as const,
        round: f.round,
        group_name: f.group_name ?? null,
        knockout_order: f.knockout_order ?? null,
        winner_team_id: null,
        next_match_fixture_id: f.next_match_fixture_id ?? null,
      };
    });

    const { error: matchError } = await supabase.from("matches").insert(matchRows);
    if (matchError) throw new Error(matchError.message);

    const standingRows: {
      competition_id: string;
      team_id: string;
      group_name: string;
    }[] = [];

    for (const group of GROUPS) {
      for (const code of GROUP_TEAMS[group]) {
        const teamId = codeToId.get(code);
        if (!teamId) continue;
        standingRows.push({
          competition_id: competitionId,
          team_id: teamId,
          group_name: group,
        });
      }
    }

    const { error: standError } = await supabase.from("standings").insert(
      standingRows.map((r) => ({
        ...r,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      }))
    );
    if (standError) throw new Error(standError.message);

    await supabase
      .from("competitions")
      .update({ status: "active" })
      .eq("id", competitionId)
      .in("status", ["drawn", "open"]);
  }
}

import { isMockDataEnabled } from "@/lib/config";
import { ApiFootballProvider } from "./api-football-provider";

export function getDataProvider(): DataProvider {
  if (isMockDataEnabled()) return new MockDataProvider();
  return new ApiFootballProvider();
}
