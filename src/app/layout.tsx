import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Anton } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "NBA1v1 — King of the Court",
  description: "Build your bracket. Crown the King. A 32-player NBA 1-on-1 tournament bracket.",
};

// Explicit (not just Next's default) so pinch-zoom is guaranteed available — the bracket
// is wide, and mobile users pinch-zoom out to see the whole thing at once instead of
// scrolling piece by piece.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-zinc-100">{children}</body>
    </html>
  );
}
