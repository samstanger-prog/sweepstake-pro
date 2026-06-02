/**
 * Scoring rules — cumulative knockout milestones (each round played adds its points).
 * Goals (+1 each) apply in ALL stages. Win/draw apply in group stage only.
 * 24-team mock starts at Round of 16 (no R32 fixtures until 48-team expansion).
 */

/** +1 per goal in group stage and knockout */
export const GOAL_POINTS = 1;
export const GROUP_GOAL_POINTS = GOAL_POINTS;
export const KNOCKOUT_GOAL_POINTS = GOAL_POINTS;

/** Knockout rounds in bracket order (48-team World Cup includes Round of 32). */
export const KNOCKOUT_ROUNDS_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
] as const;

export type KnockoutRound = (typeof KNOCKOUT_ROUNDS_ORDER)[number];

/** Points awarded once per round the team completes a knockout fixture in (cumulative). */
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
