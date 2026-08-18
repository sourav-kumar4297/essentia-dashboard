"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Pencil } from "lucide-react";
import { PageHeader, QualBadge } from "@/components/ui";
import { BoardSkeleton } from "@/components/PortalSkeleton";
import { PlatformTabs } from "@/components/PlatformTabs";
import { useBdLeads, useHubspotLiveSync, type BdLeadRow } from "@/lib/use-bd-leads";
import { BD_STATUS_LABELS, type BdLeadStatus } from "@/lib/bd-types";
import { clsx } from "clsx";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

const COLUMNS: { status: BdLeadStatus; title: string }[] = [
  { status: "NEW", title: "New" },
  { status: "CONTACTED", title: "Contacted" },
  { status: "IN_DISCUSSION", title: "In Discussion" },
  { status: "PROPOSAL_SENT", title: "Proposal Sent" },
  { status: "WON", title: "Won" },
  { status: "HOLD", title: "Hold" },
  { status: "LOST", title: "Lost" },
];

const ACTIVE_ORDER: BdLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "IN_DISCUSSION",
  "PROPOSAL_SENT",
  "WON",
];

export default function BoardPage() {
  const { leads, loading, refresh } = useBdLeads();
  useHubspotLiveSync(refresh);
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const map = new Map<BdLeadStatus, BdLeadRow[]>();
    for (const col of COLUMNS) map.set(col.status, []);
    for (const lead of leads) {
      const list = map.get(lead.status);
      if (list) list.push(lead);
    }
    return map;
  }, [leads]);

  async function moveLead(lead: BdLeadRow, dir: -1 | 1) {
    if (lead.status === "LOST" || lead.status === "HOLD") return;
    const idx = ACTIVE_ORDER.indexOf(lead.status);
    if (idx < 0) return;
    const next = ACTIVE_ORDER[idx + dir];
    if (!next) return;
    setBusyId(lead.id);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await refresh();
    setBusyId(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Lead platform"
        title="Pipeline"
        description="BD journey — New through Won, plus Hold and Lost."
      />

      <PlatformTabs />

      {loading ? (
        <BoardSkeleton />
      ) : (
      <div className="no-scrollbar flex overflow-x-auto border border-line bg-surface">
        {COLUMNS.map((col, i) => {
          const items = byStatus.get(col.status) ?? [];
          return (
            <section
              key={col.status}
              className={clsx(
                "flex min-h-[420px] w-[236px] shrink-0 flex-col",
                i > 0 && "border-l border-line",
              )}
            >
              <header className="flex items-baseline justify-between gap-2 border-b border-line px-4 py-3.5">
                <h2 className="label tracking-[0.16em] text-fg uppercase">
                  {col.title}
                </h2>
                <span className="metric text-fg-dim">{items.length}</span>
              </header>
              <ul className="flex flex-1 flex-col">
                {items.map((l) => {
                  const stageIdx = ACTIVE_ORDER.indexOf(l.status);
                  const isSide = l.status === "LOST" || l.status === "HOLD";
                  return (
                    <li
                      key={l.id}
                      className="group relative border-b border-line"
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/leads?focus=${l.id}`)}
                        className="block w-full px-4 py-4 text-left transition hover:bg-surface-hover"
                        disabled={busyId === l.id}
                      >
                        <p className="font-body text-[13px] font-normal leading-snug text-fg">
                          {l.name}
                        </p>
                        <p className="metric mt-1.5 text-fg-dim">
                          {l.businessUnit} · {l.source}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <QualBadge
                            q={
                              l.qualification as
                                | "Hot"
                                | "Warm"
                                | "Cold"
                                | "Unqualified"
                            }
                          />
                          <span className="metric text-fg-dim">
                            {format(new Date(l.createdAt), "dd MMM yyyy")}
                          </span>
                        </div>
                        {l.assignedTo && (
                          <p className="label mt-2.5 truncate text-fg-dim">
                            {l.assignedTo.name}
                          </p>
                        )}
                      </button>
                      <div className="absolute right-3 top-3.5 flex gap-0.5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                        {!isSide && (
                          <>
                            <button
                              type="button"
                              aria-label="Previous stage"
                              disabled={stageIdx <= 0}
                              onClick={() => moveLead(l, -1)}
                              className="p-1 text-fg-dim enabled:hover:text-fg disabled:opacity-30"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              aria-label="Next stage"
                              disabled={stageIdx >= ACTIVE_ORDER.length - 1}
                              onClick={() => moveLead(l, 1)}
                              className="p-1 text-fg-dim enabled:hover:text-fg disabled:opacity-30"
                            >
                              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          aria-label="View"
                          onClick={() => router.push(`/leads?focus=${l.id}`)}
                          className="p-1 text-fg-dim hover:text-fg"
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => router.push(`/leads?focus=${l.id}`)}
                          className="p-1 text-fg-dim hover:text-fg"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </li>
                  );
                })}
                {items.length === 0 && (
                  <li className="flex flex-1 items-center justify-center px-4 py-10">
                    <p className="label text-fg-dim">—</p>
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
      )}

      <p className="label mt-3 text-fg-dim">
        Statuses: {COLUMNS.map((c) => BD_STATUS_LABELS[c.status]).join(" · ")}
      </p>
    </div>
  );
}
