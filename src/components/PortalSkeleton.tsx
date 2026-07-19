"use client";

/** YouTube-style shimmer placeholders shown while the portal loads. */

export function ContentSkeleton() {
  return (
    <div aria-hidden className="animate-fade">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-2 h-7 w-52" />

      <div className="mt-6 flex gap-2 border-b border-line pb-3">
        {[64, 88, 72, 80].map((w, i) => (
          <div key={i} className="skeleton h-4" style={{ width: w }} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-11" />
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <div className="skeleton h-10 flex-1" />
        <div className="skeleton hidden h-10 w-40 sm:block" />
        <div className="skeleton hidden h-10 w-40 sm:block" />
      </div>

      <div className="mt-4 border border-line">
        <div className="skeleton h-10 border-0" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-t border-line px-4 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="skeleton h-3.5 w-40 max-w-full" />
              <div className="skeleton mt-2 h-3 w-28 max-w-full" />
            </div>
            <div className="skeleton hidden h-5 w-10 sm:block" />
            <div className="skeleton hidden h-3.5 w-20 md:block" />
            <div className="skeleton hidden h-5 w-16 lg:block" />
            <div className="skeleton hidden h-3.5 w-24 lg:block" />
            <div className="skeleton h-7 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

