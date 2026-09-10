"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { Button, PageHeader, inputClass } from "@/components/ui";
import { DesignPioPanel } from "@/components/DesignPioPanel";
import { useBdLeads } from "@/lib/use-bd-leads";
import { clsx } from "clsx";

export default function PioPage() {
  const { leads, loading, refresh } = useBdLeads();
  const [q, setQ] = useState("");
  const [pioLeadId, setPioLeadId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(needle) ||
        l.location?.toLowerCase().includes(needle) ||
        l.phone.includes(needle) ||
        l.email.toLowerCase().includes(needle),
    );
  }, [leads, q]);

  return (
    <div>
      <PageHeader
        eyebrow="Tools"
        title="Design PIO"
        description="Generate or edit Essentia Design PIO for any lead you can access. Layout matches the paper PIO template."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-dim" />
          <input
            className={clsx(inputClass, "pl-9")}
            placeholder="Search leads…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <p className="metric text-fg-dim">
          {loading ? "Loading…" : `${filtered.length} lead${filtered.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="border border-line">
        <div className="grid grid-cols-[1fr_120px_140px_120px] gap-2 border-b border-line bg-surface px-4 py-2">
          <p className="label text-fg-dim">Lead</p>
          <p className="label text-fg-dim">Status</p>
          <p className="label text-fg-dim">PIO</p>
          <p className="label text-fg-dim">Action</p>
        </div>
        {loading && (
          <p className="label px-4 py-8 text-center text-fg-dim">Loading leads…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="label px-4 py-8 text-center text-fg-dim">
            No leads found.
          </p>
        )}
        <ul>
          {filtered.map((l) => (
            <li
              key={l.id}
              className="grid grid-cols-[1fr_120px_140px_120px] items-center gap-2 border-b border-line px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="label truncate text-fg">{l.name}</p>
                <p className="metric truncate text-fg-dim">
                  {l.location || "No site"} · {l.assignedTo?.name ?? "Unassigned"}
                </p>
              </div>
              <p className="label text-fg-muted">{l.status}</p>
              <p className="label text-fg-muted">
                {l.pioReleased ? "Released" : l.pioData ? "Draft" : "Not started"}
              </p>
              <Button
                variant="secondary"
                className="!px-2 !py-1.5"
                onClick={() => setPioLeadId(l.id)}
              >
                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                {l.pioData ? "Open" : "Generate"}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {pioLeadId && (
        <DesignPioPanel
          leadId={pioLeadId}
          open
          onClose={() => setPioLeadId(null)}
          onSaved={() => void refresh()}
        />
      )}
    </div>
  );
}
