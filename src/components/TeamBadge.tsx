import { teamColorFor } from "@/lib/teamColors";

export function TeamBadge({ abbr, size = "md" }: { abbr: string | null; size?: "sm" | "md" }) {
  const label = abbr ?? "WC";
  const color = abbr ? teamColorFor(abbr) : { primary: "#C9A227", secondary: "#1a1a1a" };
  const dims = size === "sm" ? "h-6 min-w-6 px-1.5 text-[10px]" : "h-7 min-w-7 px-2 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-bold tracking-wide ${dims}`}
      style={{
        backgroundColor: color.primary,
        color: "#fff",
        boxShadow: `inset 0 0 0 1.5px ${color.secondary}`,
      }}
    >
      {label}
    </span>
  );
}
