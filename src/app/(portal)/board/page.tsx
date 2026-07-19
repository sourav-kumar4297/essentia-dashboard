"use client";

import Link from "next/link";
import { PageHeader, Panel, QualBadge } from "@/components/ui";
import { usePortal } from "@/lib/store";
import { stageLabel } from "@/lib/sla";
import type { LeadStage } from "@/lib/types";
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

export default function BoardPage() {
  const { leads } = usePortal();

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline"
        title="Stage board"
        description="Every lead by stage — click a card to open All Leads."
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

      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = leads.filter((l) => {
            if (col.stage === "proposal_draft") {
              return (
                l.stage === "proposal_draft" ||
                l.stage === "profile_sent"
              );
            }
            return l.stage === col.stage;
          });
          return (
            <Panel
              key={col.stage}
              className="min-w-[200px] max-w-[220px] shrink-0 !p-3"
              title={`${col.title} · ${items.length}`}
            >
              <ul className="space-y-2">
                {items.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/leads?focus=${l.id}`}
                      className="block border border-line p-2.5 transition hover:border-line-strong hover:bg-surface-hover"
                    >
                      <p className="label text-fg">{l.name}</p>
                      <p className="metric mt-1 text-fg-dim">
                        {l.businessUnit} · {l.source}
                      </p>
                      <div className="mt-2">
                        <QualBadge q={l.qualification} />
                      </div>
                    </Link>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="label py-4 text-center text-fg-dim">Empty</li>
                )}
              </ul>
            </Panel>
          );
        })}
      </div>

      <p className="label mt-2 text-fg-dim">
        Stages shown: {COLUMNS.map((c) => stageLabel(c.stage)).join(" · ")}
      </p>
    </div>
  );
}
