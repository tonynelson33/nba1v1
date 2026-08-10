import type { Matchup, Player, Pod, Round, SeededPlayer } from "./types";

const POD_NAMES: Pod[] = ["Bigs", "Forwards", "Wings", "Guards"];

/** Height desc, weight as tiebreak, name as a final deterministic tiebreak. */
export function seedPlayers(players: Player[]): SeededPlayer[] {
  const sorted = [...players].sort((a, b) => {
    if (b.heightIn !== a.heightIn) return b.heightIn - a.heightIn;
    if (b.weightLb !== a.weightLb) return b.weightLb - a.weightLb;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((p, i) => ({
    ...p,
    seed: i + 1,
    pod: POD_NAMES[Math.floor(i / 8)],
  }));
}

export const ROUND_NAMES = [
  "Round of 32",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Finals",
] as const;

export const SEMIFINAL_ROUND_INDEX = 3;
export const FINAL_ROUND_INDEX = 4;

/**
 * Rebuilds the whole bracket from the 32 seeded players plus a matchup-id -> winner-id map.
 * Pairing is sequential every round (seed1 v seed2, seed3 v seed4, ...), which keeps each
 * 8-player pod (Bigs/Forwards/Wings/Guards) self-contained until the Semifinals, where the
 * four pod champions meet: Bigs champ vs Forwards champ on one side, Wings vs Guards on the
 * other, winners meeting in the Final for the Champion.
 */
export function deriveBracket(
  seeded: SeededPlayer[],
  winners: Record<string, string>
): Round[] {
  const rounds: Round[] = [];
  let current: (SeededPlayer | null)[] = seeded;

  ROUND_NAMES.forEach((name, roundIdx) => {
    const matchups: Matchup[] = [];
    const next: (SeededPlayer | null)[] = [];

    for (let i = 0; i < current.length; i += 2) {
      const a = current[i] ?? null;
      const b = current[i + 1] ?? null;
      const id = `r${roundIdx}-${i / 2}`;
      const winnerId = winners[id];
      const winner = winnerId && a?.id === winnerId ? a : winnerId && b?.id === winnerId ? b : null;

      matchups.push({ id, a, b, winnerId: winner ? winner.id : null });
      next.push(winner);
    }

    rounds.push({ name, matchups });
    current = next;
  });

  return rounds;
}

export function podChampions(rounds: Round[]): SeededPlayer[] {
  return rounds[SEMIFINAL_ROUND_INDEX].matchups
    .flatMap((m) => [m.a, m.b])
    .filter((p): p is SeededPlayer => p != null);
}

export function champion(rounds: Round[]): SeededPlayer | null {
  const finalMatch = rounds[FINAL_ROUND_INDEX].matchups[0];
  if (!finalMatch?.winnerId) return null;
  return finalMatch.a?.id === finalMatch.winnerId ? finalMatch.a : finalMatch.b;
}
