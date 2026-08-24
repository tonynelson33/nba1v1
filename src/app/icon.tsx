import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Same crown mark as CrownIcon.tsx (see ogImage.tsx for why it's duplicated rather than
// imported — this renders in next/og's build-time engine, a different runtime than the
// app's own React tree). Filled solid instead of stroked outline: a thin outline crown
// disappears at 16-32px favicon sizes, a solid silhouette reads clearly.
const CROWN_PATH = "M4 42 L2 8 L20 22 L36 2 L52 22 L70 8 L68 42 Z";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d428a",
        }}
      >
        <svg width="22" height="14" viewBox="0 0 72 46">
          <path d={CROWN_PATH} fill="#f5c542" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
