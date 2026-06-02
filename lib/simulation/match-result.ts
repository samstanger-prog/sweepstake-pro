/** Generate a plausible football score */
export function generateScore(fast = false): {
  home: number;
  away: number;
} {
  if (fast) {
    return { home: 2, away: 1 };
  }

  const draw = Math.random() < 0.1;
  const home = Math.floor(Math.random() * 5);
  let away = draw ? home : Math.floor(Math.random() * 5);

  if (!draw && away === home) {
    away = home < 4 ? home + 1 : home - 1;
  }

  return { home, away };
}

export function getWinner(
  homeGoals: number,
  awayGoals: number,
  homeTeamId: string,
  awayTeamId: string
): string {
  if (homeGoals > awayGoals) return homeTeamId;
  if (awayGoals > homeGoals) return awayTeamId;
  return homeGoals >= awayGoals ? homeTeamId : awayTeamId;
}
