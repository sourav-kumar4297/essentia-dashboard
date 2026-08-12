"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import {
  Button,
  Field,
  PageHeader,
  Panel,
  inputClass,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import {
  PROPOSAL_STORAGE_KEY,
  FEE_PROJECT_TYPES,
  calcProposal,
  createBlankCommercialTemplate,
  createTemplateForType,
  formatINR,
  type FeeProjectType,
  type FeeProposalDoc,
  type ProposalServiceLine,
} from "@/lib/proposal-template";
import { clsx } from "clsx";

function loadSaved(): FeeProposalDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROPOSAL_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as FeeProposalDoc[];
    return list.filter(
      (d) => d && d.projectType && Array.isArray(d.services),
    );
  } catch {
    return [];
  }
}

function persistAll(list: FeeProposalDoc[]) {
  localStorage.setItem(PROPOSAL_STORAGE_KEY, JSON.stringify(list));
}

export default function ProposalsPage() {
  const { theme } = useTheme();
  const logoSrc = theme === "light" ? "/logo-espresso.png" : "/logo-white.png";
  const printLogo = "/logo-espresso.png";

  const [doc, setDoc] = useState<FeeProposalDoc>(() =>
    createTemplateForType("residence"),
  );
  const [saved, setSaved] = useState<FeeProposalDoc[]>([]);
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    setSaved(loadSaved());
  }, []);

  const calc = useMemo(() => calcProposal(doc), [doc]);

  function selectProjectType(type: FeeProjectType) {
    if (type === doc.projectType) return;
    setDoc(createTemplateForType(type));
    const label =
      FEE_PROJECT_TYPES.find((t) => t.id === type)?.label ?? type;
    setToast(`Loaded ${label} proposal template.`);
  }

  function patch(partial: Partial<FeeProposalDoc>) {
    setDoc((d) => ({ ...d, ...partial, updatedAt: new Date().toISOString() }));
  }

  function updateService(id: string, partial: Partial<ProposalServiceLine>) {
    setDoc((d) => ({
      ...d,
      updatedAt: new Date().toISOString(),
      services: d.services.map((s) =>
        s.id === id ? { ...s, ...partial } : s,
      ),
    }));
  }

  function applyAreaToAll(area: number) {
    setDoc((d) => ({
      ...d,
      updatedAt: new Date().toISOString(),
      officeAreaLabel: `${area.toLocaleString("en-IN")} sq.ft.`,
      services: d.services.map((s) => ({ ...s, areaSqft: area })),
    }));
  }

  function saveDraft() {
    const next = [...saved.filter((s) => s.id !== doc.id), { ...doc }];
    next.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    setSaved(next);
    persistAll(next);
    setToast("Proposal saved on this browser.");
  }

  function loadDraft(id: string) {
    const found = saved.find((s) => s.id === id);
    if (found) {
      setDoc(found);
      setToast("Draft loaded.");
      setTab("edit");
    }
  }

  function deleteDraft(id: string) {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    persistAll(next);
    setToast("Draft deleted.");
  }

  function addService() {
    const area = doc.services[0]?.areaSqft ?? 10000;
    setDoc((d) => ({
      ...d,
      services: [
        ...d.services,
        {
          id: `svc_${Math.random().toString(36).slice(2, 9)}`,
          name: "New service line",
          description: "Describe the scope for this line.",
          enabled: true,
          areaSqft: area,
          standardRate: 200,
          privilegedRate: 100,
        },
      ],
    }));
  }

  return (
    <div className="w-full min-w-0">
      <PageHeader
        eyebrow="Tools"
        title="Fee Configurator"
        description="Select a project type (as on essentiaenvironments.com/projects), then edit the proposal — rates, privilege, milestones, images — and print to PDF."
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Button
              variant={tab === "edit" ? "primary" : "secondary"}
              onClick={() => setTab("edit")}
            >
              Edit
            </Button>
            <Button
              variant={tab === "preview" ? "primary" : "secondary"}
              onClick={() => setTab("preview")}
            >
              Preview
            </Button>
            <Button variant="secondary" onClick={saveDraft}>
              <Save className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
              Save draft
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
              Print / PDF
            </Button>
          </div>
        }
      />

      {toast && (
        <p className="no-print mb-4 border border-line bg-surface px-3 py-2 label text-fg">
          {toast}
          <button
            type="button"
            className="ml-3 text-fg-muted hover:text-fg"
            onClick={() => setToast("")}
          >
            Dismiss
          </button>
        </p>
      )}

      <div className="no-print mb-6 animate-rise">
        <p className="label mb-2 text-fg-muted">Project type</p>
        <p className="heading mb-3 text-[18px] italic text-fg-muted">
          spectacular structural creations
        </p>
        <div className="flex flex-wrap gap-2 border-b border-line pb-3">
          {FEE_PROJECT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectProjectType(t.id)}
              className={clsx(
                "label border px-3 py-2 lowercase tracking-[0.04em] transition",
                doc.projectType === t.id
                  ? "border-fg bg-surface-hover text-fg"
                  : "border-transparent text-fg-muted hover:border-line hover:text-fg",
              )}
            >
              {t.short}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setDoc(createTemplateForType(doc.projectType));
              setToast("Reset to sample template for this type.");
            }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
            Reset sample
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDoc(createBlankCommercialTemplate());
              setToast("Started blank corporate proposal.");
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
            New blank
          </Button>
        </div>
      </div>

      <div
        className={clsx(
          "grid gap-6",
          tab === "edit" ? "xl:grid-cols-[1fr_1.05fr]" : "",
        )}
      >
        {tab === "edit" && (
          <div className="no-print space-y-5">
            <Panel title="Client & cover">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Client name">
                  <input
                    className={inputClass}
                    value={doc.clientName}
                    onChange={(e) => patch({ clientName: e.target.value })}
                  />
                </Field>
                <Field label="Company">
                  <input
                    className={inputClass}
                    value={doc.clientCompany}
                    onChange={(e) => patch({ clientCompany: e.target.value })}
                  />
                </Field>
                <Field label="Point of contact">
                  <input
                    className={inputClass}
                    value={doc.pointOfContact}
                    onChange={(e) => patch({ pointOfContact: e.target.value })}
                  />
                </Field>
                <Field label="Referred by">
                  <input
                    className={inputClass}
                    value={doc.referredBy}
                    onChange={(e) => patch({ referredBy: e.target.value })}
                  />
                </Field>
                <Field label="Office / project address">
                  <input
                    className={inputClass}
                    value={doc.officeAddress}
                    onChange={(e) => patch({ officeAddress: e.target.value })}
                  />
                </Field>
                <Field label="Date label">
                  <input
                    className={inputClass}
                    value={doc.dateLabel}
                    onChange={(e) => patch({ dateLabel: e.target.value })}
                  />
                </Field>
                <Field label="Cover eyebrow">
                  <input
                    className={inputClass}
                    value={doc.eyebrow}
                    onChange={(e) => patch({ eyebrow: e.target.value })}
                  />
                </Field>
                <Field label="Prepared by (advisor)">
                  <input
                    className={inputClass}
                    value={doc.preparedByName}
                    onChange={(e) => patch({ preparedByName: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Field label="Apply area (sq.ft.) to all service lines">
                  <input
                    type="number"
                    className={inputClass}
                    min={100}
                    defaultValue={doc.services[0]?.areaSqft ?? 10000}
                    onBlur={(e) => {
                      const n = Number(e.target.value);
                      if (n > 0) applyAreaToAll(n);
                    }}
                  />
                </Field>
                <label className="flex items-end gap-2 pb-2">
                  <input
                    type="checkbox"
                    checked={doc.usePrivileged}
                    onChange={(e) => patch({ usePrivileged: e.target.checked })}
                  />
                  <span className="label text-fg">Use privileged rates</span>
                </label>
              </div>
            </Panel>

            <Panel title="Design investment lines">
              <div className="space-y-4">
                {doc.services.map((s) => (
                  <div key={s.id} className="border border-line p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={(e) =>
                            updateService(s.id, { enabled: e.target.checked })
                          }
                        />
                        <span className="label text-fg">Include</span>
                      </label>
                      <button
                        type="button"
                        className="text-fg-dim hover:text-error"
                        onClick={() =>
                          setDoc((d) => ({
                            ...d,
                            services: d.services.filter((x) => x.id !== s.id),
                          }))
                        }
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                    <Field label="Service name">
                      <input
                        className={inputClass}
                        value={s.name}
                        onChange={(e) =>
                          updateService(s.id, { name: e.target.value })
                        }
                      />
                    </Field>
                    <div className="mt-2">
                      <Field label="Description">
                        <textarea
                          rows={3}
                          className={clsx(inputClass, "resize-none")}
                          value={s.description}
                          onChange={(e) =>
                            updateService(s.id, {
                              description: e.target.value,
                            })
                          }
                        />
                      </Field>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <Field label="Area sq.ft.">
                        <input
                          type="number"
                          className={inputClass}
                          value={s.areaSqft}
                          onChange={(e) =>
                            updateService(s.id, {
                              areaSqft: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </Field>
                      <Field label="Standard ₹/sq.ft.">
                        <input
                          type="number"
                          className={inputClass}
                          value={s.standardRate}
                          onChange={(e) =>
                            updateService(s.id, {
                              standardRate: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </Field>
                      <Field label="Privileged ₹/sq.ft.">
                        <input
                          type="number"
                          className={inputClass}
                          value={s.privilegedRate}
                          onChange={(e) =>
                            updateService(s.id, {
                              privilegedRate: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </Field>
                    </div>
                    <p className="metric mt-2 text-fg-muted">
                      Line total:{" "}
                      <span className="text-fg">
                        {formatINR(
                          s.areaSqft *
                            (doc.usePrivileged
                              ? s.privilegedRate
                              : s.standardRate),
                        )}
                      </span>
                    </p>
                  </div>
                ))}
                <Button variant="secondary" onClick={addService}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                  Add service line
                </Button>
              </div>

              <div className="mt-5 border border-line bg-bg px-4 py-4">
                <p className="label text-fg-muted">Live totals</p>
                <p className="heading mt-1 text-[28px]">
                  {formatINR(calc.total)}
                </p>
                <p className="metric mt-1 text-fg-dim">
                  Standard {formatINR(calc.standardTotal)}
                  {calc.savings > 0
                    ? ` · Save ${formatINR(calc.savings)}`
                    : ""}
                </p>
              </div>
            </Panel>

            <Panel title="Privilege note">
              <Field label="Badge">
                <input
                  className={inputClass}
                  value={doc.privilegeBadge}
                  onChange={(e) => patch({ privilegeBadge: e.target.value })}
                />
              </Field>
              <div className="mt-2">
                <Field label="Title">
                  <input
                    className={inputClass}
                    value={doc.privilegeTitle}
                    onChange={(e) => patch({ privilegeTitle: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-2">
                <Field label="Body">
                  <textarea
                    rows={4}
                    className={clsx(inputClass, "resize-none")}
                    value={doc.privilegeBody}
                    onChange={(e) => patch({ privilegeBody: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-2">
                <Field label="Validity (days)">
                  <input
                    type="number"
                    className={inputClass}
                    value={doc.privilegeValidityDays}
                    onChange={(e) =>
                      patch({
                        privilegeValidityDays: Number(e.target.value) || 30,
                      })
                    }
                  />
                </Field>
              </div>
            </Panel>

            <Panel title="Narrative sections">
              <Field label="Note — lead">
                <textarea
                  rows={2}
                  className={clsx(inputClass, "resize-none")}
                  value={doc.noteLead}
                  onChange={(e) => patch({ noteLead: e.target.value })}
                />
              </Field>
              <div className="mt-2">
                <Field label="Note — body">
                  <textarea
                    rows={5}
                    className={clsx(inputClass, "resize-none")}
                    value={doc.noteBody}
                    onChange={(e) => patch({ noteBody: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-2">
                <Field label="Quote">
                  <textarea
                    rows={3}
                    className={clsx(inputClass, "resize-none")}
                    value={doc.quoteText}
                    onChange={(e) => patch({ quoteText: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-2">
                <Field label="Project body">
                  <textarea
                    rows={5}
                    className={clsx(inputClass, "resize-none")}
                    value={doc.projectBody}
                    onChange={(e) => patch({ projectBody: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-2">
                <Field label="Next steps body">
                  <textarea
                    rows={4}
                    className={clsx(inputClass, "resize-none")}
                    value={doc.nextBody}
                    onChange={(e) => patch({ nextBody: e.target.value })}
                  />
                </Field>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Field label="Included renders">
                  <input
                    type="number"
                    className={inputClass}
                    value={doc.includedRenders}
                    onChange={(e) =>
                      patch({ includedRenders: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
                <Field label="Extra render ₹">
                  <input
                    type="number"
                    className={inputClass}
                    value={doc.extraRenderRate}
                    onChange={(e) =>
                      patch({ extraRenderRate: Number(e.target.value) || 0 })
                    }
                  />
                </Field>
              </div>
            </Panel>

            <Panel title="Payment milestones (%)">
              <ul className="space-y-3">
                {doc.milestones.map((m, idx) => (
                  <li key={m.id} className="grid gap-2 border border-line p-3 sm:grid-cols-4">
                    <Field label="%">
                      <input
                        type="number"
                        className={inputClass}
                        value={m.percent}
                        onChange={(e) => {
                          const percent = Number(e.target.value) || 0;
                          setDoc((d) => ({
                            ...d,
                            milestones: d.milestones.map((x, i) =>
                              i === idx ? { ...x, percent } : x,
                            ),
                          }));
                        }}
                      />
                    </Field>
                    <div className="sm:col-span-3">
                      <Field label="Label">
                        <input
                          className={inputClass}
                          value={m.label}
                          onChange={(e) => {
                            const label = e.target.value;
                            setDoc((d) => ({
                              ...d,
                              milestones: d.milestones.map((x, i) =>
                                i === idx ? { ...x, label } : x,
                              ),
                            }));
                          }}
                        />
                      </Field>
                      <div className="mt-2">
                        <Field label="Trigger">
                          <input
                            className={inputClass}
                            value={m.trigger}
                            onChange={(e) => {
                              const trigger = e.target.value;
                              setDoc((d) => ({
                                ...d,
                                milestones: d.milestones.map((x, i) =>
                                  i === idx ? { ...x, trigger } : x,
                                ),
                              }));
                            }}
                          />
                        </Field>
                      </div>
                      <p className="metric mt-1 text-fg-dim">
                        {formatINR(Math.round((calc.total * m.percent) / 100))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="metric mt-3 text-fg-muted">
                Milestone % sum:{" "}
                {doc.milestones.reduce((a, m) => a + m.percent, 0)}%
              </p>
            </Panel>

            {saved.length > 0 && (
              <Panel title="Saved drafts (this browser)">
                <ul className="divide-y divide-line">
                  {saved.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <button
                        type="button"
                        className="label text-left text-fg hover:underline"
                        onClick={() => loadDraft(s.id)}
                      >
                        {s.clientCompany || s.clientName || "Untitled"} ·{" "}
                        {new Date(s.updatedAt).toLocaleString()}
                      </button>
                      <button
                        type="button"
                        className="text-fg-dim hover:text-error"
                        onClick={() => deleteDraft(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        )}

        <div className={clsx(tab === "edit" ? "" : "mx-auto w-full max-w-4xl")}>
          <ProposalPreview
            doc={doc}
            calc={calc}
            logoSrc={tab === "preview" ? logoSrc : printLogo}
          />
        </div>
      </div>
    </div>
  );
}

function ProposalPreview({
  doc,
  calc,
  logoSrc,
}: {
  doc: FeeProposalDoc;
  calc: ReturnType<typeof calcProposal>;
  logoSrc: string;
}) {
  return (
    <article className="proposal-print border border-line bg-white text-[#111] shadow-sm">
      {/* Cover */}
      <section className="border-b border-black/10 px-8 py-10 md:px-12">
        <div className="mb-10 flex items-start justify-between gap-4">
          <Image src={logoSrc} alt="essentia" width={140} height={34} />
          <p className="text-right font-body text-[10px] uppercase tracking-[0.18em] text-black/45">
            {doc.confidentialLabel} · {doc.dateLabel}
          </p>
        </div>
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-black/50">
          {doc.eyebrow}
        </p>
        <h1 className="mt-4 font-body text-[34px] font-light leading-[1.15] md:text-[42px]">
          {doc.heroHeadline}
        </h1>
        <p className="mt-4 text-sm text-black/60">
          Prepared for{" "}
          <span className="text-black">
            {[doc.clientName, doc.clientCompany].filter(Boolean).join(" · ") ||
              "Client"}
          </span>
        </p>
        <p className="mt-1 text-sm text-black/55">{doc.officeAddress}</p>
        <h2 className="mt-8 font-body text-[18px] font-light text-black/70">
          {doc.title}
        </h2>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            [
              "CLIENT",
              [doc.clientName, doc.clientCompany].filter(Boolean).join("\n") ||
                "—",
            ],
            [
              "POINT OF CONTACT",
              [
                doc.pointOfContact,
                doc.advisorPhone,
                doc.advisorEmail,
              ]
                .filter(Boolean)
                .join("\n") || "—",
            ],
            ["PROJECT AREA", `${doc.officeAreaLabel}\n${doc.officeAddress}`],
            ["REFERRED BY", doc.referredBy || "—"],
          ].map(([k, v]) => (
            <div key={k} className="border-t border-black/10 pt-3">
              <dt className="font-body text-[10px] uppercase tracking-[0.16em] text-black/45">
                {k}
              </dt>
              <dd className="mt-1 whitespace-pre-line text-sm text-black/85">
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-xs text-black/45">{doc.partnerLine}</p>
      </section>

      {/* Selected work images */}
      {doc.images?.length > 0 && (
        <section className="border-b border-black/10 px-8 py-10 md:px-12">
          <p className="font-body text-[11px] uppercase tracking-[0.16em] text-black/45">
            Selected work
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {doc.images.map((img) => (
              <figure key={img.src} className="overflow-hidden bg-[#f3f3f1]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.caption}
                  className="aspect-[4/3] w-full object-cover"
                />
                <figcaption className="px-3 py-3 text-[12px] leading-relaxed text-black/60">
                  {img.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Note */}
      <section className="border-b border-black/10 px-8 py-10 md:px-12">
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-black/45">
          {doc.noteHeading}
        </p>
        <p className="mt-4 text-lg font-light leading-snug text-black">
          {doc.noteLead}
        </p>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-black/70">
          {doc.noteBody}
        </p>
        <blockquote className="mt-8 border-l-2 border-black/30 pl-4">
          <p className="font-body text-[10px] uppercase tracking-[0.14em] text-black/45">
            {doc.quoteAttribution}
          </p>
          <p className="mt-2 text-sm italic leading-relaxed text-black/80">
            “{doc.quoteText}”
          </p>
        </blockquote>
      </section>

      {/* Project */}
      <section className="border-b border-black/10 px-8 py-10 md:px-12">
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-black/45">
          {doc.projectHeading}
        </p>
        <p className="mt-2 text-base text-black/80">{doc.projectSub}</p>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-black/70">
          {doc.projectBody}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [doc.officeAreaLabel || "—", "PROJECT AREA"],
            [doc.officeAddress.split("·")[0]?.trim() || "—", "LOCATION"],
            [String(calc.lines.length), "INTEGRATED SERVICES"],
            ["26", "YEARS OF PRACTICE"],
          ].map(([v, l]) => (
            <div key={l} className="border border-black/10 px-3 py-3">
              <p className="text-sm font-medium text-black">{v}</p>
              <p className="mt-1 font-body text-[10px] uppercase tracking-[0.14em] text-black/45">
                {l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Concerns */}
      <section className="border-b border-black/10 px-8 py-10 md:px-12">
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-black/45">
          {doc.concernsHeading}
        </p>
        <p className="mt-2 text-base text-black/80">{doc.concernsSub}</p>
        <ul className="mt-6 space-y-5">
          {doc.concerns.map((c) => (
            <li key={c.id} className="border-t border-black/10 pt-4">
              <p className="text-sm font-medium text-black">{c.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-black/65">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Investment */}
      <section className="border-b border-black/10 px-8 py-10 md:px-12">
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-black/45">
          {doc.investmentHeading}
        </p>
        <p className="mt-2 text-base text-black/80">{doc.investmentSub}</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/15 font-body text-[10px] uppercase tracking-[0.14em] text-black/45">
                <th className="py-2 pr-3">Service</th>
                <th className="py-2 pr-3">Area</th>
                <th className="py-2 pr-3">Standard</th>
                <th className="py-2 pr-3">Privileged</th>
                <th className="py-2 text-right">Your investment</th>
              </tr>
            </thead>
            <tbody>
              {calc.lines.map((line) => (
                <tr key={line.id} className="border-b border-black/10 align-top">
                  <td className="py-4 pr-3">
                    <p className="font-medium text-black">{line.name}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-black/55">
                      {line.description}
                    </p>
                  </td>
                  <td className="py-4 pr-3 whitespace-nowrap text-black/70">
                    {line.areaSqft.toLocaleString("en-IN")} sq.ft.
                  </td>
                  <td className="py-4 pr-3 whitespace-nowrap text-black/70">
                    ₹{line.standardRate}/sq.ft.
                  </td>
                  <td className="py-4 pr-3 whitespace-nowrap text-black/70">
                    ₹{line.privilegedRate}/sq.ft.
                  </td>
                  <td className="py-4 text-right font-medium text-black">
                    {formatINR(line.investment)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {doc.usePrivileged && (
          <div className="mt-6 border border-black/15 bg-[#f7f7f5] px-5 py-5">
            <p className="font-body text-[10px] uppercase tracking-[0.16em] text-black/50">
              ✦ {doc.privilegeBadge}
            </p>
            <p className="mt-2 text-sm font-medium text-black">
              {doc.privilegeTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-black/65">
              {doc.privilegeBody}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-body text-[10px] uppercase tracking-[0.16em] text-black/45">
              {doc.usePrivileged
                ? "YOUR PRIVILEGED INVESTMENT"
                : "YOUR DESIGN INVESTMENT"}
            </p>
            <p className="mt-1 font-body text-[36px] font-light tracking-tight text-black">
              {formatINR(calc.total)}
            </p>
            {doc.usePrivileged && calc.savings > 0 && (
              <p className="mt-1 text-sm text-black/55">
                You save {formatINR(calc.savings)} · Valid{" "}
                {doc.privilegeValidityDays} days · Plus applicable taxes
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-body text-[10px] uppercase tracking-[0.16em] text-black/45">
              STANDARD DESIGN FEE
            </p>
            <p className="mt-1 text-xl text-black/70">
              {formatINR(calc.standardTotal)}
            </p>
            <p className="mt-1 text-xs text-black/45">
              At published rates · {doc.officeAreaLabel}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {doc.inclusions.map((inc) => (
            <div key={inc.id} className="border border-black/10 px-4 py-4">
              <p className="text-sm font-medium text-black">✦ {inc.title}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-black/60">
                {inc.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 border border-black/10 px-4 py-4">
          <p className="font-body text-[10px] uppercase tracking-[0.14em] text-black/45">
            A note on 3D renders
          </p>
          <p className="mt-2 text-sm leading-relaxed text-black/65">
            {doc.includedRenders} renders are included. {doc.rendersNote} Extra
            renders: {formatINR(doc.extraRenderRate)} each.
          </p>
        </div>
      </section>

      {/* Payments */}
      <section className="border-b border-black/10 px-8 py-10 md:px-12">
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-black/45">
          {doc.paymentHeading}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-black/65">
          {doc.paymentIntro}
        </p>
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/15 font-body text-[10px] uppercase tracking-[0.14em] text-black/45">
              <th className="py-2">%</th>
              <th className="py-2">Milestone</th>
              <th className="py-2">Trigger</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {calc.milestoneAmounts.map((m) => (
              <tr key={m.id} className="border-b border-black/10 align-top">
                <td className="py-3 pr-2 font-medium">{m.percent}%</td>
                <td className="py-3 pr-2">{m.label}</td>
                <td className="py-3 pr-2 text-black/60">{m.trigger}</td>
                <td className="py-3 text-right font-medium">
                  {formatINR(m.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-5 text-xs leading-relaxed text-black/55">
          FEE PROTECTION — {doc.feeProtection}
        </p>
      </section>

      {/* Terms */}
      <section className="border-b border-black/10 px-8 py-10 md:px-12">
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-black/45">
          {doc.termsHeading}
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {doc.terms.map((t) => (
            <li key={t.id} className="border border-black/10 px-4 py-4">
              <p className="text-sm font-medium text-black">◈ {t.title}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-black/60">
                {t.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Close */}
      <section className="px-8 py-10 md:px-12">
        <p className="font-body text-[11px] uppercase tracking-[0.16em] text-black/45">
          {doc.nextHeading}
        </p>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-black/70">
          {doc.nextBody}
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div className="border-t border-black/20 pt-4">
            <p className="font-body text-[10px] uppercase tracking-[0.14em] text-black/45">
              {doc.preparedByRole}
            </p>
            <p className="mt-2 text-sm font-medium">{doc.preparedByName}</p>
            <p className="mt-8 text-xs text-black/40">Signature & Date</p>
          </div>
          <div className="border-t border-black/20 pt-4">
            <p className="font-body text-[10px] uppercase tracking-[0.14em] text-black/45">
              {doc.acceptedByRole}
            </p>
            <p className="mt-2 text-sm font-medium">
              {doc.acceptedByName || doc.clientName}
            </p>
            <p className="mt-8 text-xs text-black/40">Signature, Date & Place</p>
          </div>
        </div>
        <footer className="mt-12 flex items-end justify-between border-t border-black/10 pt-5">
          <div>
            <Image src={logoSrc} alt="essentia" width={110} height={26} />
            <p className="mt-2 text-xs text-black/45">{doc.partnerLine}</p>
          </div>
          <p className="font-body text-[11px] uppercase tracking-[0.14em] text-black/55">
            {doc.footerTagline}
          </p>
        </footer>
      </section>
    </article>
  );
}
