"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { usePortal } from "@/lib/store";
import type {
  BusinessUnit,
  Lead,
  LeadStage,
  ProjectType,
  Qualification,
  SourceChannel,
  Territory,
} from "@/lib/types";
import { CHANNEL_ORDER } from "@/lib/types";
import { stageLabel } from "@/lib/sla";
import { clsx } from "clsx";

const TERRITORIES: Territory[] = ["Delhi", "Gurugram", "Mumbai"];
const PROJECT_TYPES: ProjectType[] = [
  "residential",
  "corporate",
  "commercial",
  "hospitality",
];
const QUALIFICATIONS: { value: Qualification; activeClass: string }[] = [
  { value: "Hot", activeClass: "!border-[#e85d4c] !text-[#e85d4c] bg-[#e85d4c]/10" },
  { value: "Warm", activeClass: "!border-[#d4a017] !text-[#d4a017] bg-[#d4a017]/10" },
  { value: "Cold", activeClass: "!border-[#5b8def] !text-[#5b8def] bg-[#5b8def]/10" },
  { value: "Unqualified", activeClass: "!border-fg !text-fg bg-surface-hover" },
];
const STAGE_OPTIONS: LeadStage[] = [
  "new",
  "contacted",
  "qualified",
  "handed_to_acquisition",
  "consultation",
  "proposal_draft",
  "profile_sent",
  "proposal_sent",
  "accepted",
  "handed_to_engagement",
];
const BUDGET_RANGES = [
  "Under ₹25 L",
  "₹25 L – ₹50 L",
  "₹50 L – ₹1 Cr",
  "₹1 Cr – ₹3 Cr",
  "₹3 Cr+",
];

interface FormState {
  name: string;
  phone: string;
  email: string;
  businessUnit: BusinessUnit;
  source: SourceChannel;
  advisorId: string;
  territory: Territory;
  location: string;
  projectType: ProjectType;
  qualification: Qualification;
  stage: LeadStage;
  budgetIndication: string;
  areaSqft: string;
  notes: string;
}

function emptyForm(): FormState {
  return {
    name: "",
    phone: "",
    email: "",
    businessUnit: "EE",
    source: "Website",
    advisorId: "",
    territory: "Gurugram",
    location: "",
    projectType: "residential",
    qualification: "Unqualified",
    stage: "new",
    budgetIndication: "",
    areaSqft: "",
    notes: "",
  };
}

function formFromLead(lead: Lead): FormState {
  return {
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    businessUnit: lead.businessUnit,
    source: lead.source,
    advisorId: lead.assignedAdvisorId ?? "",
    territory: lead.territory,
    location: lead.location,
    projectType: lead.projectType,
    qualification: lead.qualification,
    stage: lead.stage,
    budgetIndication: lead.budgetIndication ?? "",
    areaSqft: lead.areaSqft ? String(lead.areaSqft) : "",
    notes: lead.notes ?? "",
  };
}

