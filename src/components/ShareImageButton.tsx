"use client";

import { useState, type RefObject } from "react";
import html2canvas from "html2canvas-pro";

const FILE_NAME = "king-of-the-court-bracket.png";

export function ShareImageButton({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) {
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mobile Safari and most mobile browsers silently ignore the `download` attribute on
  // data: URIs — tapping the link just opens/navigates to the image instead of saving it.
  // The Web Share API's native share sheet (with a "Save Image" option) is the reliable
  // way to get a file onto a phone; desktop browsers mostly lack file support here, so
  // they fall through to the plain anchor download below.
  async function handleSaveClick() {
    if (!previewUrl) return;
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const file = new File([blob], FILE_NAME, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "King of the Court Bracket" });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Web Share failed, falling back to direct download", err);
    }
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = FILE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleClick() {
    if (!targetRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const node = targetRef.current;
      // The bracket panel overflows its own box (that's what lets the page scroll
      // sideways as one), so its offsetWidth is smaller than its real content.
      // scrollWidth/scrollHeight capture the true extent; pass them explicitly so
      // html2canvas doesn't crop to the visually-clipped box.
      const canvas = await Promise.race([
        html2canvas(node, {
          backgroundColor: "#16171c",
          scale: 1.5,
          useCORS: true,
          logging: false,
          width: node.scrollWidth,
          height: node.scrollHeight,
          windowWidth: node.scrollWidth,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 15000)
        ),
      ]);
      setPreviewUrl(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("Failed to export bracket image", err);
      setError("Couldn't generate the image. Try again, or take a screenshot instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleClick}
          disabled={busy}
          className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
        >
          {busy ? "Rendering…" : "Share Bracket"}
        </button>
        {error && <span className="max-w-[220px] text-right text-xs text-red-400">{error}</span>}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-black/85 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <p className="text-center text-xs text-zinc-300">
            Tap and hold the image to save it, or use the download link below.
          </p>
          <img
            src={previewUrl}
            alt="King of the Court bracket"
            className="max-w-full rounded-lg border-2 border-amber-500/50"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleSaveClick}
              className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300 hover:bg-amber-500/20"
            >
              Download
            </button>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
