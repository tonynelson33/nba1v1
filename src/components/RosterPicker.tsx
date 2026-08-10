"use client";

import type { Player, Team } from "@/lib/types";
import { PlayerSearchSelect } from "./PlayerSearchSelect";
import { TeamBadge } from "./TeamBadge";

type WildcardSlot = { slotId: string; label: string };

export function RosterPicker({
  teams,
  wildcardSlots,
  selections,
  playersById,
  allPlayers,
  usedIds,
  onPick,
}: {
  teams: Team[];
  wildcardSlots: WildcardSlot[];
  selections: Record<string, string | null>;
  playersById: Map<string, Player>;
  allPlayers: Player[];
  usedIds: Set<string>;
  onPick: (slotId: string, playerId: string) => void;
}) {
  return (
    <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 2xl:columns-6">
      {teams.map((team) => {
        const currentId = selections[team.abbr] ?? null;
        const current = currentId ? playersById.get(currentId) ?? null : null;
        const options = team.rosterIds
          .map((id) => playersById.get(id))
          .filter((p): p is Player => Boolean(p))
          .filter((p) => p.id === currentId || !usedIds.has(p.id));

        return (
          <div
            key={team.abbr}
            className="mb-1.5 flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/40 p-1 break-inside-avoid"
          >
            <TeamBadge abbr={team.abbr} size="sm" />
            <div className="min-w-0 flex-1">
              <PlayerSearchSelect
                options={options}
                value={current}
                onChange={(playerId) => onPick(team.abbr, playerId)}
                placeholder={team.teamName}
              />
            </div>
          </div>
        );
      })}

      {wildcardSlots.map((slot) => {
        const currentId = selections[slot.slotId] ?? null;
        const current = currentId ? playersById.get(currentId) ?? null : null;
        const options = allPlayers.filter((p) => p.id === currentId || !usedIds.has(p.id));

        return (
          <div
            key={slot.slotId}
            className="mb-1.5 flex items-center gap-1.5 rounded-md border border-amber-700/40 bg-amber-500/5 p-1 break-inside-avoid"
          >
            <TeamBadge abbr={null} size="sm" />
            <div className="min-w-0 flex-1">
              <PlayerSearchSelect
                options={options}
                value={current}
                onChange={(playerId) => onPick(slot.slotId, playerId)}
                placeholder="Any player in the league"
                showTeamBadge
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
