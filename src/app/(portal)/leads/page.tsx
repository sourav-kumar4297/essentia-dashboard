"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpDown, Eye, Pencil, Plus, Search } from "lucide-react";
import { Button, PageHeader, QualBadge, inputClass } from "@/components/ui";
import { SuspenseWrap } from "@/components/SuspenseWrap";
import { LeadFormPanel } from "@/components/LeadFormPanel";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { usePortal } from "@/lib/store";
import { relativeAge } from "@/lib/lead-intel";
import { stageLabel } from "@/lib/sla";
import type { BusinessUnit, Qualification } from "@/lib/types";
import { clsx } from "clsx";

export default function LeadsPage() {
  return (
    <SuspenseWrap>
      <LeadsInner />
    </SuspenseWrap>
  );
}

const QUAL_OPTIONS: ("all" | Qualification)[] = [
  "all",
  "Hot",
  "Warm",
  "Cold",
  "Unqualified",
];

type SortKey = "newest" | "oldest" | "name_asc" | "name_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A – Z" },
  { value: "name_desc", label: "Name Z – A" },
];

function LeadsInner() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const focus = search.get("focus");
  const wantsNew = search.get("new") === "1";
  const { leads, advisors } = usePortal();

  const [query, setQuery] = useState("");
  const [buFilter, setBuFilter] = useState<"all" | BusinessUnit>("all");
  const [qualFilter, setQualFilter] = useState<"all" | Qualification>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [detailId, setDetailId] = useState<string | null>(focus);
  const [form, setForm] = useState<"closed" | "new" | "edit">(
    wantsNew ? "new" : "closed",
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  // Header "+ New Lead" navigates to /leads?new=1 — open the panel then clean the URL.
  useEffect(() => {
    if (wantsNew) {
      setForm("new");
      router.replace(pathname);
    }
  }, [wantsNew, router, pathname]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = leads.filter((l) => {
      if (buFilter !== "all" && l.businessUnit !== buFilter) return false;
      if (qualFilter !== "all" && l.qualification !== qualFilter) return false;
      if (!q) return true;
      return [l.name, l.phone, l.email, l.location, l.source, l.territory]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return list.sort((a, b) => {
      switch (sortKey) {
        case "newest":
          return b.capturedAt.localeCompare(a.capturedAt);
        case "oldest":
          return a.capturedAt.localeCompare(b.capturedAt);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
      }
    });
  }, [leads, query, buFilter, qualFilter, sortKey]);

  const detailLead = leads.find((l) => l.id === detailId) ?? null;
  const editLead = leads.find((l) => l.id === editId) ?? null;
  const signedCount = leads.filter((l) => l.signed).length;

  return (
    <div>
      <PageHeader
        eyebrow="All Leads"
        title="Lead list"
        actions={
          <Button onClick={() => setForm("new")}>
            <Plus className="h-3.5 w-3.5" />
            New Lead
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1 border-b border-line">
        {[
          { href: "/pipeline", label: "Dashboard" },
          { href: "/leads", label: `All Leads (${leads.length})`, active: true },
          { href: "/board", label: "Pipeline" },
          { href: "/channels", label: "Channels" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "label border-b-2 px-3 py-2 transition",
              "active" in tab && tab.active
                ? "border-fg text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4 animate-rise">
        {(
          [
            ["Total leads", leads.length],
            [
              "Environments (EE)",
              leads.filter((l) => l.businessUnit === "EE").length,
            ],
            ["Home (EH)", leads.filter((l) => l.businessUnit === "EH").length],
            ["Signed", signedCount],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline gap-2.5 bg-surface px-4 py-2.5"
          >
            <span className="metric text-[16px] text-fg">{value}</span>
            <span className="label truncate text-fg-muted">{label}</span>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-dim" />
          <input
            className={clsx(inputClass, "!pl-9")}
            placeholder="Search by name, phone, location or source…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className={clsx(inputClass, "sm:w-44")}
          value={buFilter}
          onChange={(e) => setBuFilter(e.target.value as "all" | BusinessUnit)}
          aria-label="Filter by business unit"
        >
          <option value="all">All units</option>
          <option value="EE">EE · Environments</option>
          <option value="EH">EH · Home</option>
        </select>
        <select
          className={clsx(inputClass, "sm:w-40")}
          value={qualFilter}
          onChange={(e) =>
            setQualFilter(e.target.value as "all" | Qualification)
          }
          aria-label="Filter by qualification"
        >
          {QUAL_OPTIONS.map((q) => (
            <option key={q} value={q}>
              {q === "all" ? "All types" : q}
            </option>
          ))}
        </select>
        <div className="relative sm:w-44">
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-dim" />
          <select
            className={clsx(inputClass, "!pl-9")}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort leads"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {toast && (
        <p className="label mb-3 border border-line px-3 py-2 text-fg-muted">
          {toast}
        </p>
      )}

      <div className="panel-surface animate-rise">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {(
                [
                  ["Client", ""],
                  ["Unit", ""],
                  ["Source", "hidden md:table-cell"],
                  ["Location", "hidden xl:table-cell"],
                  ["Project", "hidden xl:table-cell"],
                  ["Type", ""],
                  ["Stage", "hidden sm:table-cell"],
                  ["Owner", "hidden xl:table-cell"],
                  ["Timeline", "hidden sm:table-cell"],
                  ["", ""],
                ] as const
              ).map(([h, visibility], i) => (
                <th
                  key={i}
                  className={clsx(
                    "label whitespace-nowrap px-3 py-3 font-normal tracking-[0.12em] text-fg-muted uppercase",
                    visibility,
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const owner =
                advisors.find((a) => a.id === l.assignedAdvisorId)?.name ??
                "—";
              return (
                <tr
                  key={l.id}
                  onClick={() => setDetailId(l.id)}
                  className="cursor-pointer border-b border-line transition last:border-b-0 hover:bg-surface-hover"
                >
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <p className="label text-fg">{l.name}</p>
                    <p className="metric mt-0.5 text-fg-dim">{l.phone}</p>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={clsx(
                        "metric border px-1.5 py-0.5",
                        l.businessUnit === "EE"
                          ? "border-[#2e3f6b]/40 text-[#2e3f6b]"
                          : "border-[#2e5c3a]/40 text-[#2e5c3a]",
                      )}
                    >
                      {l.businessUnit}
                    </span>
                  </td>
                  <td className="label hidden whitespace-nowrap px-3 py-3.5 text-fg-muted md:table-cell">
                    {l.source}
                  </td>
                  <td className="label hidden whitespace-nowrap px-3 py-3.5 text-fg-muted xl:table-cell">
                    {l.territory}
                  </td>
                  <td className="label hidden whitespace-nowrap px-3 py-3.5 capitalize text-fg-muted xl:table-cell">
                    {l.projectType}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <QualBadge q={l.qualification} />
                  </td>
                  <td className="label hidden whitespace-nowrap px-3 py-3.5 text-fg-muted sm:table-cell">
                    {stageLabel(l.stage)}
                  </td>
                  <td className="label hidden whitespace-nowrap px-3 py-3.5 text-fg-muted xl:table-cell">
                    {owner}
                  </td>
                  <td className="metric hidden whitespace-nowrap px-3 py-3.5 text-fg-dim sm:table-cell">
                    {relativeAge(l.capturedAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label={`View ${l.name}`}
                        title="View details"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailId(l.id);
                        }}
                        className="border border-line p-1.5 text-fg-muted transition hover:border-line-strong hover:text-fg"
                      >
                        <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${l.name}`}
                        title="Edit lead"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditId(l.id);
                          setForm("edit");
                        }}
                        className="border border-line p-1.5 text-fg-muted transition hover:border-line-strong hover:text-fg"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-14 text-center">
                  <p className="heading text-[18px]">No leads found</p>
                  <p className="label mt-1 text-fg-muted">
                    {leads.length
                      ? "Try a different search or filter."
                      : "Capture your first enquiry with New Lead."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="label mt-3 text-fg-dim">
        Showing {filtered.length} of {leads.length} leads
      </p>

      <LeadDetailPanel
        lead={detailLead}
        onClose={() => setDetailId(null)}
        onEdit={(lead) => {
          setDetailId(null);
          setEditId(lead.id);
          setForm("edit");
        }}
      />

      <LeadFormPanel
        open={form !== "closed"}
        lead={form === "edit" ? editLead : null}
        onClose={() => {
          setForm("closed");
          setEditId(null);
        }}
        onSaved={(id) => {
          setToast(form === "edit" ? "Lead updated." : "Lead added.");
          setDetailId(id);
        }}
      />
    </div>
  );
}
