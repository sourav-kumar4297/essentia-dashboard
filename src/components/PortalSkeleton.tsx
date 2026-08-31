"use client";

/** Borderless YouTube / Instagram shimmer placeholders. */

export function ContentSkeleton() {
  return (
    <div aria-hidden className="animate-fade">
      <div className="skeleton h-2.5 w-20" />
      <div className="skeleton mt-3 h-7 w-48" />
      <div className="skeleton mt-2 h-3 w-72 max-w-full" />

      <div className="mt-8 flex gap-3">
        {[72, 96, 80, 88].map((w, i) => (
          <div key={i} className="skeleton h-3" style={{ width: w }} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-[84px]" />
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <div className="skeleton h-9 flex-1" />
        <div className="skeleton hidden h-9 w-36 sm:block" />
        <div className="skeleton hidden h-9 w-28 sm:block" />
      </div>

      <div className="mt-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton skeleton-circle h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-3 w-[42%] max-w-full" />
              <div className="skeleton mt-2 h-2.5 w-[28%] max-w-full" />
            </div>
            <div className="skeleton hidden h-3 w-16 sm:block" />
            <div className="skeleton hidden h-6 w-14 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeadsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td className="px-2 py-3.5">
            <div className="skeleton h-3.5 w-3.5" />
          </td>
          <td className="px-3 py-3.5">
            <div className="flex items-center gap-3">
              <div className="skeleton skeleton-circle h-8 w-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="skeleton h-3 w-36 max-w-full" />
                <div className="skeleton mt-2 h-2.5 w-24 max-w-full" />
              </div>
            </div>
          </td>
          <td className="px-3 py-3.5">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-2 h-2.5 w-10" />
          </td>
          <td className="px-3 py-3.5">
            <div className="skeleton h-5 w-9" />
          </td>
          <td className="px-3 py-3.5">
            <div className="skeleton h-3 w-24 max-w-full" />
          </td>
          <td className="px-3 py-3.5">
            <div className="skeleton h-5 w-16" />
          </td>
          <td className="px-3 py-3.5">
            <div className="skeleton h-5 w-12" />
          </td>
          <td className="px-3 py-3.5">
            <div className="skeleton h-3 w-14" />
          </td>
          <td className="px-3 py-3.5">
            <div className="skeleton skeleton-circle h-6 w-6" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-hidden className="animate-fade">
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-[92px]" />
        ))}
      </div>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-[84px]" />
        ))}
      </div>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-[72px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4 py-1">
            <div className="skeleton h-4 w-36" />
            {Array.from({ length: 5 }).map((__, j) => (
              <div key={j} className="space-y-2">
                <div className="flex justify-between gap-4">
                  <div className="skeleton h-3 w-28" />
                  <div className="skeleton h-3 w-8" />
                </div>
                <div className="skeleton h-1.5 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChannelsSkeleton() {
  return (
    <div aria-hidden className="animate-fade">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-[84px]" />
        ))}
      </div>
      <div className="space-y-5 py-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="skeleton h-3.5 w-40" />
              <div className="skeleton h-3.5 w-10" />
            </div>
            <div className="skeleton h-1.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div aria-hidden className="no-scrollbar flex gap-3 overflow-x-auto animate-fade">
      {Array.from({ length: 7 }).map((_, i) => (
        <section key={i} className="flex w-[220px] shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-3 w-5" />
          </div>
          {Array.from({ length: 3 }).map((__, j) => (
            <div key={j} className="skeleton h-[92px]" />
          ))}
        </section>
      ))}
    </div>
  );
}
