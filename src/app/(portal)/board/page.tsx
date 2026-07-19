"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Pencil } from "lucide-react";
import { PageHeader, QualBadge } from "@/components/ui";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { LeadFormPanel } from "@/components/LeadFormPanel";
import { usePortal } from "@/lib/store";
import { relativeAge } from "@/lib/lead-intel";
import type { Lead, LeadStage } from "@/lib/types";
import { clsx } from "clsx";

const COLUMNS: { stage: LeadStage; title: string }[] = [
  { stage: "new", title: "New" },
  { stage: "contacted", title: "Contacted" },
  { stage: "qualified", title: "Qualified" },
  { stage: "handed_to_acquisition", title: "Acquisition" },
  { stage: "consultation", title: "Consultation" },
  { stage: "proposal_draft", title: "Proposal" },
  { stage: "proposal_sent", title: "Sent" },
  { stage: "accepted", title: "Signed" },
];

const STAGE_ORDER: LeadStage[] = COLUMNS.map((c) => c.stage);

function matchesColumn(lead: Lead, stage: LeadStage) {
  if (stage === "proposal_draft") {
    return lead.stage === "proposal_draft" || lead.stage === "profile_sent";
  }
  if (stage === "accepted") {
    return lead.stage === "accepted" || lead.stage === "handed_to_engagement";
  }
  return lead.stage === stage;
}

function boardStage(lead: Lead): LeadStage {
  if (lead.stage === "profile_sent") return "proposal_draft";
  if (lead.stage === "handed_to_engagement") return "accepted";
  return lead.stage;
}

export default function BoardPage() {
  const { leads, advisors, updateLead } = usePortal();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<LeadStage, Lead[]>();
    for (const col of COLUMNS) map.set(col.stage, []);
    for (const lead of leads) {
      for (const col of COLUMNS) {
        if (matchesColumn(lead, col.stage)) {
          map.get(col.stage)!.push(lead);
          break;
        }
      }
    }
    return map;
  }, [leads]);

  const detailLead = leads.find((l) => l.id === detailId) ?? null;
  const editLead = leads.find((l) => l.id === editId) ?? null;

  const moveLead = (lead: Lead, dir: -1 | 1) => {
    const current = boardStage(lead);
    const idx = STAGE_ORDER.indexOf(current);
    const next = STAGE_ORDER[idx + dir];
    if (!next) return;
    updateLead(lead.id, {
      stage: next,
      ...(next !== "new" && !lead.firstContactedAt
        ? { firstContactedAt: new Date().toISOString() }
        : {}),
      ...(next === "accepted" ? { signed: true } : {}),
      ...(dir === -1 && current === "accepted" ? { signed: false } : {}),
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline"
        title="Stage board"
        description="Every lead across the journey — open a card for detail."
      />

      <div className="mb-6 flex flex-wrap gap-1 border-b border-line">
        {[
          { href: "/pipeline", label: "Dashboard" },
          { href: "/leads", label: `All Leads (${leads.length})` },
          { href: "/board", label: "Pipeline", active: true },
          { href: "/channels", label: "Channels" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "label border-b-2 px-3 py-2.5 transition",
              "active" in tab && tab.active
                ? "border-fg text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="no-scrollbar flex overflow-x-auto border border-line bg-surface">
        {COLUMNS.map((col, i) => {
          const items = byStage.get(col.stage) ?? [];
          return (
            <section
              key={col.stage}
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
                  const owner =
                    advisors.find((a) => a.id === l.assignedAdvisorId)?.name ??
                    null;
                  const stageIdx = STAGE_ORDER.indexOf(boardStage(l));
                  return (
                    <li
                      key={l.id}
                      className="group relative border-b border-line"
                    >
                      <button
                        type="button"
                        onClick={() => setDetailId(l.id)}
                        className="block w-full px-4 py-4 text-left transition hover:bg-surface-hover"
                      >
                        <div className="flex items-start justify-between gap-2 pr-10">
                          <p className="font-body text-[13px] font-normal leading-snug text-fg">
                            {l.name}
                          </p>
                        </div>
                        <p className="metric mt-1.5 text-fg-dim">
                          {l.businessUnit} · {l.source} · {l.territory}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <QualBadge q={l.qualification} />
                          <span className="metric text-fg-dim">
                            {relativeAge(l.capturedAt)}
                          </span>
                        </div>
                        {owner && (
                          <p className="label mt-2.5 truncate text-fg-dim">
                            {owner}
                          </p>
                        )}
                      </button>

                      <div className="absolute right-3 top-3.5 flex gap-0.5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label="Move back a stage"
                          title="Previous stage"
                          disabled={stageIdx <= 0}
                          onClick={() => moveLead(l, -1)}
                          className="p-1 text-fg-dim transition enabled:hover:text-fg disabled:opacity-30"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          aria-label="Advance a stage"
                          title="Next stage"
                          disabled={stageIdx >= STAGE_ORDER.length - 1}
                          onClick={() => moveLead(l, 1)}
                          className="p-1 text-fg-dim transition enabled:hover:text-fg disabled:opacity-30"
                        >
                          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          aria-label={`View ${l.name}`}
                          title="View"
                          onClick={() => setDetailId(l.id)}
                          className="p-1 text-fg-dim transition hover:text-fg"
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Edit ${l.name}`}
                          title="Edit"
                          onClick={() => setEditId(l.id)}
                          className="p-1 text-fg-dim transition hover:text-fg"
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

      <LeadDetailPanel
        lead={detailLead}
        onClose={() => setDetailId(null)}
        onEdit={(lead) => {
          setDetailId(null);
          setEditId(lead.id);
        }}
      />
      <LeadFormPanel
        open={Boolean(editLead)}
        lead={editLead}
        onClose={() => setEditId(null)}
      />
    </div>
  );
}
