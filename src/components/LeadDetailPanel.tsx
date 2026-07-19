"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, X } from "lucide-react";
import { Button, Field, QualBadge, inputClass } from "@/components/ui";
import { usePortal } from "@/lib/store";
import { relativeAge } from "@/lib/lead-intel";
import { stageLabel } from "@/lib/sla";
import type { Lead, Qualification } from "@/lib/types";
import { clsx } from "clsx";

export function LeadDetailPanel({
  lead,
  onClose,
  onEdit,
}: {
  lead: Lead | null;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
}) {
  const {
    advisors,
    qualifyLead,
    assignLead,
    logFollowUp,
    handoffToAcquisition,
  } = usePortal();
  const acquisition = advisors.filter((a) => a.role === "acquisition");
  const growth = advisors.filter((a) => a.role === "growth");
  const [acqAdvisor, setAcqAdvisor] = useState(acquisition[0]?.id ?? "");
  const [toast, setToast] = useState("");
  const open = Boolean(lead);

  useEffect(() => {
    if (open) setToast("");
  }, [open, lead?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!lead) return null;

  const owner =
    advisors.find((a) => a.id === lead.assignedAdvisorId)?.name ?? "Unassigned";

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-fade"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-line bg-bg animate-slide-right">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <p className="label tracking-[0.18em] text-fg-muted uppercase">
              Lead Detail
            </p>
            <h2 className="heading mt-1 truncate text-[22px]">{lead.name}</h2>
            <p className="label mt-1 text-fg-muted">
              {lead.location} · {lead.projectType} ·{" "}
              {relativeAge(lead.capturedAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(lead)}
              aria-label="Edit lead"
              title="Edit lead"
              className="border border-line p-2 text-fg-muted transition hover:border-line-strong hover:text-fg"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="border border-line p-2 text-fg-muted transition hover:border-line-strong hover:text-fg"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <QualBadge q={lead.qualification} />
            <span className="metric border border-line px-2 py-0.5">
              {stageLabel(lead.stage)}
            </span>
            <span
              className={clsx(
                "metric border px-1.5 py-0.5",
                lead.businessUnit === "EE"
                  ? "border-[#2e3f6b]/40 text-[#2e3f6b]"
                  : "border-[#2e5c3a]/40 text-[#2e5c3a]",
              )}
            >
              {lead.businessUnit === "EE"
                ? "Essentia Environments"
                : "Essentia Home"}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Phone", lead.phone],
              ["Email", lead.email || "—"],
              ["Source", lead.source],
              ["Territory", lead.territory],
              ["Budget", lead.budgetIndication ?? "—"],
              [
                "Project area",
                lead.areaSqft ? `${lead.areaSqft.toLocaleString()} sq ft` : "—",
              ],
              ["Owner", owner],
              ["Signed", lead.signed ? "Yes" : "No"],
            ].map(([k, v]) => (
              <div key={k} className="border-t border-line pt-3">
                <dt className="label text-fg-muted">{k}</dt>
                <dd className="metric mt-1 text-[13px]">{v}</dd>
              </div>
            ))}
          </dl>

          {lead.notes && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="label text-fg-muted">Notes</p>
              <p className="label mt-1 text-fg">{lead.notes}</p>
            </div>
          )}

          <div className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
            <Field label="Qualification">
              <select
                className={inputClass}
                value={lead.qualification}
                onChange={(e) =>
                  qualifyLead(lead.id, e.target.value as Qualification)
                }
              >
                {(["Unqualified", "Hot", "Warm", "Cold"] as Qualification[]).map(
                  (q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Assign advisor">
              <select
                className={inputClass}
                value={lead.assignedAdvisorId ?? ""}
                onChange={(e) => assignLead(lead.id, e.target.value)}
              >
                <option value="">— Unassigned —</option>
                {[...growth, ...acquisition].map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                logFollowUp(lead.id);
                setToast("Follow-up logged.");
              }}
            >
              Log follow-up
            </Button>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <Field label="Hand to Acquisition">
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <select
                  className={inputClass}
                  value={acqAdvisor}
                  onChange={(e) => setAcqAdvisor(e.target.value)}
                >
                  {acquisition.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => {
                    handoffToAcquisition(lead.id, acqAdvisor);
                    setToast("Handed to Acquisition.");
                  }}
                >
                  Handoff
                </Button>
              </div>
            </Field>
          </div>

          {toast && (
            <p className="label mt-4 border border-line px-3 py-2 text-fg-muted">
              {toast}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
            <Link href={`/consultation?lead=${lead.id}`}>
              <Button variant="secondary">Consultation</Button>
            </Link>
            <Link href={`/company-profile?lead=${lead.id}`}>
              <Button variant="secondary">Profile Generator</Button>
            </Link>
            <Link href={`/proposals?lead=${lead.id}`}>
              <Button variant="secondary">Fee Configurator</Button>
            </Link>
          </div>
        </div>

        <footer className="flex shrink-0 gap-2 border-t border-line px-6 py-4">
          <Button className="flex-1" onClick={() => onEdit(lead)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit lead
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </aside>
    </div>
  );
}
