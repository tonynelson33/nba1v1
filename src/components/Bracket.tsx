"use client";

import type { Matchup, Round } from "@/lib/types";
import { MatchupCard } from "./MatchupCard";

type RegionName = "Bigs" | "Forwards" | "Wings" | "Guards";

const REGION_ORDER: RegionName[] = ["Bigs", "Forwards", "Wings", "Guards"];

const REGION_STYLES: Record<RegionName, { banner: string; divider: string }> = {
  Bigs: {
    banner: "border-sky-400/50 bg-sky-500/15 text-sky-300",
    divider: "border-sky-500/40",
  },
  Forwards: {
    banner: "border-emerald-400/50 bg-emerald-500/15 text-emerald-300",
    divider: "border-emerald-500/40",
  },
  Wings: {
    banner: "border-yellow-400/50 bg-yellow-500/15 text-yellow-300",
    divider: "border-yellow-500/40",
  },
  Guards: {
    banner: "border-rose-400/50 bg-rose-500/15 text-rose-300",
    divider: "border-rose-500/40",
  },
};

function Column({
  title,
  matchups,
  onPickWinner,
  badge,
  badgeMode,
  dividerClass,
  dividerSide = "left",
}: {
  title: string;
  matchups: Matchup[];
  onPickWinner: (matchupId: string, playerId: string) => void;
  badge?: string;
  badgeMode?: "always" | "winner";
  dividerClass?: string;
  dividerSide?: "left" | "right";
}) {
  const borderClass = dividerClass
    ? dividerSide === "left"
      ? `border-l-2 ${dividerClass} pl-2`
      : `border-r-2 ${dividerClass} pr-2`
    : "";
  return (
    <div className={`flex w-36 shrink-0 flex-col sm:w-40 ${borderClass}`}>
      <div className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        {title}
      </div>
      <div className="flex flex-1 flex-col justify-around">
        {matchups.map((m) => (
          <MatchupCard
            key={m.id}
            matchup={m}
            onPickWinner={onPickWinner}
            badge={badge}
            badgeMode={badgeMode}
          />
        ))}
      </div>
    </div>
  );
}

function Region({
  name,
  r32,
  r16,
  regionFinal,
  onPickWinner,
  flip = false,
}: {
  name: RegionName;
  r32: Matchup[];
  r16: Matchup[];
  regionFinal: Matchup[];
  onPickWinner: (matchupId: string, playerId: string) => void;
  flip?: boolean;
}) {
  const style = REGION_STYLES[name];
  const dividerSide = flip ? "right" : "left";

  const r32Col = (
    <Column
      title="Round of 32"
      matchups={r32}
      onPickWinner={onPickWinner}
      dividerClass={flip ? style.divider : undefined}
      dividerSide={dividerSide}
    />
  );
  const r16Col = (
    <Column
      title="Round of 16"
      matchups={r16}
      onPickWinner={onPickWinner}
      dividerClass={style.divider}
      dividerSide={dividerSide}
    />
  );
  const finalCol = (
    <Column
      title="Region Final"
      matchups={regionFinal}
      onPickWinner={onPickWinner}
      badge="$1,000,000"
      badgeMode="winner"
      dividerClass={flip ? undefined : style.divider}
      dividerSide={dividerSide}
    />
  );

  return (
    <div className="flex flex-col">
      <div
        className={`mb-2 rounded-md border px-2 py-1 text-center text-xs font-black uppercase tracking-widest ${style.banner}`}
      >
        {name}
      </div>
      <div className="flex flex-1 items-stretch gap-3">
        {flip ? (
          <>
            {finalCol}
            {r16Col}
            {r32Col}
          </>
        ) : (
          <>
            {r32Col}
            {r16Col}
            {finalCol}
          </>
        )}
      </div>
    </div>
  );
}

function RegionStack({
  top,
  bottom,
  onPickWinner,
  flip = false,
}: {
  top: { name: RegionName; r32: Matchup[]; r16: Matchup[]; regionFinal: Matchup[] };
  bottom: { name: RegionName; r32: Matchup[]; r16: Matchup[]; regionFinal: Matchup[] };
  onPickWinner: (matchupId: string, playerId: string) => void;
  flip?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Region {...top} onPickWinner={onPickWinner} flip={flip} />
      <Region {...bottom} onPickWinner={onPickWinner} flip={flip} />
    </div>
  );
}

