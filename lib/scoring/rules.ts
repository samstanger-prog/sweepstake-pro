/**
 * Scoring rules — cumulative knockout milestones (each round played adds its points).
 * Goals (+1 each) apply in ALL stages (including third-place match).
 * Win/draw apply in group stage only. Third-place: goals only, no milestone bonus.
 */

/** +1 per goal in group stage, knockout, and third-place match */
export const GOAL_POINTS = 1;
export const GROUP_GOAL_POINTS = GOAL_POINTS;
export const KNOCKOUT_GOAL_POINTS = GOAL_POINTS;

/** Knockout rounds that award progression points (third-place excluded). */
export const KNOCKOUT_ROUNDS_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
] as const;

export type KnockoutRound = (typeof KNOCKOUT_ROUNDS_ORDER)[number];

/** Points awarded once per knockout round the team reaches (cumulative). */
export const KNOCKOUT_ROUND_POINTS: Record<KnockoutRound, number> = {
  "Round of 32": 5,
  "Round of 16": 10,
  "Quarter-final": 10,
  "Semi-final": 10,
  Final: 10,
};

export const WORLD_CUP_WINNER_BONUS = 15;

/** Group stage only */
export const GROUP_WIN_POINTS = 3;
export const GROUP_DRAW_POINTS = 1;
