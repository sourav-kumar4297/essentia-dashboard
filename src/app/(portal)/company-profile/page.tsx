"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Download,
  Mail,
  MessageCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import {
  Button,
  Field,
  PageHeader,
  Panel,
  inputClass,
} from "@/components/ui";
import { SuspenseWrap } from "@/components/SuspenseWrap";
import { usePortal } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { PROJECT_TYPE_VOICE } from "@/lib/mock-data";
import type { ProjectType } from "@/lib/types";
import { clsx } from "clsx";

const PROJECT_TYPES: ProjectType[] = [
  "residential",
  "corporate",
  "commercial",
  "hospitality",
];

export default function CompanyProfilePage() {
  return (
    <SuspenseWrap>
      <CompanyProfileInner />
    </SuspenseWrap>
  );
}

function CompanyProfileInner() {
  const search = useSearchParams();
  const router = useRouter();
  const { leads, consultations, saveProfile, markProfileSent, profiles } =
    usePortal();
  const { theme } = useTheme();
  const logoSrc = theme === "light" ? "/logo-espresso.png" : "/logo-white.png";

  const leadId = search.get("lead") ?? leads[0]?.id ?? "";
  const lead = leads.find((l) => l.id === leadId) ?? null;
  const consultation = leadId ? consultations[leadId] : undefined;

  const existing = useMemo(
    () => profiles.find((p) => p.leadId === leadId),
    [profiles, leadId],
  );

  const [projectType, setProjectType] = useState<ProjectType>(
    existing?.projectType ??
      consultation?.projectType ??
      lead?.projectType ??
      "residential",
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [profileId, setProfileId] = useState<string | null>(
    existing?.id ?? null,
  );
  const [toast, setToast] = useState("");
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    setProjectType(
      existing?.projectType ??
        consultation?.projectType ??
        lead?.projectType ??
        "residential",
    );
    setNotes(existing?.notes ?? "");
    setProfileId(existing?.id ?? null);
  }, [leadId, existing, consultation, lead]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const voice = PROJECT_TYPE_VOICE[projectType];
  const status = existing?.status ?? (profileId ? "draft" : null);

  function selectLead(id: string) {
    router.replace(`/company-profile?lead=${id}`);
  }

  function generate() {
    if (!lead) {
      setToast("Select a lead first.");
      return;
    }
    const id = saveProfile({
      id: existing?.id,
      leadId,
      projectType,
      status: "draft",
      notes,
    });
    setProfileId(id);
    setPreviewKey((k) => k + 1);
    setToast("Draft ready for review — never auto-sent.");
  }

  function send(channel: "email" | "whatsapp") {
    if (!lead) {
      setToast("Select a lead first.");
      return;
    }
    let id = profileId ?? existing?.id;
    if (!id) {
      id = saveProfile({
        leadId,
        projectType,
        status: "draft",
        notes,
      });
      setProfileId(id);
    }
    markProfileSent(id);
    setToast(
      channel === "email"
        ? "Company Profile queued to email (demo)."
        : "Company Profile summary ready for WhatsApp (demo).",
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Tools"
        title="Profile Generator"
        description="Build a project-type voice profile, review the draft, then send — never auto-send."
      />

      {/* Controls */}
      <div className="no-print mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-rise">
        <Field label="Lead">
          <select
            className={inputClass}
            value={leadId}
            onChange={(e) => selectLead(e.target.value)}
          >
            {leads.length === 0 && <option value="">No leads</option>}
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} · {l.businessUnit}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Advisor notes (internal)">
          <input
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tone tweaks before send"
          />
        </Field>
        <div className="sm:col-span-2">
          <p className="label mb-1.5 block text-fg-muted">Project type</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROJECT_TYPES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProjectType(p);
                  setPreviewKey((k) => k + 1);
                }}
                className={clsx(
                  "label border px-2 py-2.5 capitalize transition",
                  projectType === p
                    ? "border-fg bg-surface-hover text-fg"
                    : "border-line text-fg-muted hover:border-line-strong hover:text-fg",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="no-print mb-4 flex flex-wrap items-center gap-2 animate-rise delay-1">
        <Button onClick={generate} disabled={!lead}>
          <RefreshCw className="h-3.5 w-3.5" />
          {status ? "Update draft" : "Generate draft"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => window.print()}
          disabled={!lead}
        >
          <Download className="h-3.5 w-3.5" />
          Save PDF
        </Button>
        <Button
          variant="secondary"
          onClick={() => send("email")}
          disabled={!lead}
        >
          <Mail className="h-3.5 w-3.5" />
          Email
        </Button>
        <Button
          variant="secondary"
          onClick={() => send("whatsapp")}
          disabled={!lead}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </Button>
        {status && (
          <span
            className={clsx(
              "label ml-auto border px-2.5 py-1.5 uppercase tracking-[0.14em]",
              status === "sent"
                ? "border-ok/40 text-ok"
                : "border-line text-fg-muted",
            )}
          >
            <Send className="mr-1.5 inline h-3 w-3" />
            {status === "sent" ? "Sent" : "Draft"}
          </span>
        )}
      </div>

      {toast && (
        <p className="no-print label mb-4 border border-line px-3 py-2 text-fg-muted animate-fade">
          {toast}
        </p>
      )}

      {!lead ? (
        <Panel>
          <p className="heading text-[18px]">No lead selected</p>
          <p className="label mt-1 text-fg-muted">
            Capture a lead first, then return here to generate a profile.
          </p>
        </Panel>
      ) : (
        <Panel className="overflow-hidden !p-0 animate-rise delay-1">
          <article
            key={previewKey}
            className="bg-surface px-6 py-8 animate-rise md:px-14 md:py-14"
            id="profile-preview"
          >
            <header className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5 md:mb-10 md:pb-6">
              <Image
                src={logoSrc}
                alt="essentia"
                width={160}
                height={38}
                className="object-contain"
              />
              <p className="label tracking-[0.18em] text-fg-muted uppercase">
                Company Profile · {projectType}
              </p>
            </header>

            <p className="label text-fg-muted">Prepared for</p>
            <h2 className="heading mt-1 text-[28px] leading-tight md:text-[40px]">
              {lead.name}
            </h2>
            <p className="label mt-2 text-fg-muted">
              {consultation?.location ?? lead.location} ·{" "}
              {consultation?.sqft
                ? `${consultation.sqft.toLocaleString("en-IN")} sqft`
                : "Site details pending"}
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_0.7fr]">
              <div>
                <p className="label tracking-[0.16em] text-fg-muted uppercase">
                  {voice.leadsWith}
                </p>
                <p className="label mt-4 text-[15px] leading-relaxed">
                  {voice.opening}
                </p>
                {consultation?.summary && (
                  <p className="label mt-4 border-l border-line-strong pl-4 italic text-fg-muted">
                    From our conversation: {consultation.summary}
                  </p>
                )}
                {notes.trim() && (
                  <p className="label mt-4 border border-dashed border-line px-3 py-2 text-fg-dim">
                    Advisor note: {notes}
                  </p>
                )}
              </div>
              <aside className="border border-line-strong bg-surface-hover px-5 py-5 text-fg">
                <p className="font-body text-[10px] font-light uppercase tracking-[0.2em] text-fg-muted">
                  Tone
                </p>
                <p className="mt-2 font-body text-[13px] font-light leading-relaxed">
                  {voice.tone}
                </p>
                <p className="mt-5 font-body text-[10px] font-light uppercase tracking-[0.2em] text-fg-muted">
                  What we do
                </p>
                <ul className="mt-2 space-y-1 font-body text-[13px] font-light">
                  <li>01 / Design</li>
                  <li>02 / Build</li>
                  <li>03 / Furniture</li>
                </ul>
                <p className="mt-5 font-body text-[10px] font-light uppercase tracking-[0.2em] text-fg-muted">
                  Lead
                </p>
                <p className="mt-2 font-body text-[13px] font-light">
                  {lead.businessUnit} · {lead.source} · {lead.territory}
                </p>
              </aside>
            </div>

            <section className="mt-10">
              <h3 className="heading text-[22px] md:text-2xl">
                Design. Build. Furniture.
              </h3>
              <p className="label mt-3 max-w-2xl text-fg-muted">
                Every project is conceived, executed, and crafted in-house —
                ensuring continuity, refinement, and a signature sense of
                timeless character. Founded in 1999, essentia environments
                brings design intelligence and bespoke craftsmanship within a
                single seamless framework.
              </p>
            </section>

            <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 md:mt-12">
              <Image
                src={logoSrc}
                alt="essentia"
                width={120}
                height={28}
                className="object-contain"
              />
              <p className="label text-fg-muted">Every client returns</p>
            </footer>
          </article>
        </Panel>
      )}
    </div>
  );
}
