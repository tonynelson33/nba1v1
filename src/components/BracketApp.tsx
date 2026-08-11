"use client";

import { useMemo, useRef, useState } from "react";
import type { Player, PlayerTuple, Team } from "@/lib/types";
import { deriveBracket, seedPlayers } from "@/lib/seeding";
import { hydratePlayers } from "@/lib/players";
import { RosterPicker } from "./RosterPicker";
import { Bracket } from "./Bracket";
import { RulesSection } from "./RulesSection";
import { ShareImageButton } from "./ShareImageButton";
import { CollapsibleSection } from "./CollapsibleSection";

const WILDCARD_SLOTS = [
  { slotId: "WC1", label: "Wild Card" },
  { slotId: "WC2", label: "Wild Card" },
];

export function BracketApp({
  teams,
  allPlayersRaw,
  defaultWildcards,
}: {
  teams: Team[];
  allPlayersRaw: PlayerTuple[];
  defaultWildcards: string[];
}) {
  const allPlayers = useMemo(() => hydratePlayers(allPlayersRaw), [allPlayersRaw]);

  const playersById = useMemo(() => {
    const m = new Map<string, Player>();
    for (const p of allPlayers) m.set(p.id, p);
    return m;
  }, [allPlayers]);

  const defaultSelections = useMemo(() => {
    const s: Record<string, string | null> = {};
    for (const t of teams) s[t.abbr] = t.defaultPickId;
    s.WC1 = defaultWildcards[0] ?? null;
    s.WC2 = defaultWildcards[1] ?? null;
    return s;
  }, [teams, defaultWildcards]);

  const [selections, setSelections] = useState(defaultSelections);
  const [winners, setWinners] = useState<Record<string, string>>({});
  const bracketRef = useRef<HTMLDivElement>(null);

  const usedIds = useMemo(
    () => new Set(Object.values(selections).filter((v): v is string => Boolean(v))),
    [selections]
  );

  const selectedPlayers = useMemo(
    () =>
      Object.values(selections)
        .filter((id): id is string => Boolean(id))
        .map((id) => playersById.get(id))
        .filter((p): p is Player => Boolean(p)),
    [selections, playersById]
  );

  const seeded = useMemo(() => seedPlayers(selectedPlayers), [selectedPlayers]);
  const rounds = useMemo(() => deriveBracket(seeded, winners), [seeded, winners]);

  function handlePick(slotId: string, playerId: string) {
    setSelections((prev) => ({ ...prev, [slotId]: playerId }));
  }

  function handlePickWinner(matchupId: string, playerId: string) {
    setWinners((prev) => ({ ...prev, [matchupId]: playerId }));
  }

  function handleReset() {
    setSelections(defaultSelections);
    setWinners({});
  }

  const filledCount = selectedPlayers.length;
  const bracketReady = filledCount === 32;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
      <header className="mb-5 text-center">
        <div className="text-2xl font-black uppercase tracking-[0.2em] text-amber-500 sm:text-3xl">
          NBA 1v1 Tournament
        </div>
        <h1
          className="mt-2 flex items-center justify-center gap-3 text-5xl tracking-wide text-zinc-50 sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span>King of the Court</span>
          <span className="text-[0.9em] leading-none">👑</span>
        </h1>
        <p className="mt-3 text-lg font-bold text-amber-200 sm:text-2xl">
          Build your bracket. Crown the King.
        </p>
      </header>

      <section className="mb-8">
        <div className="mb-3 flex justify-end">
          <ShareImageButton targetRef={bracketRef} />
        </div>

        {bracketReady ? (
          <div ref={bracketRef}>
            <Bracket rounds={rounds} onPickWinner={handlePickWinner} />
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
            Fill all 32 roster slots below to unlock the bracket.
          </div>
        )}
      </section>

      <div className="mb-4">
        <CollapsibleSection
          title="Customize Your Roster"
          defaultOpen={false}
          right={
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">{filledCount}/32 selected</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-zinc-500 underline decoration-dotted hover:text-amber-400"
              >
                Reset to defaults
              </button>
            </div>
          }
        >
          <RosterPicker
            teams={teams}
            wildcardSlots={WILDCARD_SLOTS}
            selections={selections}
            playersById={playersById}
            allPlayers={allPlayers}
            usedIds={usedIds}
            onPick={handlePick}
          />
        </CollapsibleSection>
      </div>

      <RulesSection />

      <footer className="mt-10 text-center text-xs text-zinc-600">
        A concept for a real 1-on-1 tournament. Team colors shown for reference; not affiliated
        with or endorsed by the NBA.
      </footer>
    </div>
  );
}
