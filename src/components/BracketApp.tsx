"use client";

import { useMemo, useRef, useState } from "react";
import type { Player, PlayerTuple, Team } from "@/lib/types";
import { deriveBracket, seedPlayers } from "@/lib/seeding";
import { hydratePlayers } from "@/lib/players";
import { RosterPicker } from "./RosterPicker";
import { BracketPrizes, BracketGrid } from "./Bracket";
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
          <p className="mt-3 text-lg font-bold text-zinc-200 sm:text-2xl">
            Build your bracket. Crown the King.
          </p>
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400 sm:text-sm">
            32 Players. 1 Player per Team. 2 Wild Cards.
            <br />
            Seeded Tallest to Shortest
          </p>
        </header>
      </div>

      {/* Prize boxes live here, in normal page flow like the header, on every screen
          size — not just mobile. They used to also render a second time inline with
          the grid inside the scrollable section below, centered *relative to the
          bracket's own w-fit wrapper* rather than the page. That looked fine only
          when the viewport was wide enough for the bracket to truly center (roughly
          ≥1750px); on ordinary laptop widths the bracket wrapper flushes left (see
          the comment on the scrollable section below), so the prize row rode along
          with it and ended up visibly left of true page-center — unlike the header
          text above it, which always centers correctly since it's never wider than
          its container. Rendering the prize row here instead means it's centered the
          same way the header is, regardless of the bracket's own position.
          The share button stays split by breakpoint, though: on mobile it renders
          right here (frozen, same as the prize row). On desktop it's still
          positioned relative to the grid itself (see the scrollable section below)
          — that part wasn't reported as broken, so it's left alone. */}
      {bracketReady && (
        <div className="mx-auto mb-4 max-w-[1500px] px-4 sm:px-6">
          <div className="flex flex-col items-center gap-3">
            <BracketPrizes />
            <div className="sm:hidden">
              <ShareImageButton targetRef={bracketRef} />
            </div>
          </div>
        </div>
      )}

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
          strand.
          Deliberately no `touch-action` override here (leave it at the default `auto`)
          — a narrower value like `pan-x` was tried to "protect" pinch-zoom but instead
          blocked vertical panning entirely, since it explicitly excludes `pan-y`: with
          only horizontal scroll available inside this box, a vertical swipe had
          nowhere to go and couldn't bubble up to scroll the page. `auto` correctly
          lets the browser sort it out natively — horizontal swipe scrolls this box,
          vertical swipe bubbles to scroll the page, pinch-zoom works — with zero
          custom logic needed. */}
      <section className="mb-8 mx-auto max-w-[1800px] overflow-x-auto px-4 sm:px-6">
        {bracketReady ? (
          <div className="mx-auto w-fit">
            {/* Desktop only: the share button's position (right-aligned to the grid,
                `top-[158px]`) is still measured relative to a prize-row-sized gap
                above the grid, so that gap is preserved here as an `invisible`
                spacer (occupies the same layout space, renders nothing) rather than
                a real second copy of the prize row — the real, visible one now lives
                in the frozen block above (see comment there). Don't delete this
                spacer without also re-deriving the button's `top` offset. */}
            <div className="relative hidden sm:block">
              <div className="invisible mb-12 flex flex-col items-center" aria-hidden="true">
                <BracketPrizes />
              </div>
              {/* Right-aligned to the bracket's own right edge (this wrapper is
                  `w-fit`, matching the grid below), roughly level with the Overall
                  Champion box above it and clear of the grid itself. */}
              <div className="absolute right-0 top-[158px] z-10">
                <ShareImageButton targetRef={bracketRef} />
              </div>
            </div>

            {/* Renders at half size by default on mobile so more of the bracket is
                visible without scrolling — pinch-zoom (still native/unrestricted,
                see above) lets users zoom further in or out from there, including
                all the way out to fit the whole thing for a screenshot.
                `scale-50` alone isn't enough here: a CSS transform shrinks what's
                *painted* but not the space reserved for it in normal layout, so an
                ancestor sized off the pre-transform box (as `w-fit` is) still
                reserves/scrolls the full original width — the bracket would look
                half-size but still need nearly the same amount of horizontal
                scrolling, with a lot of dead scroll space past the visible content.
                The fix: an outer wrapper with an *explicit* width (830px = the
                grid's fixed 1660px content width × 0.5 — see Column/semifinal/final
                widths in Bracket.tsx) is what `overflow-x-auto` actually measures,
                and it exactly matches what the scaled inner content paints into, so
                there's no dead space and no clipping either. `bracketRef` (used for
                the html2canvas capture) stays on the *inner*, untransformed div —
                its own `scrollWidth`/`scrollHeight` report the true full-size
                content regardless of the outer wrapper or the scale applied to it,
                so shared images are always full resolution. Height needs the exact
                same explicit treatment as width, for the exact same reason — the
                first version of this only constrained width, and the grid's full
                ~942px unscaled height (vs. ~471px actually visible) got reserved
                below it in the page's normal vertical flow, leaving a large empty
                gap before "Pick Your Players". If the grid's fixed dimensions ever
                change, recompute both 830px and 471px (half of the new totals). */}
            <div className="h-[471px] w-[830px] sm:h-fit sm:w-fit">
              <div ref={bracketRef} className="w-fit origin-top-left scale-50 sm:scale-100">
                <BracketGrid rounds={rounds} onPickWinner={handlePickWinner} />
              </div>
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
            defaultOpen={true}
            right={
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{filledCount}/32 selected</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-zinc-500 underline decoration-dotted hover:text-zinc-200"
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
