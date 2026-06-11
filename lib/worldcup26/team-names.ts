import type { Team } from "@/lib/supabase/types";

/** worldcup26.ir English names → our DB team names */
const API_NAME_TO_DB_NAME: Record<string, string> = {
  "Ivory Coast": "Côte d'Ivoire",
  "United States": "USA",
  "Democratic Republic of the Congo": "Congo DR",
  "Cape Verde": "Cabo Verde",
  "Czech Republic": "Czechia",
  Iran: "IR Iran",
  Turkey: "Türkiye",
  "South Korea": "Korea Republic",
  "Korea Republic": "Korea Republic",
};

export function normalizeApiTeamName(name: string | undefined | null): string | null {
  if (!name || name === "null" || name.trim() === "") return null;
  const trimmed = name.trim();
  return API_NAME_TO_DB_NAME[trimmed] ?? trimmed;
}

export function buildTeamLookup(teams: Team[]): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const t of teams) {
    if (t.code === "TBD") continue;
    lookup.set(t.name.toLowerCase(), t.id);
    lookup.set(t.code.toLowerCase(), t.id);
  }
  for (const [apiName, dbName] of Object.entries(API_NAME_TO_DB_NAME)) {
    const id = lookup.get(dbName.toLowerCase());
    if (id) lookup.set(apiName.toLowerCase(), id);
  }
  return lookup;
}

export function resolveTeamId(
  lookup: Map<string, string>,
  apiName: string | undefined | null
): string | undefined {
  const dbName = normalizeApiTeamName(apiName);
  if (!dbName) return undefined;
  return lookup.get(dbName.toLowerCase());
}
