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
import { CourtBackdrop } from "./CourtBackdrop";

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
    <div className="py-8">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
        <header className="relative mb-5 text-center">
          <CourtBackdrop />
          <div className="text-2xl font-black uppercase tracking-[0.2em] text-amber-500 sm:text-3xl">
            🏀 NBA 1<span className="normal-case">v</span>1 Tournament 🏀
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
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400 sm:text-sm">
            32 Players. 1 Player per Team. 2 Wild Cards.
            <br />
            Seeded Tallest to Shortest
          </p>
        </header>
      </div>

      {/* Not nested in the max-w-[1500px] container above: the bracket is often wider
          than that cap, and centering/aligning it inside a narrower ancestor either
          hugs the left edge or clips off-screen. This section spans the true viewport
          so `mx-auto w-fit` below can center (or, if still too wide, flush-left without
          losing content) against the real available width.
          The `overflow-x-auto` wrapper is load-bearing on mobile: without it, the
          bracket's overflow propagates all the way up to `document.documentElement`,
          and mobile browsers respond by silently widening the whole page's layout
          viewport to fit it (ignoring `width=device-width`) instead of just scrolling
          — every section, not only the bracket, ends up tiny and shifted left. This
          box contains that overflow locally instead. It's safe from the old
          `overflow-x-auto` + `justify-center` gotcha (see below) because `mx-auto
          w-fit` clamps to flush-left rather than centering-with-overflow when the
          bracket is wider than its container, so there's no start-side overflow to
          strand. */}
      <section className="mb-8 mx-auto max-w-[1800px] overflow-x-auto px-4 sm:px-6">
        {bracketReady ? (
          <div className="relative mx-auto w-fit">
            {/* Positioned above the Wings region specifically (not the bracket's outer
                right edge), roughly level with the Overall Champion box above it. The
                bracket's column widths are all fixed pixels (see Column), so this offset
                is stable — but if those widths ever change, re-measure and adjust. */}
            <div className="absolute left-[826px] top-[158px] z-10">
              <ShareImageButton targetRef={bracketRef} />
            </div>
            <div ref={bracketRef}>
              <Bracket rounds={rounds} onPickWinner={handlePickWinner} />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[1500px] rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-400">
            Fill all 32 roster slots below to unlock the bracket.
          </div>
        )}
      </section>

      <div className="mx-auto max-w-[1500px] px-4 sm:px-6">
        <div className="mb-4">
          <CollapsibleSection
            title="Pick Your Players"
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
    </div>
  );
}
