"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  saveMatchResult,
  fillRoundOf32FromStandings,
  recalculateAllPoints,
} from "@/app/actions/matches";

export type AdminMatchRow = {
  id: string;
  fixtureId: number;
  round: string;
  groupName: string | null;
  status: string;
  homeGoals: number | null;
  awayGoals: number | null;
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  homeFlag: string;
  homeCode: string;
  awayName: string;
  awayFlag: string;
  awayCode: string;
};

type Props = {
  competitionId: string;
  matches: AdminMatchRow[];
  assignedTeamIds: string[];
  groupFinishedCount: number;
  groupTotal: number;
  r32Populated: boolean;
};

const ROUND_FILTERS = [
  "All",
  "Group Stage",
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Third-place",
  "Final",
] as const;

const STATUS_FILTERS = ["All", "Not played", "Finished"] as const;

function isKnockoutRound(round: string) {
  return round !== "Group Stage";
}

function matchSearchText(m: AdminMatchRow): string {
  return [
    m.homeName,
    m.awayName,
    m.homeCode,
    m.awayCode,
    m.groupName ? `group ${m.groupName}` : "",
    m.round,
    String(m.fixtureId),
  ]
    .join(" ")
    .toLowerCase();
}

function matchesSearchQuery(m: AdminMatchRow, query: string): boolean {
  if (!query) return true;
  return matchSearchText(m).includes(query);
}

