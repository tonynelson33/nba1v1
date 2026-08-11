export function CourtBackdrop() {
  return (
    <svg
      viewBox="0 0 900 260"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-amber-500 opacity-[0.14]"
    >
      <line x1="450" y1="0" x2="450" y2="260" stroke="currentColor" strokeWidth="3" />
      <circle cx="450" cy="130" r="70" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="450" cy="130" r="4" fill="currentColor" />
      <rect x="0" y="55" width="140" height="150" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M 140 55 A 75 75 0 0 1 140 205" stroke="currentColor" strokeWidth="3" fill="none" />
      <rect x="760" y="55" width="140" height="150" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M 760 55 A 75 75 0 0 0 760 205" stroke="currentColor" strokeWidth="3" fill="none" />
    </svg>
  );
}
