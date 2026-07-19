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

export function PortalSkeleton() {
  return (
    <div aria-hidden className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="hidden w-[268px] shrink-0 flex-col border-r border-line bg-sidebar md:flex">
        <div className="border-b border-line px-5 pb-5 pt-6">
          <div className="skeleton h-5 w-28" />
          <div className="skeleton mt-5 h-3 w-32" />
          <div className="skeleton mt-2 h-4 w-44" />
        </div>
        <div className="flex-1 space-y-5 px-4 py-5">
          {Array.from({ length: 3 }).map((_, g) => (
            <div key={g}>
              <div className="skeleton h-2.5 w-20" />
              <div className="mt-3 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton h-8 w-8 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="skeleton h-3 w-24" />
                      <div className="skeleton mt-1.5 h-2.5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-line p-3">
          <div className="skeleton h-12" />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line px-4 md:px-8">
          <div className="skeleton h-3.5 w-48 max-w-[40vw]" />
          <div className="flex items-center gap-3">
            <div className="skeleton h-8 w-28" />
            <div className="skeleton h-8 w-16" />
          </div>
        </header>
        <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
          <div className="mx-auto max-w-5xl">
            <ContentSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}
