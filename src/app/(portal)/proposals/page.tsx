"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
import {
  RATE_CARD,
  canSelectService,
  calculateProposal,
  formatINR,
  FRIENDS_FAMILY_DEFAULT,
  PRIVILEGED_DEFAULT,
} from "@/lib/rates";
import { DESIGN_MANAGEMENT_LINE } from "@/lib/mock-data";
import type { DesignServiceId } from "@/lib/types";
import { clsx } from "clsx";

export default function ProposalsPage() {
  return (
    <SuspenseWrap>
      <ProposalsInner />
    </SuspenseWrap>
  );
}

function ProposalsInner() {
  const search = useSearchParams();
  const {
    leads,
    consultations,
    proposals,
    upsertProposal,
    markProposalSent,
    acceptProposal,
  } = usePortal();
  const { theme } = useTheme();
  const logoSrc = theme === "light" ? "/logo-espresso.png" : "/logo-white.png";

  const leadId = search.get("lead") ?? leads[0]?.id ?? "";
  const lead = leads.find((l) => l.id === leadId);
  const consultation = consultations[leadId];
  const history = proposals.filter((p) => p.leadId === leadId);

  const [selected, setSelected] = useState<DesignServiceId[]>([
    "space_with_facade",
  ]);
  const [sqft, setSqft] = useState(consultation?.sqft ?? 4500);
  const [renderQty, setRenderQty] = useState(2);
  const [privileged, setPrivileged] = useState(false);
  const [friendsFamily, setFriendsFamily] = useState(false);
  const [advisorNotes, setAdvisorNotes] = useState("");
  const [commissionNote, setCommissionNote] = useState("");
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [view, setView] = useState<"client" | "internal">("client");
  const [warning, setWarning] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (consultation?.sqft) setSqft(consultation.sqft);
  }, [consultation]);

  const calc = useMemo(
    () =>
      calculateProposal(selected, sqft, renderQty, privileged, friendsFamily),
    [selected, sqft, renderQty, privileged, friendsFamily],
  );

  function toggleService(id: DesignServiceId) {
    const isOn = selected.includes(id);
    if (isOn) {
      const next = selected.filter((s) => s !== id);
      // if removing scope1, also drop dependent scopes
      const stillScope1 = next.some(
        (s) => RATE_CARD.find((r) => r.id === s)?.isScope1,
      );
      setSelected(
        stillScope1
          ? next
          : next.filter((s) => !RATE_CARD.find((r) => r.id === s)?.requiresScope1),
      );
      setWarning("");
      return;
    }
    const check = canSelectService(id, selected);
    if (!check.ok) {
      setWarning(check.warning ?? "Cannot select");
      return;
    }
    setWarning("");
    let next = [...selected, id];
    if (id === "space_with_facade") {
      next = next.filter((s) => s !== "space_without_facade");
    }
    if (id === "space_without_facade") {
      next = next.filter((s) => s !== "space_with_facade");
    }
    setSelected(next);
  }

  function persist(status?: "draft" | "sent") {
    const id = upsertProposal({
      id: proposalId ?? undefined,
      leadId,
      selected,
      sqft,
      renderQty,
      privileged,
      friendsFamily,
      advisorNotes,
      commissionNote,
      status,
    });
    setProposalId(id);
    return id;
  }

  function copySummary() {
    const text = [
      `Design Fee Proposal — ${lead?.name}`,
      ...calc.lines.map(
        (l) =>
          `${RATE_CARD.find((r) => r.id === l.serviceId)?.name}: ${formatINR(l.amount)}`,
      ),
      `Total: ${formatINR(calc.total)}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setToast("Summary copied to clipboard.");
  }

  return (
    <div>
      <PageHeader
        eyebrow="04 · Centrepiece"
        title="Design Fee Proposal"
        description="Build the fee for this sample family — live totals, Scope 1 sequencing, discounts, client vs internal view."
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Button
              variant={view === "client" ? "primary" : "secondary"}
              onClick={() => setView("client")}
            >
              Client view
            </Button>
            <Button
              variant={view === "internal" ? "primary" : "secondary"}
              onClick={() => setView("internal")}
            >
              Internal view
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.15fr]">
        <div className="no-print space-y-6">
          <Panel title="Build" className="animate-rise">
            <p className="mb-4 text-sm text-fg-muted">
              Working with <strong className="text-fg">{lead?.name}</strong>
            </p>

            {lead?.priorEngagement && (
              <div className="mt-4 rounded-sm border border-line-strong bg-surface px-3 py-3 text-sm text-fg">
                <strong className="font-bold">Returning client recognition.</strong>{" "}
                This family has a prior engagement — confirm privileged context
                before presenting numbers.
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Square footage">
                <input
                  type="number"
                  className={inputClass}
                  value={sqft}
                  min={500}
                  onChange={(e) => setSqft(Number(e.target.value))}
                />
              </Field>
              <Field label="Extra render views">
                <input
                  type="number"
                  className={inputClass}
                  value={renderQty}
                  min={1}
                  onChange={(e) => setRenderQty(Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="mt-5 space-y-2">
              <p className="font-body text-[11px] font-bold uppercase tracking-[0.14em] text-fg-muted">
                Scope selection
              </p>
              {RATE_CARD.map((item) => {
                const on = selected.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleService(item.id)}
                    className={clsx(
                      "flex w-full items-start justify-between gap-3 rounded-sm border px-3 py-3 text-left transition",
                      on
                        ? "border-white/40 bg-surface"
                        : "border-line hover:border-line-strong",
                    )}
                  >
                    <div>
                      <p className="font-body text-sm font-bold text-fg">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-fg-muted">
                        {item.covers}
                      </p>
                    </div>
                    <span className="shrink-0 font-body text-xs font-bold text-fg-muted">
                      {item.rateLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {warning && (
              <p className="mt-3 rounded-sm border border-error/40 bg-hot/5 px-3 py-2 text-sm text-\[\#ff6b6b\]">
                {warning}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={privileged}
                  onChange={(e) => setPrivileged(e.target.checked)}
                />
                Privileged pricing (−{PRIVILEGED_DEFAULT}%)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={friendsFamily}
                  onChange={(e) => setFriendsFamily(e.target.checked)}
                />
                Friends & Family (−{FRIENDS_FAMILY_DEFAULT}%)
              </label>
            </div>

            <div className="mt-4 sticky bottom-4 border border-line bg-surface px-4 py-4 text-fg shadow-lg">
              <p className="label tracking-[0.16em] text-fg-muted uppercase">
                Live fee total
              </p>
              <p className="heading mt-1 text-[28px]">
                {formatINR(calc.total)}
              </p>
              {calc.discountPercent > 0 && (
                <p className="text-xs text-fg/60">
                  Subtotal {formatINR(calc.subtotal)} · {calc.discountPercent}%
                  adjustment
                </p>
              )}
              <p className="mt-1 text-[11px] text-fg/50">
                PMC fee quoted separately at sign-up — not bundled.
              </p>
            </div>
          </Panel>

          <Panel title="Session history" className="animate-rise delay-1">
            {history.length === 0 ? (
              <p className="text-sm text-fg-muted">No proposals yet for this family.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-sm border border-line px-3 py-2 text-left text-sm hover:border-white/40"
                      onClick={() => {
                        setProposalId(p.id);
                        setSelected(p.lines.map((l) => l.serviceId));
                        setPrivileged(p.privilegedPricing);
                        setFriendsFamily(p.friendsFamily);
                        setAdvisorNotes(p.advisorNotes);
                        setCommissionNote(p.commissionNote);
                        const sq = p.lines.find((l) => l.sqft)?.sqft;
                        if (sq) setSqft(sq);
                      }}
                    >
                      <span>
                        {p.id} · {p.status}
                      </span>
                      <span className="font-bold">{formatINR(p.total)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <div className="no-print flex flex-wrap gap-2 animate-rise">
            <Button
              onClick={() => {
                persist("draft");
                setToast("Proposal saved as draft.");
              }}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const id = persist("draft");
                markProposalSent(id);
                setToast("Proposal marked sent & emailed (demo).");
              }}
            >
              Email client
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              Print / PDF
            </Button>
            <Button variant="secondary" onClick={copySummary}>
              Copy summary
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const id = persist("draft");
                const orderId = acceptProposal(id);
                setToast(`Accepted — Order ${orderId} created.`);
              }}
            >
              Mark accepted
            </Button>
            <Link href="/closing">
              <Button variant="ghost">Go to Closing →</Button>
            </Link>
          </div>

          {toast && (
            <p className="no-print rounded-sm border border-line bg-surface px-3 py-2 text-sm text-fg">
              {toast}
            </p>
          )}

          {view === "client" ? (
            <Panel className="animate-rise delay-1 !p-0 overflow-hidden">
              <article className="bg-surface px-8 py-10 md:px-12">
                <header className="mb-8 flex items-end justify-between border-b border-line pb-5">
                  <Image
                    src={logoSrc}
                    alt="essentia"
                    width={150}
                    height={36}
                  />
                  <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-fg-muted">
                    Design Fee Proposal
                  </p>
                </header>

                <p className="text-xs text-fg-muted">Prepared for</p>
                <h2 className="heading text-4xl text-fg">
                  {lead?.name}
                </h2>
                <p className="mt-1 text-sm text-fg-muted">
                  {consultation?.location ?? lead?.location} ·{" "}
                  {sqft.toLocaleString("en-IN")} sqft · {lead?.projectType}
                </p>

                <blockquote className="mt-6 border-l-2 border-white/40 pl-4 font-body text-sm leading-relaxed text-fg">
                  {DESIGN_MANAGEMENT_LINE.replace(
                    "your home",
                    lead?.projectType === "residential"
                      ? "your home"
                      : "your project",
                  )}
                </blockquote>

                <table className="mt-8 w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line font-body text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                      <th className="py-2">Service</th>
                      <th className="py-2">Rate</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.lines.map((line) => {
                      const item = RATE_CARD.find(
                        (r) => r.id === line.serviceId,
                      )!;
                      return (
                        <tr
                          key={line.serviceId}
                          className="border-b border-line"
                        >
                          <td className="py-3 pr-2">
                            <p className="font-bold text-fg">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-fg-muted">
                              {item.covers}
                            </p>
                          </td>
                          <td className="py-3 text-fg-muted">{item.rateLabel}</td>
                          <td className="py-3 text-right font-bold">
                            {formatINR(line.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-6 flex justify-end">
                  <div className="text-right">
                    {calc.discountPercent > 0 && (
                      <p className="text-sm text-fg-muted">
                        Subtotal {formatINR(calc.subtotal)}
                        <br />
                        Adjustment −{calc.discountPercent}%
                      </p>
                    )}
                    <p className="heading mt-1 text-4xl text-fg">
                      {formatINR(calc.total)}
                    </p>
                    <p className="mt-1 text-[11px] text-fg-muted">
                      Design fee · PMC quoted separately at engagement
                    </p>
                  </div>
                </div>

                <footer className="mt-10 flex items-center justify-between border-t border-line pt-5">
                  <Image
                    src={logoSrc}
                    alt="essentia"
                    width={110}
                    height={26}
                  />
                  <p className="label text-fg-muted">Every client returns</p>
                </footer>
              </article>
            </Panel>
          ) : (
            <Panel title="Internal view" className="animate-rise delay-1 no-print">
              <p className="mb-4 rounded-sm border border-line bg-surface px-3 py-2 text-xs text-fg-muted">
                Never exportable to the client. Commission, notes, and full
                session history only.
              </p>
              <Field label="Advisor notes">
                <textarea
                  className={`${inputClass} min-h-[80px]`}
                  value={advisorNotes}
                  onChange={(e) => setAdvisorNotes(e.target.value)}
                />
              </Field>
              <div className="mt-3">
                <Field label="Commission note">
                  <input
                    className={inputClass}
                    value={commissionNote}
                    onChange={(e) => setCommissionNote(e.target.value)}
                    placeholder="Internal commission calculation note"
                  />
                </Field>
              </div>
              <dl className="mt-5 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-fg-muted">Subtotal</dt>
                  <dd>{formatINR(calc.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-muted">Discount stack</dt>
                  <dd>{calc.discountPercent}%</dd>
                </div>
                <div className="flex justify-between font-bold">
                  <dt>Client total</dt>
                  <dd>{formatINR(calc.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-fg-muted">Est. advisory pool (demo 4%)</dt>
                  <dd>{formatINR(Math.round(calc.total * 0.04))}</dd>
                </div>
              </dl>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
