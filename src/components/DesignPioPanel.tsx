"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Printer, X } from "lucide-react";
import { clsx } from "clsx";
import { Button, Field, inputClass } from "@/components/ui";
import type { DesignPioData } from "@/lib/design-pio";

export function DesignPioPanel({
  leadId,
  open,
  onClose,
  onSaved,
}: {
  leadId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [pio, setPio] = useState<DesignPioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [exists, setExists] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    void fetch(`/api/leads/${leadId}/pio`, { credentials: "include" })
      .then(async (r) => {
        const data = (await r.json()) as {
          error?: string;
          pio?: DesignPioData;
          exists?: boolean;
        };
        if (!r.ok || !data.pio) throw new Error(data.error || "Could not load PIO.");
        setPio(data.pio);
        setExists(Boolean(data.exists));
        setMode(data.exists ? "preview" : "edit");
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, leadId]);

  if (!open) return null;

  async function save(markReleased: boolean) {
    if (!pio) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${leadId}/pio`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pio, markReleased }),
      });
      const data = (await res.json()) as { error?: string; pio?: DesignPioData };
      if (!res.ok || !data.pio) {
        setError(data.error || "Could not save.");
        setSaving(false);
        return;
      }
      setPio(data.pio);
      setExists(true);
      setMode("preview");
      onSaved?.();
    } catch {
      setError("Network error.");
    }
    setSaving(false);
  }

  function updateList(
    key: "scopeItems" | "scheduleItems",
    index: number,
    value: string,
  ) {
    setPio((p) => {
      if (!p) return p;
      const next = [...p[key]];
      next[index] = value;
      return { ...p, [key]: next };
    });
  }

  function addListItem(key: "scopeItems" | "scheduleItems") {
    setPio((p) => (p ? { ...p, [key]: [...p[key], ""] } : p));
  }

  function removeListItem(key: "scopeItems" | "scheduleItems", index: number) {
    setPio((p) => {
      if (!p || p[key].length <= 1) return p;
      return { ...p, [key]: p[key].filter((_, i) => i !== index) };
    });
  }

  const panel = (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-end bg-black/40">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-5xl flex-col border-l border-line bg-bg shadow-xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div>
            <p className="label text-fg">Design PIO</p>
            <p className="metric text-fg-dim">
              {exists ? "Edit or print" : "Generate from template — edit as needed"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={clsx(
                "border px-2.5 py-1.5 font-body text-[11px] lowercase tracking-[0.12em]",
                mode === "edit"
                  ? "border-fg bg-fg text-bg"
                  : "border-line text-fg-muted",
              )}
              onClick={() => setMode("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              className={clsx(
                "border px-2.5 py-1.5 font-body text-[11px] lowercase tracking-[0.12em]",
                mode === "preview"
                  ? "border-fg bg-fg text-bg"
                  : "border-line text-fg-muted",
              )}
              onClick={() => setMode("preview")}
              disabled={!pio}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-line p-1.5 text-fg-muted hover:text-fg"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading && (
            <p className="label flex items-center gap-2 text-fg-dim">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </p>
          )}
          {error && (
            <p className="label mb-3 border border-error/40 px-3 py-2 text-error">
              {error}
            </p>
          )}

          {pio && mode === "edit" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="PIO no.">
                  <input
                    className={inputClass}
                    value={pio.pioNo}
                    onChange={(e) =>
                      setPio({ ...pio, pioNo: e.target.value })
                    }
                  />
                </Field>
                <Field label="Areas">
                  <input
                    className={inputClass}
                    value={pio.areas}
                    onChange={(e) =>
                      setPio({ ...pio, areas: e.target.value })
                    }
                  />
                </Field>
                <Field label="Team label">
                  <input
                    className={inputClass}
                    value={pio.teamLabel}
                    onChange={(e) =>
                      setPio({ ...pio, teamLabel: e.target.value })
                    }
                  />
                </Field>
                <Field label="Signed date">
                  <input
                    className={inputClass}
                    value={pio.signedDate}
                    placeholder="dd/mm/yy"
                    onChange={(e) =>
                      setPio({ ...pio, signedDate: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Site">
                <input
                  className={inputClass}
                  value={pio.site}
                  onChange={(e) => setPio({ ...pio, site: e.target.value })}
                />
              </Field>
              <Field label="Document title">
                <input
                  className={inputClass}
                  value={pio.docTitle}
                  onChange={(e) =>
                    setPio({ ...pio, docTitle: e.target.value })
                  }
                />
              </Field>

              <div>
                <p className="label mb-2 text-fg">Scope of work</p>
                {pio.scopeItems.map((item, i) => (
                  <div key={`scope-${i}`} className="mb-2 flex gap-2">
                    <input
                      className={inputClass}
                      value={item}
                      onChange={(e) =>
                        updateList("scopeItems", i, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="label shrink-0 text-fg-muted"
                      onClick={() => removeListItem("scopeItems", i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="label text-fg-muted underline"
                  onClick={() => addListItem("scopeItems")}
                >
                  + Add scope line
                </button>
              </div>

              <div>
                <p className="label mb-2 text-fg">Schedule of completion</p>
                {pio.scheduleItems.map((item, i) => (
                  <div key={`sch-${i}`} className="mb-2 flex gap-2">
                    <textarea
                      rows={2}
                      className={clsx(inputClass, "resize-none")}
                      value={item}
                      onChange={(e) =>
                        updateList("scheduleItems", i, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="label shrink-0 text-fg-muted"
                      onClick={() => removeListItem("scheduleItems", i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="label text-fg-muted underline"
                  onClick={() => addListItem("scheduleItems")}
                >
                  + Add schedule line
                </button>
                <Field label="Schedule note">
                  <textarea
                    rows={2}
                    className={clsx(inputClass, "mt-0 resize-none")}
                    value={pio.scheduleNote}
                    onChange={(e) =>
                      setPio({ ...pio, scheduleNote: e.target.value })
                    }
                  />
                </Field>
              </div>

              <div>
                <p className="label mb-2 text-fg">Schedule of payments</p>
                <Field label="Sign-up fee note">
                  <textarea
                    rows={2}
                    className={clsx(inputClass, "resize-none")}
                    value={pio.signUpFeeNote}
                    onChange={(e) =>
                      setPio({ ...pio, signUpFeeNote: e.target.value })
                    }
                  />
                </Field>
                <div className="mt-3 space-y-2">
                  {pio.payments.map((pay, i) => (
                    <div
                      key={`pay-${i}`}
                      className="grid gap-2 border border-line p-3 sm:grid-cols-[80px_1fr_120px]"
                    >
                      <input
                        className={inputClass}
                        value={pay.percent}
                        placeholder="%"
                        onChange={(e) => {
                          const payments = [...pio.payments];
                          payments[i] = { ...pay, percent: e.target.value };
                          setPio({ ...pio, payments });
                        }}
                      />
                      <input
                        className={inputClass}
                        value={pay.description}
                        onChange={(e) => {
                          const payments = [...pio.payments];
                          payments[i] = {
                            ...pay,
                            description: e.target.value,
                          };
                          setPio({ ...pio, payments });
                        }}
                      />
                      <input
                        className={inputClass}
                        value={pay.date}
                        placeholder="Date"
                        onChange={(e) => {
                          const payments = [...pio.payments];
                          payments[i] = { ...pay, date: e.target.value };
                          setPio({ ...pio, payments });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <Field label="Payment note">
                  <input
                    className={inputClass}
                    value={pio.paymentNote}
                    onChange={(e) =>
                      setPio({ ...pio, paymentNote: e.target.value })
                    }
                  />
                </Field>
              </div>

              <div>
                <p className="label mb-2 text-fg">Design team</p>
                {pio.team.map((m, i) => (
                  <div
                    key={`team-${i}`}
                    className="mb-2 grid gap-2 sm:grid-cols-2"
                  >
                    <input
                      className={inputClass}
                      value={m.department}
                      placeholder="Department"
                      onChange={(e) => {
                        const team = [...pio.team];
                        team[i] = { ...m, department: e.target.value };
                        setPio({ ...pio, team });
                      }}
                    />
                    <input
                      className={inputClass}
                      value={m.name}
                      placeholder="Name"
                      onChange={(e) => {
                        const team = [...pio.team];
                        team[i] = { ...m, name: e.target.value };
                        setPio({ ...pio, team });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {pio && mode === "preview" && <PioDocument pio={pio} />}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-5 py-3">
          <Button
            disabled={!pio || saving}
            onClick={() => void save(false)}
          >
            {saving ? "Saving…" : "Save PIO"}
          </Button>
          <Button
            variant="secondary"
            disabled={!pio || saving}
            onClick={() => void save(true)}
          >
            Save & mark released
          </Button>
          {mode === "preview" && (
            <Button
              variant="secondary"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
              Print
            </Button>
          )}
        </footer>
      </aside>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}

function PioDocument({ pio }: { pio: DesignPioData }) {
  return (
    <div
      id="design-pio-print"
      className="border border-[#c4c4c4] bg-white text-[#1a1a1a] shadow-[var(--elev-sm)]"
    >
      {/* Row 1 — DESIGN PIO | SITE | TEAM */}
      <div className="grid grid-cols-[140px_1fr_150px] border-b border-[#1a1a1a]">
        <div className="flex items-center px-3 py-2.5">
          <p className="font-body text-[12px] font-medium uppercase tracking-[0.08em]">
            Design PIO
          </p>
        </div>
        <div className="flex items-center border-l border-[#1a1a1a] px-3 py-2.5">
          <p className="font-body text-[12px] font-light">
            <span className="font-medium uppercase tracking-[0.06em]">
              Site-{" "}
            </span>
            {pio.site}
          </p>
        </div>
        <div className="flex items-center justify-end border-l border-[#1a1a1a] bg-[#f5f5f4] px-3 py-2.5">
          <p className="font-body text-[10px] font-medium uppercase tracking-[0.14em]">
            {pio.teamLabel}
          </p>
        </div>
      </div>

      {/* Row 2 — green bar PIO.NO. | AREAS */}
      <div className="grid grid-cols-2 bg-[#5a7a4a] text-white">
        <div className="px-3 py-1.5 font-body text-[11px] font-medium uppercase tracking-[0.12em]">
          Pio.no.
        </div>
        <div className="border-l border-white/30 px-3 py-1.5 font-body text-[11px] font-medium uppercase tracking-[0.12em]">
          Areas
        </div>
      </div>

      {/* Row 3 — values */}
      <div className="grid grid-cols-2 border-b border-[#1a1a1a]">
        <div className="px-3 py-2.5 font-body text-[14px] font-medium tracking-wide">
          {pio.pioNo}
        </div>
        <div className="border-l border-[#1a1a1a] px-3 py-2.5 font-body text-[14px] font-medium tracking-wide">
          {pio.areas}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-5 px-4 py-5 font-body text-[12px] font-light leading-[1.55]">
        <p className="text-[13px] font-medium uppercase tracking-[0.04em] text-[#b45309]">
          {pio.docTitle || "PIO FOR DESIGN WORK:-"}
        </p>

        <section>
          <h3 className="border-b border-[#b45309] pb-0.5 text-[12px] font-medium uppercase tracking-[0.04em] text-[#b45309]">
            {pio.scopeTitle}
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {pio.scopeItems.filter(Boolean).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#b45309]">
            {pio.scheduleTitle}
          </h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            {pio.scheduleItems.filter(Boolean).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
          {pio.scheduleNote ? (
            <p className="mt-2 text-[11px] text-[#44403c]">{pio.scheduleNote}</p>
          ) : null}
        </section>

        <section>
          <h3 className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#b45309]">
            {pio.paymentsTitle}
          </h3>
          <p className="mt-2">{pio.signUpFeeNote}</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            {pio.payments.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.percent}</span> {p.description}
                {p.date ? (
                  <span className="ml-2 font-medium italic text-[#b45309]">
                    {p.date}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          {pio.paymentNote ? (
            <p className="mt-2 text-[11px] text-[#44403c]">{pio.paymentNote}</p>
          ) : null}
        </section>
      </div>

      {/* Bottom team / signature table — matches paper footer */}
      <div className="border-t border-[#1a1a1a] px-4 py-4">
        <table className="w-full border-collapse font-body text-[11px] font-light">
          <thead>
            <tr className="border-b border-[#1a1a1a] text-left">
              <th className="w-[28%] py-1.5 font-medium uppercase tracking-[0.08em]">
                Department
              </th>
              <th className="w-[36%] py-1.5 font-medium uppercase tracking-[0.08em]">
                Name
              </th>
              <th className="py-1.5 font-medium uppercase tracking-[0.08em]">
                Signature
              </th>
            </tr>
          </thead>
          <tbody>
            {pio.team.map((m) => (
              <tr
                key={m.department + m.name}
                className="border-b border-[#d6d3d1]"
              >
                <td className="py-2.5 uppercase tracking-[0.06em]">
                  {m.department}
                </td>
                <td className="py-2.5 uppercase tracking-[0.04em]">{m.name}</td>
                <td className="py-2.5">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pio.signedDate ? (
          <p className="mt-4 font-body text-[12px] font-light">
            Date: {pio.signedDate}
          </p>
        ) : (
          <p className="mt-4 font-body text-[12px] font-light text-[#a8a29e]">
            Date: _______________
          </p>
        )}
      </div>
    </div>
  );
}

