import { WC2026_TEAMS } from "./wc2026-teams";

/** Team definitions mirrored in DB seed — used for fixture generation */
export const MOCK_TEAMS = WC2026_TEAMS.map((t) => ({
  name: t.name,
  code: t.code,
  flag_emoji: t.flag_emoji,
  pot: "B" as const,
  seed: t.fifa_rank,
  group_name: t.group_name,
  fifa_rank: t.fifa_rank,
}));
