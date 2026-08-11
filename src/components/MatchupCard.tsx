"use client";

import type { Matchup, SeededPlayer } from "@/lib/types";
import { TeamBadge } from "./TeamBadge";

function PlayerRow({
  player,
  isWinner,
  disabled,
  onClick,
  badge,
}: {
  player: SeededPlayer | null;
  isWinner: boolean;
  disabled: boolean;
  onClick: () => void;
  badge?: string;
}) {
  if (!player) {
    return (
      <div className="flex h-9 items-center gap-2 rounded border border-dashed border-zinc-700 px-2 text-xs text-zinc-500">
        <span className="w-5 text-center text-zinc-600">—</span>
        <span>TBD</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-9 w-full flex-col justify-center gap-1 rounded-md px-2 py-1.5 text-left text-xs transition ${
        isWinner
          ? "bg-amber-500/25 text-amber-100 ring-2 ring-amber-400"
          : "bg-zinc-800/80 text-zinc-50 hover:bg-zinc-700"
      } ${disabled ? "cursor-default opacity-80" : "cursor-pointer"}`}
      title={`${player.name} · ${player.heightLabel} · ${player.weightLb}lb · Seed ${player.seed}`}
    >
      <span className="flex items-center gap-2">
        <span className="w-5 shrink-0 text-center text-[10px] font-bold text-zinc-400">
          {player.seed}
        </span>
        <TeamBadge abbr={player.teamAbbr} size="sm" />
        <span className="flex-1 truncate font-semibold">{player.name}</span>
      </span>
      {badge && (
        <span className="ml-7 w-fit shrink-0 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold text-zinc-950">
          {badge}
        </span>
      )}
    </button>
  );
}

export function MatchupCard({
  matchup,
  onPickWinner,
  badge,
  badgeMode = "winner",
}: {
  matchup: Matchup;
  onPickWinner: (matchupId: string, playerId: string) => void;
  badge?: string;
  /** "always": both entrants already earned the badge (e.g. pod champs reaching the Semifinal).
   *  "winner": only the decided winner of this matchup earns the badge (e.g. the Champion). */
  badgeMode?: "always" | "winner";
}) {
  const canPick = Boolean(matchup.a && matchup.b);
  const showBadge = (player: SeededPlayer | null) =>
    badge && player && (badgeMode === "always" || matchup.winnerId === player.id)
      ? badge
      : undefined;

  return (
    <div className="my-1.5 rounded-lg border border-zinc-700 bg-zinc-950/70 p-1 space-y-1">
      <PlayerRow
        player={matchup.a}
        isWinner={matchup.winnerId === matchup.a?.id}
        disabled={!canPick}
        onClick={() => matchup.a && onPickWinner(matchup.id, matchup.a.id)}
        badge={showBadge(matchup.a)}
      />
      <PlayerRow
        player={matchup.b}
        isWinner={matchup.winnerId === matchup.b?.id}
        disabled={!canPick}
        onClick={() => matchup.b && onPickWinner(matchup.id, matchup.b.id)}
        badge={showBadge(matchup.b)}
      />
    </div>
  );
}