function PrizeStat({
  emoji,
  label,
  amount,
  sublabel,
}: {
  emoji: string;
  label: string;
  amount: string;
  sublabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/15 to-transparent px-4 py-2">
      <span className="text-2xl sm:text-3xl">{emoji}</span>
      <div className="text-left">
        <div className="text-xs font-bold uppercase tracking-widest text-zinc-300 sm:text-sm">
          {label}
        </div>
        <div className="text-xl font-black text-amber-300 sm:text-2xl">{amount}</div>
        <div className="text-[11px] text-zinc-400 sm:text-xs">{sublabel}</div>
      </div>
    </div>
  );
}

function RegionPrizeStat({ name }: { name: RegionName }) {
  const style = REGION_STYLES[name];
  return (
    <div className={`min-w-[100px] flex-1 rounded-lg border px-2 py-1.5 text-center ${style.banner}`}>
      <div className="text-[10px] font-black uppercase tracking-widest">{name}</div>
      <div className="text-base font-black sm:text-lg">$1,000,000</div>
    </div>
  );
}

export function Bracket({
  rounds,
  onPickWinner,
}: {
  rounds: Round[];
  onPickWinner: (matchupId: string, playerId: string) => void;
}) {
  const [r32, r16, qf, sf, finals] = rounds;

  const regions: Record<RegionName, { name: RegionName; r32: Matchup[]; r16: Matchup[]; regionFinal: Matchup[] }> = {
    Bigs: { name: "Bigs", r32: r32.matchups.slice(0, 4), r16: r16.matchups.slice(0, 2), regionFinal: qf.matchups.slice(0, 1) },
    Forwards: { name: "Forwards", r32: r32.matchups.slice(4, 8), r16: r16.matchups.slice(2, 4), regionFinal: qf.matchups.slice(1, 2) },
    Wings: { name: "Wings", r32: r32.matchups.slice(8, 12), r16: r16.matchups.slice(4, 6), regionFinal: qf.matchups.slice(2, 3) },
    Guards: { name: "Guards", r32: r32.matchups.slice(12, 16), r16: r16.matchups.slice(6, 8), regionFinal: qf.matchups.slice(3, 4) },
  };

  const championMatch = finals.matchups[0];
  const champion =
    championMatch.winnerId &&
    (championMatch.a?.id === championMatch.winnerId ? championMatch.a : championMatch.b);

  return (
    <div className="flex w-fit flex-col items-center">
      <div className="mb-3 flex flex-col items-center">
        <div className="flex flex-wrap justify-center gap-2">
          {REGION_ORDER.map((name) => (
            <RegionPrizeStat key={name} name={name} />
          ))}
        </div>
        <div className="mt-2 flex justify-center">
          <PrizeStat emoji="👑" label="Overall Champion" amount="$5,000,000" sublabel="King of the Court" />
        </div>
      </div>

      <div className="w-fit rounded-xl border-2 border-amber-600/30 bg-zinc-900/70 p-3 shadow-[0_0_50px_-10px_rgba(217,164,6,0.25)]">
        <div className="flex items-stretch gap-4">
          <RegionStack top={regions.Bigs} bottom={regions.Forwards} onPickWinner={onPickWinner} />

          <div className="flex w-44 shrink-0 flex-col border-l-2 border-amber-500/50 pl-3">
            <div className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-amber-300">
              Semifinal · Bigs v Forwards
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <MatchupCard matchup={sf.matchups[0]} onPickWinner={onPickWinner} />
            </div>
          </div>

          <div className="flex w-52 shrink-0 flex-col items-center border-l-2 border-amber-500/50 pl-3">
            <div className="mb-1.5 text-center text-[10px] font-black uppercase tracking-widest text-amber-300">
              Final · Champion
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <MatchupCard matchup={championMatch} onPickWinner={onPickWinner} />
              <div className="w-full rounded-lg border-2 border-amber-400/60 bg-gradient-to-b from-amber-500/20 to-transparent p-3 text-center shadow-[0_0_30px_-8px_rgba(217,164,6,0.5)]">
                <div className="text-[10px] uppercase tracking-widest text-amber-400">
                  King of the Court
                </div>
                <div className="mt-1 text-base font-extrabold text-amber-200">
                  {champion ? `👑 ${champion.name}` : "TBD"}
                </div>
                {champion && (
                  <div className="mt-1 inline-block rounded bg-amber-400 px-2 py-0.5 text-xs font-extrabold text-zinc-950">
                    $5,000,000
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-44 shrink-0 flex-col border-l-2 border-amber-500/50 pl-3">
            <div className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-amber-300">
              Semifinal · Wings v Guards
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <MatchupCard matchup={sf.matchups[1]} onPickWinner={onPickWinner} />
            </div>
          </div>

          <RegionStack top={regions.Wings} bottom={regions.Guards} onPickWinner={onPickWinner} flip />
        </div>
      </div>
    </div>
  );
}
