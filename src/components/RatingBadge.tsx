import { ratingColorFor } from "@/lib/ratingColor";

/** 2K overall rating, color-coded red (worst) to green (best). Null (no current 2K match)
 *  renders as a neutral gray dash rather than a misleading rating. */
export function RatingBadge({ overall, size = "md" }: { overall: number | null; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-6 min-w-6 px-1.5 text-[10px]" : "h-7 min-w-7 px-2 text-xs";
  const color = overall != null ? ratingColorFor(overall) : "#52525b";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-bold tracking-wide text-zinc-950 ${dims}`}
      style={{ backgroundColor: color }}
      title={overall != null ? `2K overall: ${overall}` : "No current 2K rating"}
    >
      {overall ?? "–"}
    </span>
  );
}
