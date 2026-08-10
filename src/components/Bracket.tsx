"use client";

import type { Matchup, Round } from "@/lib/types";
import { MatchupCard } from "./MatchupCard";

type RegionName = "Bigs" | "Forwards" | "Wings" | "Guards";

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
}: {
  title: string;
  matchups: Matchup[];
  onPickWinner: (matchupId: string, playerId: string) => void;
  badge?: string;
  badgeMode?: "always" | "winner";
  dividerClass?: string;
}) {
  return (
    <div className={`flex w-36 shrink-0 flex-col sm:w-40 ${dividerClass ? `border-l-2 ${dividerClass} pl-2` : ""}`}>
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
  podFinal,
  onPickWinner,
}: {
  name: RegionName;
  r32: Matchup[];
  r16: Matchup[];
  podFinal: Matchup[];
  onPickWinner: (matchupId: string, playerId: string) => void;
}) {
  const style = REGION_STYLES[name];
  return (
    <div className="flex flex-col">
      <div
        className={`mb-2 rounded-md border px-2 py-1 text-center text-xs font-black uppercase tracking-widest ${style.banner}`}
      >
        {name}
      </div>
      <div className="flex flex-1 items-stretch gap-3">
        <Column title="Round of 32" matchups={r32} onPickWinner={onPickWinner} />
        <Column
          title="Round of 16"
          matchups={r16}
          onPickWinner={onPickWinner}
          dividerClass={style.divider}
        />
        <Column
          title="Pod Final"
          matchups={podFinal}
          onPickWinner={onPickWinner}
          badge="$500,000"
          badgeMode="winner"
          dividerClass={style.divider}
        />
      </div>
    </div>
  );
}

function RegionStack({
  top,
  bottom,
  onPickWinner,
}: {
  top: { name: RegionName; r32: Matchup[]; r16: Matchup[]; podFinal: Matchup[] };
  bottom: { name: RegionName; r32: Matchup[]; r16: Matchup[]; podFinal: Matchup[] };
  onPickWinner: (matchupId: string, playerId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Region {...top} onPickWinner={onPickWinner} />
      <Region {...bottom} onPickWinner={onPickWinner} />
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
    <div className="flex items-center gap-3 rounded-xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/15 to-transparent px-5 py-3">
      <span className="text-3xl sm:text-4xl">{emoji}</span>
      <div className="text-left">
        <div className="text-xs font-bold uppercase tracking-widest text-zinc-300 sm:text-sm">
          {label}
        </div>
        <div className="text-2xl font-black text-amber-300 sm:text-3xl">{amount}</div>
        <div className="text-[11px] text-zinc-400 sm:text-xs">{sublabel}</div>
      </div>
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

  const regions: Record<RegionName, { name: RegionName; r32: Matchup[]; r16: Matchup[]; podFinal: Matchup[] }> = {
    Bigs: { name: "Bigs", r32: r32.matchups.slice(0, 4), r16: r16.matchups.slice(0, 2), podFinal: qf.matchups.slice(0, 1) },
    Forwards: { name: "Forwards", r32: r32.matchups.slice(4, 8), r16: r16.matchups.slice(2, 4), podFinal: qf.matchups.slice(1, 2) },
    Wings: { name: "Wings", r32: r32.matchups.slice(8, 12), r16: r16.matchups.slice(4, 6), podFinal: qf.matchups.slice(2, 3) },
    Guards: { name: "Guards", r32: r32.matchups.slice(12, 16), r16: r16.matchups.slice(6, 8), podFinal: qf.matchups.slice(3, 4) },
  };

  const championMatch = finals.matchups[0];
  const champion =
    championMatch.winnerId &&
    (championMatch.a?.id === championMatch.winnerId ? championMatch.a : championMatch.b);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-stretch justify-center gap-3">
        <PrizeStat
          emoji="🏆"
          label="Position Champion"
          amount="$500,000"
          sublabel="Winner of each pod: Bigs, Forwards, Wings, Guards"
        />
        <PrizeStat
          emoji="👑"
          label="Overall Champion"
          amount="$2,000,000"
          sublabel="King of the Court"
        />
      </div>

      <div className="rounded-xl border-2 border-amber-600/30 bg-zinc-900/70 p-3 shadow-[0_0_50px_-10px_rgba(217,164,6,0.25)]">
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
                    $2,000,000
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

          <RegionStack top={regions.Wings} bottom={regions.Guards} onPickWinner={onPickWinner} />
        </div>
      </div>
    </div>
  );
}
