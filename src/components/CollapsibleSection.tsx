"use client";

import { useState, type ReactNode } from "react";

export function CollapsibleSection({
  title,
  defaultOpen = false,
  right,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-sm font-bold uppercase tracking-widest text-zinc-300">
            {title}
          </span>
          <span className="text-xs text-zinc-500">{open ? "Hide ▲" : "Show ▼"}</span>
        </button>
        {right}
      </div>

      {open && <div className="border-t border-zinc-800 p-4">{children}</div>}
    </div>
  );
}
