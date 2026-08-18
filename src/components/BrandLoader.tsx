"use client";

import { Logo } from "./Logo";

/**
 * Full-screen brand intro shown while the portal opens — logo reveal,
 * growing hairline and discipline tagline, in the spirit of a luxury
 * design-studio preloader. Always black, independent of theme.
 */
export function BrandLoader({
  status = "Please wait…",
}: {
  status?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="overflow-hidden py-1">
        <div
          style={{
            animation: "reveal-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        >
          <Logo variant="white" height={30} />
        </div>
      </div>

      <div
        className="mt-7 h-px bg-white/50"
        style={{ animation: "line-grow 1.4s ease both 0.45s" }}
      />

      <p
        className="mt-6 font-body text-[10px] font-light uppercase tracking-[0.4em] text-white/45"
        style={{ animation: "fade-up-soft 0.8s ease both 0.85s" }}
      >
        Design&nbsp;&nbsp;·&nbsp;&nbsp;Build&nbsp;&nbsp;·&nbsp;&nbsp;Furniture
      </p>

      <p
        className="mt-8 font-body text-[10px] font-light uppercase tracking-[0.28em] text-white/50"
        style={{ animation: "fade-up-soft 0.8s ease both 1.1s" }}
      >
        {status}
      </p>
      <span
        aria-hidden
        className="mt-5 h-1 w-24 overflow-hidden bg-white/15"
        style={{ animation: "fade-up-soft 0.8s ease both 1.2s" }}
      >
        <span className="block h-full w-1/2 bg-white/70" style={{ animation: "loader-bar 1.1s ease-in-out infinite" }} />
      </span>

      <p
        className="absolute bottom-8 font-body text-[10px] font-light uppercase tracking-[0.3em] text-white/25"
        style={{ animation: "fade-up-soft 0.8s ease both 1.1s" }}
      >
        Since 1999
      </p>
    </div>
  );
}
