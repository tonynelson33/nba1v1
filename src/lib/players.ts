import type { Player, PlayerTuple } from "./types";

export function heightLabelFor(heightIn: number): string {
  if (!heightIn) return "";
  return `${Math.floor(heightIn / 12)}-${heightIn % 12}`;
}

export function hydratePlayers(tuples: PlayerTuple[]): Player[] {
  return tuples.map(([id, name, teamAbbr, position, heightIn, weightLb, overall]) => ({
    id,
    name,
    teamAbbr,
    position,
    heightIn,
    heightLabel: heightLabelFor(heightIn),
    weightLb,
    overall,
  }));
}
