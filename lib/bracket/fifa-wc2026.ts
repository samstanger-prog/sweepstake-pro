/**
 * FIFA WC 2026 knockout structure (Art. 12.6–12.11).
 * Group stage fixture order is unchanged; knockout fixture_id 73+ aligns with M73+.
 */

export const GROUP_STAGE_FIXTURE_COUNT = 72;
export const R32_FIXTURE_START = GROUP_STAGE_FIXTURE_COUNT + 1;

/** Keys for the eight "best third-placed" R32 slots (Art. 12.6). */
export const THIRD_PLACE_SLOT_KEYS = [
  "ABCDF",
  "CDFGH",
  "CEFHI",
  "EHIJK",
  "BEFIJ",
  "AEHIJ",
  "EFGIJ",
  "DEIJL",
] as const;

export type ThirdPlaceSlotKey = (typeof THIRD_PLACE_SLOT_KEYS)[number];
export type ThirdPlaceSlotMap = Partial<Record<ThirdPlaceSlotKey, string>>;

export type BracketSide = "home" | "away";

export interface R32SlotDef {
  fixtureId: number;
  home: string;
  away: string;
}

/** Art. 12.6 — Round of 32 slot template (fixture 73–88). */
export const R32_SLOT_TEMPLATE: R32SlotDef[] = [
  { fixtureId: 73, home: "2A", away: "2B" },
  { fixtureId: 74, home: "1E", away: "3rd:ABCDF" },
  { fixtureId: 75, home: "1F", away: "2C" },
  { fixtureId: 76, home: "1C", away: "2F" },
  { fixtureId: 77, home: "1I", away: "3rd:CDFGH" },
  { fixtureId: 78, home: "2E", away: "2I" },
  { fixtureId: 79, home: "1A", away: "3rd:CEFHI" },
  { fixtureId: 80, home: "1L", away: "3rd:EHIJK" },
  { fixtureId: 81, home: "1D", away: "3rd:BEFIJ" },
  { fixtureId: 82, home: "1G", away: "3rd:AEHIJ" },
  { fixtureId: 83, home: "2K", away: "2L" },
  { fixtureId: 84, home: "1H", away: "2J" },
  { fixtureId: 85, home: "1B", away: "3rd:EFGIJ" },
  { fixtureId: 86, home: "1J", away: "2H" },
  { fixtureId: 87, home: "1K", away: "3rd:DEIJL" },
  { fixtureId: 88, home: "2D", away: "2G" },
];

export interface KnockoutAdvancement {
  nextFixtureId: number;
  slot: BracketSide;
}

/** Art. 12.7–12.11 — explicit winner advancement (fixture_id → next match + home/away slot). */
export const KNOCKOUT_ADVANCEMENT: Record<number, KnockoutAdvancement> = {
  73: { nextFixtureId: 90, slot: "home" },
  74: { nextFixtureId: 89, slot: "home" },
  75: { nextFixtureId: 90, slot: "away" },
  76: { nextFixtureId: 91, slot: "home" },
  77: { nextFixtureId: 89, slot: "away" },
  78: { nextFixtureId: 91, slot: "away" },
  79: { nextFixtureId: 92, slot: "home" },
  80: { nextFixtureId: 92, slot: "away" },
  81: { nextFixtureId: 94, slot: "home" },
  82: { nextFixtureId: 94, slot: "away" },
  83: { nextFixtureId: 93, slot: "home" },
  84: { nextFixtureId: 93, slot: "away" },
  85: { nextFixtureId: 96, slot: "home" },
  86: { nextFixtureId: 95, slot: "home" },
  87: { nextFixtureId: 96, slot: "away" },
  88: { nextFixtureId: 95, slot: "away" },
  89: { nextFixtureId: 97, slot: "home" },
  90: { nextFixtureId: 97, slot: "away" },
  91: { nextFixtureId: 99, slot: "home" },
  92: { nextFixtureId: 99, slot: "away" },
  93: { nextFixtureId: 98, slot: "home" },
  94: { nextFixtureId: 98, slot: "away" },
  95: { nextFixtureId: 100, slot: "home" },
  96: { nextFixtureId: 100, slot: "away" },
  97: { nextFixtureId: 101, slot: "home" },
  98: { nextFixtureId: 101, slot: "away" },
  99: { nextFixtureId: 102, slot: "home" },
  100: { nextFixtureId: 102, slot: "away" },
  101: { nextFixtureId: 104, slot: "home" },
  102: { nextFixtureId: 104, slot: "away" },
};

export function getKnockoutAdvancement(
  fixtureId: number
): KnockoutAdvancement | undefined {
  return KNOCKOUT_ADVANCEMENT[fixtureId];
}

/** Resolve a bracket label (e.g. "2A", "1L", "3rd:EHIJK") to a team id. */
export function resolveBracketSlot(
  label: string,
  groupRanks: Map<string, Map<number, string>>,
  thirdPlaceSlots: ThirdPlaceSlotMap
): string | undefined {
  if (label.startsWith("3rd:")) {
    const key = label.slice(4) as ThirdPlaceSlotKey;
    return thirdPlaceSlots[key];
  }
  const rank = parseInt(label.charAt(0), 10);
  const group = label.charAt(1);
  return groupRanks.get(group)?.get(rank);
}

export function isThirdPlaceSlotMapComplete(
  map: ThirdPlaceSlotMap | null | undefined
): boolean {
  if (!map) return false;
  return THIRD_PLACE_SLOT_KEYS.every((k) => Boolean(map[k]));
}

export function buildDefaultThirdPlaceSlots(
  qualifyingThirdTeamIds: string[]
): ThirdPlaceSlotMap {
  const slots: ThirdPlaceSlotMap = {};
  THIRD_PLACE_SLOT_KEYS.forEach((key, i) => {
    if (qualifyingThirdTeamIds[i]) {
      slots[key] = qualifyingThirdTeamIds[i];
    }
  });
  return slots;
}
