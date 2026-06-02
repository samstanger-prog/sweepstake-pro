/** Generate a plausible football score */
export function generateScore(fast = false, seed?: number): {
  home: number;
  away: number;
} {
  if (fast) {
    return { home: 2, away: 1 };
  }

  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const draw = rand() < 0.25;
  const home = Math.floor(rand() * 5);
  const away = draw ? home : Math.floor(rand() * 5);
  return { home, away };
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
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
