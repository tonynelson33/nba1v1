"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Player, PlayerTuple, Team } from "@/lib/types";
import { deriveBracket, seedPlayers } from "@/lib/seeding";
import { hydratePlayers } from "@/lib/players";
import { RosterPicker } from "./RosterPicker";
import { BracketPrizes, BracketGrid } from "./Bracket";
import { RulesSection } from "./RulesSection";
import { CollapsibleSection } from "./CollapsibleSection";
import { CourtBackdrop } from "./CourtBackdrop";
import { CrownIcon } from "./CrownIcon";

const WILDCARD_SLOTS = [
  { slotId: "WC1", label: "Wild Card" },
  { slotId: "WC2", label: "Wild Card" },
];

// The grid's fixed, non-responsive content size (see Column/semifinal/final widths in
// Bracket.tsx) — used to compute how much to shrink it to fit whatever width is actually
// available, on any screen, instead of a hardcoded per-breakpoint scale. Must match the
// grid's true rendered size (measured via getBoundingClientRect at natural/unscaled size)
// or the reserved space for it here under/over-reports, and the page grows taller or wider
// than it needs to — re-measure and update these if MatchupCard/Bracket styling changes
// height or width (e.g. adding a border grew this from 942 to ~1000 after the royal-blue
// theme added border-2 to every matchup row).
const BRACKET_WIDTH = 1660;
const BRACKET_HEIGHT = 1000;

export function BracketApp({
  teams,
  allPlayersRaw,
  defaultWildcards,
  ratingsAsOf,
}: {
  teams: Team[];
  allPlayersRaw: PlayerTuple[];
  defaultWildcards: string[];
  /** ISO timestamp from the 2K API's own last-sync date (see ratingsMeta.json). */
  ratingsAsOf: string;
}) {
  // timeZone: "UTC" so the date shown doesn't shift a day depending on the viewer's local
  // timezone relative to the API's UTC timestamp (e.g. an early-UTC-morning sync time would
  // otherwise read as the previous day for anyone west of UTC).
  const ratingsAsOfLabel = new Date(ratingsAsOf).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    timeZone: "UTC",
  });
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
  const scrollSectionRef = useRef<HTMLElement>(null);

  // Desktop (≥640px, matching Tailwind's `sm` breakpoint): shrinks the grid to exactly
  // fit whatever width is available (never grows past its natural 100%), so no screen
  // ever needs horizontal scrolling to see the whole bracket by default — on a screen
  // wide enough already, this settles back to 1 (no shrink). Users can still pinch-zoom
  // in from there for detail (unaffected by this — see the touch-action comment below).
  // Mobile stays at a fixed 0.5 regardless of fit — auto-fitting a ~1660px grid into a
  // ~375px phone would shrink it to ~0.23 (illegibly small); 0.5 was already deliberately
  // chosen (see below) as "smaller by default, still readable at a glance," not
  // "guaranteed no scrolling," and stays that way on purpose.
  const MOBILE_BREAKPOINT = 640;
  const MOBILE_SCALE = 0.5;
  const [bracketScale, setBracketScale] = useState(1);
  useEffect(() => {
    function updateScale() {
      const el = scrollSectionRef.current;
      if (!el) return;
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setBracketScale(MOBILE_SCALE);
        return;
      }
      const style = getComputedStyle(el);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const available = el.clientWidth - paddingX;
      setBracketScale(Math.min(1, available / BRACKET_WIDTH));
    }
    updateScale();
    // ResizeObserver instead of a plain `resize` listener: it reacts to the section's
    // actual layout width changing, for any reason (window resize, but also e.g. a
    // scrollbar appearing/disappearing, font loading, or devtools panel toggling) —
    // strictly more reliable for "keep this element's size accurate" than only
    // listening for whole-window resize events.
    const el = scrollSectionRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
          <div className="flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-100 sm:text-sm">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-white/40 sm:w-24" />
            {/* Wrapped in its own span so it's a single flex item — mixing bare text with an
                inline element as direct children of a flex container makes each text fragment
                its own anonymous flex item too, so `gap-4` was landing *inside* "1v1". */}
            <span>
              NBA 1<span className="normal-case">v</span>1 Tournament
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-white/40 sm:w-24" />
          </div>
          <div className="mt-4 flex justify-center">
            <CrownIcon className="h-6 w-10 text-court-red sm:h-8 sm:w-12" />
          </div>
          <h1
            className="mt-2 text-5xl uppercase tracking-wide text-court-red sm:text-6xl md:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            King of the Court
          </h1>
          <p className="mt-3 text-lg font-bold uppercase tracking-widest text-zinc-100 sm:text-2xl">
            Build your bracket. Crown the King.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-widest text-zinc-400 sm:text-sm">
            <span>32 Players</span>
            <span className="text-zinc-600">/</span>
            <span>1 per Team</span>
            <span className="text-zinc-600">/</span>
            <span>2 Wild Cards</span>
            <span className="text-zinc-600">/</span>
            <span>Seeded Tallest to Shortest</span>
          </div>
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
          same way the header is, regardless of the bracket's own position. */}
      {bracketReady && (
        <div className="mx-auto mb-4 max-w-[1500px] px-4 sm:px-6">
          <div className="flex flex-col items-center gap-3">
            <BracketPrizes />
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
      <section ref={scrollSectionRef} className="mb-8 mx-auto max-w-[1800px] overflow-x-auto px-4 sm:px-6">
        {bracketReady ? (
          <div className="mx-auto w-fit">
            {/* Shrunk to `bracketScale` (computed above from the actual available
                width, capped at 1) so the whole grid fits on screen with no
                horizontal scrolling needed by default, on any screen size — pinch-
                zoom (still native/unrestricted, see above) lets users zoom further
                in or out from there.
                A CSS `transform: scale()` alone isn't enough here: it shrinks what's
                *painted* but not the space reserved for it in normal layout, so an
                ancestor sized off the pre-transform box (as `w-fit` is) still
                reserves/scrolls the full original width — the bracket would look
                shrunk but still need nearly the same amount of horizontal
                scrolling, with a lot of dead scroll space past the visible content.
                The fix: an outer wrapper with an *explicit* pixel size (the grid's
                fixed dimensions × `bracketScale`) is what `overflow-x-auto` actually
                measures, and it exactly matches what the scaled inner content paints
                into, so there's no dead space and no clipping either. Height needs
                the exact same explicit treatment as width, for the exact same
                reason. */}
            <div style={{ width: BRACKET_WIDTH * bracketScale, height: BRACKET_HEIGHT * bracketScale }}>
              <div className="w-fit origin-top-left" style={{ transform: `scale(${bracketScale})` }}>
                <BracketGrid rounds={rounds} onPickWinner={handlePickWinner} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[1500px] rounded-xl border border-royal/30 bg-royal-surface/60 p-8 text-center text-sm text-zinc-400">
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
                <span className="text-xs text-zinc-500">2K ratings as of {ratingsAsOfLabel}</span>
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

        <footer className="mt-10 text-center text-xs text-white">
          A concept for a real 1-on-1 tournament. Team colors shown for reference; not affiliated
          with or endorsed by the NBA.
        </footer>
      </div>
    </div>
  );
}
