import allPlayersRaw from "@/data/allPlayers.json";
import type { PlayerTuple } from "./types";

const ratings = (allPlayersRaw as PlayerTuple[])
  .map(([, , , , , , overall]) => overall)
  .filter((o): o is number => o != null);

/** Min/max 2K overall across all rated players in the current data — drives the rating badge
 *  color scale. Computed once from the shipped data so it stays correct after future refreshes
 *  without needing to hardcode today's 67-98 range. */
export const RATING_RANGE = { min: Math.min(...ratings), max: Math.max(...ratings) };

// Tailwind's -500 shades — bright enough to keep the badge's dark (zinc-950) number legible
// across the whole scale, including at the red end.
type Rgb = { r: number; g: number; b: number };
const RED: Rgb = { r: 239, g: 68, b: 68 }; // red-500
const YELLOW: Rgb = { r: 234, g: 179, b: 8 }; // yellow-500
const GREEN: Rgb = { r: 34, g: 197, b: 94 }; // green-500

function mix(from: Rgb, to: Rgb, t: number): string {
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Red (worst) -> yellow (middle) -> green (best), scaled to the current data's rating range. */
export function ratingColorFor(overall: number): string {
  const { min, max } = RATING_RANGE;
  const t = max === min ? 0.5 : Math.min(1, Math.max(0, (overall - min) / (max - min)));
  return t < 0.5 ? mix(RED, YELLOW, t / 0.5) : mix(YELLOW, GREEN, (t - 0.5) / 0.5);
}
