"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Field,
  PageHeader,
  Panel,
  inputClass,
} from "@/components/ui";
import { SuspenseWrap } from "@/components/SuspenseWrap";
import { usePortal } from "@/lib/store";
import type { Archetype, ProjectType } from "@/lib/types";

const ARCHETYPES: Archetype[] = [
  "The Visionary",
  "The Controller",
  "The Delegator",
  "The Status Client",
  "The Legacy Builder",
];

export default function ConsultationPage() {
  return (
    <SuspenseWrap>
      <ConsultationInner />
    </SuspenseWrap>
  );
}

function ConsultationInner() {
  const search = useSearchParams();
  const { leads, consultations, saveConsultation } = usePortal();

  const leadId = search.get("lead") ?? leads[0]?.id ?? "";
  const lead = leads.find((l) => l.id === leadId);
  const existing = consultations[leadId];

  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("residential");
  const [decisionMaker, setDecisionMaker] = useState("");
  const [archetype, setArchetype] = useState<Archetype | "">("");
  const [familyNames, setFamilyNames] = useState("");
  const [preferences, setPreferences] = useState("");
  const [summary, setSummary] = useState("");
  const [sqft, setSqft] = useState(4500);
  const [propertyState, setPropertyState] = useState("");
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const c = consultations[lead.id];
    setBudgetRange(c?.budgetRange ?? lead.budgetIndication ?? "");
    setTimeline(c?.timeline ?? "");
    setProjectType(c?.projectType ?? lead.projectType);
    setDecisionMaker(c?.decisionMaker ?? "");
    setArchetype(c?.archetype ?? "");
    setFamilyNames(c?.familyNames ?? lead.name);
    setPreferences(c?.preferences ?? "");
    setSummary(c?.summary ?? "");
    setSqft(c?.sqft ?? 4500);
    setPropertyState(c?.propertyState ?? "");
    setLocation(c?.location ?? lead.location);
    setSaved(false);
  }, [lead, consultations]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!lead) return;
    saveConsultation({
      leadId: lead.id,
      budgetRange,
      timeline,
      projectType,
      decisionMaker,
      archetype: archetype || undefined,
      familyNames,
      preferences,
      summary,
      sqft,
      propertyState,
      location,
      completedAt: new Date().toISOString(),
    });
    setSaved(true);
  }

  return (
    <div>
      <PageHeader
        eyebrow="02 · Customer Advisor — Acquisition"
        title="Consultation Capture"
        description="Four discovery points for this sample family — budget, timeline, project type, decision-maker — plus archetype and site details that feed Profile and Proposal."
      />

      {lead && (
        <p className="label mb-6 animate-rise text-fg-muted">
          Working with <span className="text-fg">{lead.name}</span>
        </p>
      )}

      {lead && (
        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="First five minutes" className="animate-rise delay-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Budget range *">
                <input
                  className={inputClass}
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  required
                  placeholder="e.g. ₹1.5–2 Cr total"
                />
              </Field>
              <Field label="Timeline *">
                <input
                  className={inputClass}
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  required
                  placeholder="e.g. Move-in Diwali 2027"
                />
              </Field>
              <Field label="Project type *">
                <select
                  className={inputClass}
                  value={projectType}
                  onChange={(e) =>
                    setProjectType(e.target.value as ProjectType)
                  }
                >
                  {(
                    [
                      "residential",
                      "corporate",
                      "commercial",
                      "hospitality",
                    ] as ProjectType[]
                  ).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Decision-maker *">
                <input
                  className={inputClass}
                  value={decisionMaker}
                  onChange={(e) => setDecisionMaker(e.target.value)}
                  required
                  placeholder="Who signs?"
                />
              </Field>
            </div>

            <div className="mt-5">
              <p className="label mb-2 text-fg-muted">
                Client archetype (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                {ARCHETYPES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      setArchetype((prev) => (prev === a ? "" : a))
                    }
                    className={
                      archetype === a
                        ? "bg-accent px-3 py-1.5 font-body text-[12px] font-light text-accent-fg"
                        : "border border-line px-3 py-1.5 font-body text-[12px] font-light text-fg-muted hover:border-line-strong hover:text-fg"
                    }
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Family names">
                <input
                  className={inputClass}
                  value={familyNames}
                  onChange={(e) => setFamilyNames(e.target.value)}
                />
              </Field>
              <Field label="Preferences noted">
                <textarea
                  className={`${inputClass} min-h-[80px]`}
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                />
              </Field>
              <Field label="Consultation summary">
                <textarea
                  className={`${inputClass} min-h-[100px]`}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                />
              </Field>
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Site / project" className="animate-rise delay-2">
              <div className="space-y-4">
                <Field label="Location">
                  <input
                    className={inputClass}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </Field>
                <Field label="Approximate sqft">
                  <input
                    type="number"
                    className={inputClass}
                    value={sqft}
                    onChange={(e) => setSqft(Number(e.target.value))}
                    min={500}
                  />
                </Field>
                <Field label="Current state of property">
                  <input
                    className={inputClass}
                    value={propertyState}
                    onChange={(e) => setPropertyState(e.target.value)}
                    placeholder="Bare shell / occupied / renovation…"
                  />
                </Field>
              </div>
            </Panel>

            <Panel className="animate-rise delay-3">
              <p className="label text-fg-muted">
                Everything captured here flows into Company Profile and Fee
                Proposal — no re-entry.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit">
                  {existing ? "Update consultation" : "Save consultation"}
                </Button>
                {saved && (
                  <>
                    <Link href={`/company-profile?lead=${leadId}`}>
                      <Button variant="secondary" type="button">
                        Build Profile
                      </Button>
                    </Link>
                    <Link href={`/proposals?lead=${leadId}`}>
                      <Button variant="secondary" type="button">
                        Build Proposal
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              {saved && (
                <p className="label mt-3 text-fg">
                  Saved to this family’s record.
                </p>
              )}
            </Panel>
          </div>
        </form>
      )}
    </div>
  );
}
