"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Player } from "@/lib/types";
import { TeamBadge } from "./TeamBadge";

export function PlayerSearchSelect({
  options,
  value,
  onChange,
  placeholder = "Search players…",
  showTeamBadge = false,
}: {
  options: Player[];
  value: Player | null;
  onChange: (playerId: string) => void;
  placeholder?: string;
  showTeamBadge?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? options.filter((p) => p.name.toLowerCase().includes(q)) : options;
    return base.slice(0, 50);
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-left text-xs text-zinc-100 transition hover:border-amber-500/60 focus:border-amber-500 focus:outline-none sm:text-sm"
      >
        {showTeamBadge && value && <TeamBadge abbr={value.teamAbbr} size="sm" />}
        <span className="flex-1 truncate">
          {value ? value.name : <span className="text-zinc-500">{placeholder}</span>}
        </span>
        <span className="text-zinc-500 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-72 max-w-[90vw] overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 shadow-xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a name…"
            className="w-full border-b border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-zinc-500">No players found</li>
            )}
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-amber-500/10 ${
                    value?.id === p.id ? "bg-amber-500/15 text-amber-300" : "text-zinc-200"
                  }`}
                >
                  {showTeamBadge && <TeamBadge abbr={p.teamAbbr} size="sm" />}
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-zinc-500">
                    {p.heightLabel} · {p.weightLb}lb
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
