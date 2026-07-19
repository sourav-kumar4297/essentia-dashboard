"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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

export default function CompanyProfilePage() {
  return (
    <SuspenseWrap>
      <CompanyProfileInner />
    </SuspenseWrap>
  );
}

function CompanyProfileInner() {
  const search = useSearchParams();
  const { leads, consultations, saveProfile, markProfileSent, profiles } =
    usePortal();
  const { theme } = useTheme();
  const logoSrc = theme === "light" ? "/logo-espresso.png" : "/logo-white.png";
  const leadId = search.get("lead") ?? leads[0]?.id ?? "";
  const lead = leads.find((l) => l.id === leadId);
  const consultation = consultations[leadId];
  const [projectType, setProjectType] = useState<ProjectType>(
    consultation?.projectType ?? lead?.projectType ?? "residential",
  );
  const [notes, setNotes] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const voice = PROJECT_TYPE_VOICE[projectType];

  const existing = useMemo(
    () => profiles.find((p) => p.leadId === leadId),
    [profiles, leadId],
  );

  function generate() {
    if (!lead) return;
    const id = saveProfile({
      id: existing?.id,
      leadId,
      projectType,
      status: "draft",
      notes,
    });
    setProfileId(id);
    setToast("Draft ready for review — never auto-sent.");
  }

  function send(channel: "email" | "whatsapp") {
    const id = profileId ?? existing?.id;
    if (!id) {
      generate();
    }
    const pid = profileId ?? existing?.id;
    if (!pid) return;
    markProfileSent(pid);
    setToast(
      channel === "email"
        ? "Company Profile queued to email (demo)."
        : "Company Profile summary ready for WhatsApp (demo).",
    );
  }

  function downloadPdf() {
    window.print();
  }

  return (
    <div>
      <PageHeader
        eyebrow="03 · Acquisition"
        title="Company Profile"
        description="One sample family. Pick a project-type voice, review the draft, then send — never auto-send."
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="secondary" onClick={generate}>
              Generate draft
            </Button>
            <Button variant="secondary" onClick={downloadPdf}>
              Save PDF
            </Button>
            <Button onClick={() => send("email")}>Email</Button>
            <Button variant="secondary" onClick={() => send("whatsapp")}>
              WhatsApp
            </Button>
          </div>
        }
      />

      <p className="no-print mb-4 animate-rise text-sm text-fg-muted">
        Working with <strong className="text-fg">{lead?.name}</strong>
      </p>

      <div className="no-print mb-6 grid gap-4 sm:grid-cols-2 animate-rise delay-1">
        <Field label="Project-type variant">
          <select
            className={inputClass}
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as ProjectType)}
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
        <Field label="Advisor notes (internal)">
          <input
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tone tweaks before send"
          />
        </Field>
      </div>

      {toast && (
        <p className="no-print mb-4 rounded-sm border border-line bg-surface px-3 py-2 text-sm text-fg animate-fade">
          {toast}
        </p>
      )}

      <Panel className="animate-rise delay-1 overflow-hidden !p-0">
        <article className="bg-surface px-8 py-10 md:px-14 md:py-14" id="profile-preview">
          <header className="mb-10 flex items-end justify-between border-b border-line pb-6">
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
          <h2 className="heading mt-1 text-4xl md:text-5xl">
            {lead?.name ?? "—"}
          </h2>
          <p className="label mt-2 text-fg-muted">
            {consultation?.location ?? lead?.location} ·{" "}
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
            </div>
            <aside className="bg-accent px-5 py-5 text-accent-fg">
              <p className="font-body text-[10px] font-light uppercase tracking-[0.2em] opacity-60">
                Tone
              </p>
              <p className="mt-2 font-body text-[13px] font-light leading-relaxed opacity-90">
                {voice.tone}
              </p>
              <p className="mt-5 font-body text-[10px] font-light uppercase tracking-[0.2em] opacity-60">
                What we do
              </p>
              <ul className="mt-2 space-y-1 font-body text-[13px] font-light opacity-90">
                <li>01 / Design</li>
                <li>02 / Build</li>
                <li>03 / Furniture</li>
              </ul>
            </aside>
          </div>

          <section className="mt-10">
            <h3 className="heading text-2xl">Design. Build. Furniture.</h3>
            <p className="label mt-3 max-w-2xl text-fg-muted">
              Every project is conceived, executed, and crafted in-house —
              ensuring continuity, refinement, and a signature sense of timeless
              character. Founded in 1999, essentia environments brings design
              intelligence and bespoke craftsmanship within a single seamless
              framework.
            </p>
          </section>

          <footer className="mt-12 flex items-center justify-between border-t border-line pt-6">
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
    </div>
  );
}
