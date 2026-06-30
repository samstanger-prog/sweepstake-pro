import type { Worldcup26Game, Worldcup26GamesResponse } from "./types";

const GAMES_URL = "https://worldcup26.ir/get/games";
const FETCH_TIMEOUT_MS = 15_000;

export async function fetchWorldcup26Games(): Promise<Worldcup26Game[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(GAMES_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`worldcup26.ir returned ${res.status}`);
    }

    const data = (await res.json()) as Worldcup26GamesResponse;
    if (!Array.isArray(data.games)) {
      throw new Error("Unexpected worldcup26.ir response shape");
    }
    return data.games;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("worldcup26.ir request timed out");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseGameScores(game: Worldcup26Game): {
  home: number;
  away: number;
} {
  const home = parseInt(game.home_score, 10);
  const away = parseInt(game.away_score, 10);
  return {
    home: Number.isFinite(home) ? home : 0,
    away: Number.isFinite(away) ? away : 0,
  };
}

function parsePenaltyField(value: string | undefined): number | null {
  if (!value || value === "null") return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

/** Penalty shootout scores when provided by the API (null if not decided on pens yet). */
export function parsePenaltyScores(game: Worldcup26Game): {
  home: number;
  away: number;
} | null {
  const home = parsePenaltyField(game.home_penalty_score);
  const away = parsePenaltyField(game.away_penalty_score);
  if (home === null || away === null) return null;
  return { home, away };
}

export function isGameFinished(game: Worldcup26Game): boolean {
  return game.finished?.toUpperCase() === "TRUE";
}

export function isGameLive(game: Worldcup26Game): boolean {
  return game.time_elapsed?.toLowerCase() === "live";
}