export function AdminMatchEntry({
  competitionId,
  matches,
  assignedTeamIds,
  groupFinishedCount,
  groupTotal,
  r32Populated,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [roundFilter, setRoundFilter] =
    useState<(typeof ROUND_FILTERS)[number]>("All");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [playerTeamsOnly, setPlayerTeamsOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(matches[0]?.id ?? "");
  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");
  const [penWinnerId, setPenWinnerId] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const assignedTeamIdSet = useMemo(
    () => new Set(assignedTeamIds),
    [assignedTeamIds]
  );

  const searchNormalized = searchQuery.trim().toLowerCase();

  const filtersActive =
    roundFilter !== "All" ||
    statusFilter !== "All" ||
    searchNormalized.length > 0 ||
    playerTeamsOnly;

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (roundFilter !== "All" && m.round !== roundFilter) return false;
      if (statusFilter === "Not played" && m.status === "FT") return false;
      if (statusFilter === "Finished" && m.status !== "FT") return false;
      if (!matchesSearchQuery(m, searchNormalized)) return false;
      if (
        playerTeamsOnly &&
        !assignedTeamIdSet.has(m.homeTeamId) &&
        !assignedTeamIdSet.has(m.awayTeamId)
      ) {
        return false;
      }
      return true;
    });
  }, [
    matches,
    roundFilter,
    statusFilter,
    searchNormalized,
    playerTeamsOnly,
    assignedTeamIdSet,
  ]);

  const selected =
    filtered.find((m) => m.id === selectedId) ??
    filtered[0] ??
    matches.find((m) => m.id === selectedId);

  useEffect(() => {
    if (filtered.length === 0) return;
    if (!filtered.some((m) => m.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    const m = matches.find((x) => x.id === selectedId);
    if (!m) return;
    setHomeGoals(m.homeGoals != null ? String(m.homeGoals) : "");
    setAwayGoals(m.awayGoals != null ? String(m.awayGoals) : "");
    setPenWinnerId("");
  }, [matches, selectedId]);

  function hasAssignedTeam(m: AdminMatchRow) {
    return (
      assignedTeamIdSet.has(m.homeTeamId) ||
      assignedTeamIdSet.has(m.awayTeamId)
    );
  }

  const groupComplete = groupFinishedCount >= groupTotal;
  const knockoutSelected = selected ? isKnockoutRound(selected.round) : false;
  const hasTbdTeam =
    selected?.homeCode === "TBD" || selected?.awayCode === "TBD";
  const goalsParsed =
    homeGoals.trim() !== "" && awayGoals.trim() !== ""
      ? { home: parseInt(homeGoals, 10), away: parseInt(awayGoals, 10) }
      : null;
  const isDraw =
    goalsParsed !== null &&
    !Number.isNaN(goalsParsed.home) &&
    !Number.isNaN(goalsParsed.away) &&
    goalsParsed.home === goalsParsed.away;
  const needsPenWinner = knockoutSelected && isDraw;

  function loadMatchIntoForm(m: AdminMatchRow) {
    setSelectedId(m.id);
    setHomeGoals(m.homeGoals != null ? String(m.homeGoals) : "");
    setAwayGoals(m.awayGoals != null ? String(m.awayGoals) : "");
    setPenWinnerId("");
    setMessage(null);
  }

  async function handleSave() {
    if (!selected) return;
    if (hasTbdTeam) {
      setMessage({
        text: "Both teams must be assigned before saving a knockout match.",
        type: "error",
      });
      return;
    }
    if (!goalsParsed || Number.isNaN(goalsParsed.home) || Number.isNaN(goalsParsed.away)) {
      setMessage({ text: "Enter valid goal counts.", type: "error" });
      return;
    }
    if (goalsParsed.home < 0 || goalsParsed.away < 0) {
      setMessage({ text: "Goals cannot be negative.", type: "error" });
      return;
    }
    if (needsPenWinner && !penWinnerId) {
      setMessage({
        text: "Knockout draw — select the winner (e.g. after penalties).",
        type: "error",
      });
      return;
    }

    const label =
      selected.status === "FT" ? "Update this match result?" : "Save this match result?";
    if (!window.confirm(label)) return;

    setMessage(null);
    setPending(true);
    try {
      const result = await saveMatchResult(
        competitionId,
        selected.id,
        goalsParsed.home,
        goalsParsed.away,
        needsPenWinner ? penWinnerId : undefined
      );
      if (result.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        const type = result.warning ? "warning" : "success";
        setMessage({
          text: result.warning ?? "Match saved.",
          type,
        });
        router.refresh();
      }
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Something went wrong",
        type: "error",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleFillR32() {
    if (!groupComplete) return;

    let msg = "Set Round of 32 teams from group standings?";
    if (r32Populated) {
      msg =
        "Replace existing Round of 32 teams from current standings?";
    }
    if (!window.confirm(msg)) return;

    setMessage(null);
    setPending(true);
    try {
      const result = await fillRoundOf32FromStandings(
        competitionId,
        r32Populated
      );
      if (result.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        setMessage({ text: "Round of 32 filled from standings.", type: "success" });
        router.refresh();
      }
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Something went wrong",
        type: "error",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleRecalculate() {
    setMessage(null);
    setPending(true);
    try {
      const result = await recalculateAllPoints(competitionId);
      if (result.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        setMessage({ text: "Points recalculated.", type: "success" });
        router.refresh();
      }
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "Something went wrong",
        type: "error",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Manual score entry
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-400">Round</span>
          <select
            value={roundFilter}
            onChange={(e) =>
              setRoundFilter(e.target.value as (typeof ROUND_FILTERS)[number])
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            {ROUND_FILTERS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-400">Status</span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])
            }
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-slate-600 dark:text-slate-400">
          Search
        </span>
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team, code, group, round, fixture #…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {filtersActive && (
          <p className="mt-1 text-xs text-slate-500">
            {filtered.length === 0
              ? "No matches match filters"
              : `${filtered.length} match${filtered.length === 1 ? "" : "es"}`}
          </p>
        )}
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={playerTeamsOnly}
          onChange={(e) => setPlayerTeamsOnly(e.target.checked)}
          className="mt-0.5 rounded border-slate-300"
        />
        <span>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            Only matches with assigned player teams
          </span>
          {playerTeamsOnly && (
            <span className="mt-0.5 block text-xs text-slate-500">
              Showing fixtures involving at least one sweepstake team.
            </span>
          )}
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-slate-600 dark:text-slate-400">Match</span>
        <select
          value={selected?.id ?? ""}
          onChange={(e) => {
            const m = matches.find((x) => x.id === e.target.value);
            if (m) loadMatchIntoForm(m);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          {filtered.length === 0 ? (
            <option value="">No matches match filters</option>
          ) : (
            filtered.map((m) => (
              <option key={m.id} value={m.id}>
                {hasAssignedTeam(m) ? "★ " : ""}#{m.fixtureId}{" "}
                {m.groupName ? `Group ${m.groupName}` : m.round} — {m.homeFlag}{" "}
                {m.homeName} vs {m.awayFlag} {m.awayName}
                {m.status === "FT"
                  ? ` (${m.homeGoals}–${m.awayGoals})`
                  : " (NS)"}
              </option>
            ))
          )}
        </select>
      </label>

      {selected && (
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <p className="mb-3 text-center text-sm font-medium">
            {selected.homeFlag} {selected.homeName}{" "}
            <span className="text-slate-400">vs</span> {selected.awayFlag}{" "}
            {selected.awayName}
          </p>
          {hasTbdTeam && knockoutSelected && (
            <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">
              One or both teams are TBD — run Fill R32 before entering this
              score.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600 dark:text-slate-400">
                {selected.homeName} goals
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={homeGoals}
                onChange={(e) => setHomeGoals(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600 dark:text-slate-400">
                {selected.awayName} goals
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={awayGoals}
                onChange={(e) => setAwayGoals(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
          </div>
          {needsPenWinner && (
            <label className="mt-3 block text-sm">
              <span className="mb-1 block text-slate-600 dark:text-slate-400">
                Winner (after pens)
              </span>
              <select
                value={penWinnerId}
                onChange={(e) => setPenWinnerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              >
                <option value="">Select winner…</option>
                <option value={selected.homeTeamId}>
                  {selected.homeFlag} {selected.homeName}
                </option>
                <option value={selected.awayTeamId}>
                  {selected.awayFlag} {selected.awayName}
                </option>
              </select>
            </label>
          )}
          <button
            type="button"
            disabled={pending || (knockoutSelected && hasTbdTeam)}
            onClick={handleSave}
            className="mt-4 w-full rounded-lg bg-pitch-600 px-4 py-3 text-sm font-medium text-white hover:bg-pitch-700 disabled:opacity-50"
          >
            {pending ? "Saving…" : selected.status === "FT" ? "Update score" : "Save score"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          disabled={pending || !groupComplete}
          onClick={() => handleFillR32()}
          className="w-full rounded-lg border border-pitch-600 bg-white px-4 py-3 text-sm font-medium text-pitch-700 hover:bg-pitch-50 disabled:opacity-50 dark:bg-slate-800 dark:text-pitch-300 dark:hover:bg-slate-700"
        >
          {pending ? "Working…" : "Fill R32 from standings"}
        </button>
        {!groupComplete && (
          <p className="text-xs text-slate-500">
            Group stage: {groupFinishedCount}/{groupTotal} finished — complete
            all group matches first.
          </p>
        )}
        {groupComplete && r32Populated && (
          <p className="text-xs text-slate-500">
            R32 already has teams. Running again replaces them from current
            standings.
          </p>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={handleRecalculate}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {pending ? "Working…" : "Recalculate all points"}
        </button>
      </div>

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : message.type === "warning"
                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                : "bg-pitch-50 text-pitch-800 dark:bg-pitch-950/40 dark:text-pitch-200"
          }`}
          role="alert"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