export function LeadFormPanel({
  open,
  lead,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** When provided the panel edits this lead; otherwise it creates a new one. */
  lead?: Lead | null;
  onClose: () => void;
  onSaved?: (leadId: string) => void;
}) {
  const { advisors, addLead, updateLead } = usePortal();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const editing = Boolean(lead);

  useEffect(() => {
    if (open) {
      setForm(lead ? formFromLead(lead) : emptyForm());
      setError("");
    }
  }, [open, lead]);

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

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Primary contact number is required.");
      return;
    }

    const patch = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      businessUnit: form.businessUnit,
      source: form.source,
      assignedAdvisorId: form.advisorId || null,
      territory: form.territory,
      location: form.location.trim() || form.territory,
      projectType: form.projectType,
      qualification: form.qualification,
      budgetIndication: form.budgetIndication || undefined,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : undefined,
      notes: form.notes.trim() || undefined,
    };

    if (lead) {
      const stagePatch = {
        stage: form.stage,
        ...(form.stage !== "new" && !lead.firstContactedAt
          ? { firstContactedAt: new Date().toISOString() }
          : {}),
        ...(form.stage === "accepted" || form.stage === "handed_to_engagement"
          ? { signed: true }
          : lead.signed &&
              form.stage !== "accepted" &&
              form.stage !== "handed_to_engagement"
            ? { signed: false }
            : {}),
      };
      updateLead(lead.id, { ...patch, ...stagePatch });
      onSaved?.(lead.id);
    } else {
      const id = addLead({
        ...patch,
        stage: "new",
        lastFollowUpAt: null,
        firstContactedAt: null,
        priorEngagement: false,
        crossSell: false,
        signed: false,
      });
      onSaved?.(id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-fade"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-line bg-bg animate-slide-right">
        <header className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
          <div>
            <p className="label tracking-[0.18em] text-fg-muted uppercase">
              {editing ? "Edit Lead" : "New Lead"}
            </p>
            <h2 className="heading mt-1 text-[22px]">
              {editing ? lead?.name : "Capture enquiry"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="border border-line p-2 text-fg-muted transition hover:border-line-strong hover:text-fg"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </header>

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <Field label="Business unit">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["EE", "Environments"],
                    ["EH", "Home"],
                  ] as const
                ).map(([bu, label]) => (
                  <button
                    key={bu}
                    type="button"
                    onClick={() => set("businessUnit", bu)}
                    className={clsx(
                      "label border px-3 py-2.5 transition",
                      form.businessUnit === bu
                        ? "border-fg bg-surface-hover text-fg"
                        : "border-line text-fg-muted hover:border-line-strong",
                    )}
                  >
                    {bu} · {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Client / organisation name *">
              <input
                className={clsx(
                  inputClass,
                  error && !form.name.trim() && "!border-error",
                )}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Mehra Residence"
                autoFocus
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primary contact *">
                <input
                  className={clsx(
                    inputClass,
                    error && !form.phone.trim() && "!border-error",
                  )}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+91 …"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@email.com"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lead source">
                <select
                  className={inputClass}
                  value={form.source}
                  onChange={(e) =>
                    set("source", e.target.value as SourceChannel)
                  }
                >
                  {CHANNEL_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Advisor">
                <select
                  className={inputClass}
                  value={form.advisorId}
                  onChange={(e) => set("advisorId", e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {advisors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Territory">
                <select
                  className={inputClass}
                  value={form.territory}
                  onChange={(e) => set("territory", e.target.value as Territory)}
                >
                  {TERRITORIES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <input
                  className={inputClass}
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Golf Course Road"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Project type">
                <select
                  className={inputClass}
                  value={form.projectType}
                  onChange={(e) =>
                    set("projectType", e.target.value as ProjectType)
                  }
                >
                  {PROJECT_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p[0].toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Project area (sq ft)">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.areaSqft}
                  onChange={(e) => set("areaSqft", e.target.value)}
                  placeholder="e.g. 4500"
                />
              </Field>
            </div>

            {editing && (
              <Field label="Stage">
                <select
                  className={inputClass}
                  value={form.stage}
                  onChange={(e) => set("stage", e.target.value as LeadStage)}
                >
                  {STAGE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {stageLabel(s)}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Type">
              <div className="grid grid-cols-2 gap-2">
                {QUALIFICATIONS.map(({ value, activeClass }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("qualification", value)}
                    className={clsx(
                      "label border px-3 py-2.5 uppercase tracking-[0.14em] transition",
                      form.qualification === value
                        ? activeClass
                        : "border-line text-fg-muted hover:border-line-strong",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Budget range">
              <select
                className={inputClass}
                value={form.budgetIndication}
                onChange={(e) => set("budgetIndication", e.target.value)}
              >
                <option value="">— Not shared —</option>
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notes">
              <textarea
                rows={3}
                className={clsx(inputClass, "resize-none")}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Context from the first conversation…"
              />
            </Field>

          </div>

          <footer className="shrink-0 border-t border-line px-6 py-4">
            {error && (
              <p className="label mb-3 border border-error/50 px-3 py-2 text-error">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editing ? "Save changes" : "Add lead"}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  );
}
