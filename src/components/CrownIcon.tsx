/** Outline crown mark used in the header and the Overall Champion box — color and weight
 *  driven by the caller via className/strokeWidth (stroke="currentColor") rather than
 *  hardcoded, so it can be red in the header and gold in the champion box. */
export function CrownIcon({
  className,
  strokeWidth = 3,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg viewBox="0 0 72 46" className={className} aria-hidden="true">
      <path
        d="M4 42 L2 8 L20 22 L36 2 L52 22 L70 8 L68 42 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}
