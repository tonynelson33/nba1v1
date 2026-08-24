import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_ALT = "NBA1v1 — King of the Court: a 32-player NBA 1-on-1 tournament bracket";

// Same crown mark as CrownIcon.tsx, inlined here rather than imported — this file renders
// via next/og's satori engine at build time, a different runtime than the app's own React
// tree, so it can't share a client component across that boundary.
const CROWN_PATH = "M4 42 L2 8 L20 22 L36 2 L52 22 L70 8 L68 42 Z";

/** Shared by opengraph-image.tsx and twitter-image.tsx so both social preview images stay
 *  in sync from one definition. No custom font loaded — next/og's bundled default font
 *  renders plain Latin text fine, and avoiding a fetched/downloaded font file keeps this
 *  build-time-only and dependency-free. */
export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d428a",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#f2f5ff",
          }}
        >
          <div style={{ width: 90, height: 2, background: "rgba(255,255,255,0.4)" }} />
          <div>NBA 1v1 Tournament</div>
          <div style={{ width: 90, height: 2, background: "rgba(255,255,255,0.4)" }} />
        </div>
        <svg width="90" height="58" viewBox="0 0 72 46" style={{ marginTop: 28 }}>
          <path
            d={CROWN_PATH}
            fill="none"
            stroke="#c8102e"
            strokeWidth={4}
            strokeLinejoin="round"
          />
        </svg>
        <div
          style={{
            marginTop: 16,
            width: "100%",
            fontSize: 100,
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#c8102e",
            lineHeight: 1.02,
            textAlign: "center",
          }}
        >
          King of the Court
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#f2f5ff",
          }}
        >
          Build your bracket. Crown the King.
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  );
}
