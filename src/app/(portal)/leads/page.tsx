"use client";

import {
  FormEvent,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Button, Field, PageHeader, QualBadge, inputClass } from "@/components/ui";
import { SuspenseWrap } from "@/components/SuspenseWrap";
import { PlatformTabs } from "@/components/PlatformTabs";
import { useAuth } from "@/lib/auth-context";
import { useBdLeadsPage, useHubspotLiveSync, type BdLeadRow } from "@/lib/use-bd-leads";
import {
  BD_STATUS_LABELS,
  type BdLeadStatus,
  type ReferralApproval,
} from "@/lib/bd-types";
import { BD_SOURCE_OPTIONS } from "@/lib/bd-channels";
import { canApproveReferrals, canAssignLeads } from "@/lib/rbac";
import { clsx } from "clsx";
import { format } from "date-fns";

const STATUSES: BdLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "IN_DISCUSSION",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
  "HOLD",
];

const QUAL_TYPES = ["Hot", "Warm", "Cold", "Unqualified"] as const;
const PAGE_SIZES = [10, 25, 50, 100];

const selectClass =
  "max-w-[160px] cursor-pointer border-0 bg-transparent py-2.5 pr-1 font-body text-[13px] font-light text-fg outline-none";

export default function LeadsPage() {
  return (
    <SuspenseWrap>
      <LeadsInner />
    </SuspenseWrap>
  );
}

function LeadsInner() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wantsNew = search.get("new") === "1";
  const { user, isAdmin } = useAuth();

  const statusFromUrl = search.get("status");
  const qFromUrl = search.get("q") ?? "";
  const initialStatus =
    statusFromUrl && STATUSES.includes(statusFromUrl as BdLeadStatus)
      ? (statusFromUrl as BdLeadStatus)
      : "all";

  const [query, setQuery] = useState(qFromUrl);
  const [queryApplied, setQueryApplied] = useState(qFromUrl);
  const [statusFilter, setStatusFilter] = useState<"all" | BdLeadStatus>(
    initialStatus,
  );
  const [sortBy, setSortBy] = useState("newest");
  const [sinceFilter, setSinceFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detailId, setDetailId] = useState<string | null>(search.get("focus"));
  const [formOpen, setFormOpen] = useState(wantsNew);
  const [editId, setEditId] = useState<string | null>(null);
  const [assignees, setAssignees] = useState<
    { id: string; name: string; email: string; role: string }[]
  >([]);

  const { leads, total, loading, refresh } = useBdLeadsPage(page, pageSize, {
    status: statusFilter,
    q: queryApplied,
    sort: sortBy,
    since: sinceFilter,
    source: platformFilter,
    qualification: typeFilter,
  });
  useHubspotLiveSync(refresh);

  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    if (wantsNew) {
      setFormOpen(true);
      router.replace(pathname);
    }
  }, [wantsNew, router, pathname]);

  useEffect(() => {
    if (!isAdmin) return;
    void fetch("/api/users", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAssignees(d.users ?? []))
      .catch(() => undefined);
  }, [isAdmin]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQueryApplied(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const detail = leads.find((l) => l.id === detailId) ?? null;
  const editLead = leads.find((l) => l.id === editId) ?? null;

  return (
    <div className="w-full min-w-0">
      <PageHeader
        eyebrow="Lead platform"
        title="All Leads"
        description={
          isAdmin
            ? "All BD leads — assign, approve referrals, move status."
            : "Your assigned leads and referrals."
        }
        actions={
          <Button
            onClick={() => {
              setEditId(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
            New Lead
          </Button>
        }
      />

      <PlatformTabs />

      <div className="mb-4 flex w-full min-w-0 flex-wrap items-stretch border border-line bg-surface">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" />
          <input
            className="w-full border-0 bg-transparent py-2.5 pl-9 pr-3 font-body text-[13px] font-light text-fg outline-none placeholder:text-fg-dim"
            placeholder="Search name, phone, source…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <FilterSelect
          label="Sort"
          value={sortBy}
          onChange={(v) => {
            setSortBy(v);
            setPage(1);
          }}
          options={[
            ["newest", "Newest first"],
            ["oldest", "Oldest first"],
            ["az", "A–Z"],
            ["za", "Z–A"],
          ]}
        />
        <FilterSelect
          label="Date"
          value={sinceFilter}
          onChange={(v) => {
            setSinceFilter(v);
            setPage(1);
          }}
          options={[
            ["all", "All time"],
            ["today", "Today"],
            ["7d", "Last 7 days"],
            ["30d", "Last 30 days"],
            ["90d", "Last 90 days"],
          ]}
        />
        <FilterSelect
          label="Platform"
          value={platformFilter}
          onChange={(v) => {
            setPlatformFilter(v);
            setPage(1);
          }}
          options={[
            ["all", "All platforms"],
            ...BD_SOURCE_OPTIONS.map((s) => [s, s] as [string, string]),
          ]}
        />
        <FilterSelect
          label="Type"
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
          options={[
            ["all", "All types"],
            ...QUAL_TYPES.map((t) => [t, t] as [string, string]),
          ]}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as "all" | BdLeadStatus);
            setPage(1);
          }}
          options={[
            ["all", "All statuses"],
            ...STATUSES.map((s) => [s, BD_STATUS_LABELS[s]] as [string, string]),
          ]}
        />
      </div>

      <div className="min-w-0 w-full border border-line bg-surface">
        <div className="min-w-0 w-full overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[14%]" />
              <col className="w-[7%]" />
              <col className="w-[16%]" />
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[4%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line">
                {[
                  "Client",
                  "Arrived",
                  "Unit",
                  "Source",
                  "Status",
                  "Type",
                  "Owner",
                  "",
                ].map((h) => (
                  <th
                    key={h || "actions"}
                    className="label whitespace-nowrap px-3 py-3 font-normal uppercase tracking-[0.14em] text-fg-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="label px-3 py-10 text-center text-fg-dim"
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && leads.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="label px-3 py-10 text-center text-fg-dim"
                  >
                    No leads match.
                  </td>
                </tr>
              )}
              {!loading &&
                leads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setDetailId(l.id)}
                    className="cursor-pointer border-b border-line transition last:border-b-0 hover:bg-surface-hover"
                  >
                    <td className="min-w-0 px-3 py-3.5">
                      <p className="label truncate text-fg">{l.name}</p>
                      <p className="metric mt-0.5 truncate text-fg-dim">
                        {l.phone}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="metric whitespace-nowrap text-fg">
                        {format(new Date(l.createdAt), "dd MMM yyyy")}
                      </p>
                      <p className="metric mt-0.5 text-fg-dim">
                        {format(new Date(l.createdAt), "HH:mm")}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="metric border border-line px-1.5 py-0.5">
                        {l.businessUnit}
                      </span>
                    </td>
                    <td className="min-w-0 px-3 py-3.5">
                      <p className="label truncate text-fg-muted">{l.source}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusPill status={l.status} />
                    </td>
                    <td className="px-3 py-3.5">
                      <QualBadge
                        q={
                          l.qualification as
                            | "Hot"
                            | "Warm"
                            | "Cold"
                            | "Unqualified"
                        }
                      />
                    </td>
                    <td className="min-w-0 px-3 py-3.5">
                      <p className="label truncate text-fg-muted">
                        {l.assignedTo?.name ?? "—"}
                      </p>
                    </td>
                    <td className="w-20 px-2 py-3.5">
                      <div className="flex justify-end gap-1">
                        <IconBtn
                          label="View"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailId(l.id);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </IconBtn>
                        <IconBtn
                          label="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditId(l.id);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-line bg-bg px-3 py-2.5">
          <p className="label text-fg-muted">
            {total.toLocaleString()} row{total === 1 ? "" : "s"} total
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="label flex items-center gap-2 text-fg-muted">
              Rows per page
              <select
                className="border border-line bg-bg px-2 py-1 text-[12px] text-fg outline-none"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <p className="label text-fg-muted">
              Page {page} of {pageCount}
            </p>
            <div className="flex items-center gap-1">
              <PagerBtn
                label="First page"
                disabled={page <= 1 || loading}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              </PagerBtn>
              <PagerBtn
                label="Previous page"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              </PagerBtn>
              <PagerBtn
                label="Next page"
                disabled={page >= pageCount || loading}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </PagerBtn>
              <PagerBtn
                label="Last page"
                disabled={page >= pageCount || loading}
                onClick={() => setPage(pageCount)}
              >
                <ChevronsRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </PagerBtn>
              <PagerBtn
                label="Refresh"
                disabled={loading}
                onClick={() => void refresh()}
              >
                <RefreshCw
                  className={clsx("h-3.5 w-3.5", loading && "animate-spin")}
                  strokeWidth={1.5}
                />
              </PagerBtn>
            </div>
          </div>
        </div>
      </div>

      {detail && (
        <LeadSidePanel title="Lead detail" onClose={() => setDetailId(null)}>
          <LeadDetailBody
            lead={detail}
            isAdmin={Boolean(user && canApproveReferrals(user.role))}
            canAssign={Boolean(user && canAssignLeads(user.role))}
            assignees={assignees}
            onChanged={async () => {
              await refresh();
            }}
            onEdit={() => {
              setDetailId(null);
              setEditId(detail.id);
              setFormOpen(true);
            }}
          />
        </LeadSidePanel>
      )}

      {formOpen && (
        <LeadSidePanel
          title={editLead ? "Edit lead" : "New lead"}
          onClose={() => {
            setFormOpen(false);
            setEditId(null);
          }}
        >
          <LeadFormBody
            lead={editLead}
            isAdmin={isAdmin}
            assignees={assignees}
            onSaved={async () => {
              await refresh();
              setFormOpen(false);
              setEditId(null);
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditId(null);
            }}
          />
        </LeadSidePanel>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex shrink-0 items-center border-t border-line sm:border-l sm:border-t-0">
      <label className="label flex items-center gap-2 whitespace-nowrap px-3 text-fg-muted">
        <span className="hidden lg:inline">{label}</span>
        <select
          className={selectClass}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map(([id, text]) => (
            <option key={id} value={id}>
              {text}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function PagerBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center border border-line text-fg-muted transition enabled:hover:border-line-strong enabled:hover:text-fg disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: BdLeadStatus }) {
  return (
    <span className="label inline-flex border border-line-strong px-2 py-1 uppercase tracking-[0.12em] text-fg">
      {BD_STATUS_LABELS[status]}
    </span>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: (e: MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="border border-transparent p-1.5 text-fg-dim transition hover:border-line hover:text-fg"
    >
      {children}
    </button>
  );
}

function LeadSidePanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-fade"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-line bg-bg animate-slide-right">
        <header className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
          <h2 className="heading text-[20px]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="border border-line p-2 text-fg-muted hover:text-fg"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </header>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </aside>
    </div>
  );
}

function LeadDetailBody({
  lead,
  isAdmin,
  canAssign,
  assignees,
  onChanged,
  onEdit,
}: {
  lead: BdLeadRow;
  isAdmin: boolean;
  canAssign: boolean;
  assignees: { id: string; name: string; email: string }[];
  onChanged: () => Promise<void>;
  onEdit: () => void;
}) {
  const [busy, setBusy] = useState("");
  const [assignee, setAssignee] = useState(lead.assignedToId ?? "");
  const [crmLead, setCrmLead] = useState(lead.crmTeamLead ?? "");

  async function patch(body: Record<string, unknown>) {
    setBusy("save");
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await onChanged();
    setBusy("");
  }

  async function approve(decision: ReferralApproval) {
    setBusy(decision);
    await fetch(`/api/leads/${lead.id}/approve-referral`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    await onChanged();
    setBusy("");
  }

  async function reopen() {
    setBusy("reopen");
    await fetch(`/api/leads/${lead.id}/reopen`, {
      method: "POST",
      credentials: "include",
    });
    await onChanged();
    setBusy("");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="heading text-[22px]">{lead.name}</p>
        <p className="metric mt-1 text-fg-dim">
          {lead.phone} · {lead.email || "No email"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusPill status={lead.status} />
          <QualBadge
            q={
              lead.qualification as "Hot" | "Warm" | "Cold" | "Unqualified"
            }
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 border border-line p-4">
        {[
          ["Source", lead.source],
          ["Territory", lead.territory],
          ["Location", lead.location || "—"],
          ["Owner", lead.assignedTo?.name ?? "—"],
          ["Unit", lead.businessUnit],
          ["Project", lead.projectType],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="label text-fg-dim">{k}</dt>
            <dd className="label mt-0.5 text-fg">{v}</dd>
          </div>
        ))}
      </dl>

      {lead.notes && (
        <p className="label border border-line p-3 text-fg-muted">{lead.notes}</p>
      )}

      {lead.isPersonalReferral && (
        <div className="border border-line p-4">
          <p className="label text-fg">
            Personal referral · {lead.referralApproval}
          </p>
          {isAdmin && lead.referralApproval === "PENDING" && (
            <div className="mt-3 flex gap-2">
              <Button
                disabled={busy === "APPROVED"}
                onClick={() => approve("APPROVED")}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                disabled={busy === "REJECTED"}
                onClick={() => approve("REJECTED")}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      )}

      <Field label="Status">
        <select
          className={inputClass}
          value={lead.status}
          onChange={(e) => patch({ status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {BD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      {(lead.status === "LOST" || lead.status === "HOLD") && (
        <Button
          variant="secondary"
          disabled={busy === "reopen"}
          onClick={reopen}
        >
          Reopen to In Discussion
        </Button>
      )}

      {canAssign && (
        <Field label="Assign to">
          <div className="flex gap-2">
            <select
              className={inputClass}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">— Unassigned —</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              disabled={busy === "save"}
              onClick={() => patch({ assignedToId: assignee || null })}
            >
              Save
            </Button>
          </div>
        </Field>
      )}

      {lead.status === "WON" && (
        <div className="space-y-3 border border-line p-4">
          <p className="label text-fg">Post-Won checklist</p>
          {(
            [
              ["pioReleased", "Design PIO released", lead.pioReleased],
              [
                "firstPaymentReceived",
                "First payment received",
                lead.firstPaymentReceived,
              ],
              ["docsComplete", "Documents complete", lead.docsComplete],
              [
                "handoverComplete",
                "Handover complete",
                lead.handoverComplete,
              ],
            ] as const
          ).map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => patch({ [key]: !value })}
              className="flex w-full items-center gap-2 text-left"
            >
              <span
                className={clsx(
                  "flex h-4 w-4 items-center justify-center border",
                  value ? "border-fg bg-fg text-bg" : "border-line",
                )}
              >
                {value && <Check className="h-3 w-3" strokeWidth={2} />}
              </span>
              <span className="label text-fg-muted">{label}</span>
            </button>
          ))}
          <Field label="CRM Team Lead">
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={crmLead}
                onChange={(e) => setCrmLead(e.target.value)}
                placeholder="e.g. Team Dhruv"
              />
              <Button
                variant="secondary"
                onClick={() => patch({ crmTeamLead: crmLead })}
              >
                Save
              </Button>
            </div>
          </Field>
        </div>
      )}

      <Button className="w-full" onClick={onEdit}>
        Edit lead
      </Button>
    </div>
  );
}

function LeadFormBody({
  lead,
  isAdmin,
  assignees,
  onSaved,
  onCancel,
}: {
  lead: BdLeadRow | null;
  isAdmin: boolean;
  assignees: { id: string; name: string }[];
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const editing = Boolean(lead);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    source: lead?.source ?? "Website · essentiaenvironments.com",
    businessUnit: lead?.businessUnit ?? "EE",
    projectType: lead?.projectType ?? "residential",
    territory: lead?.territory ?? "Gurugram",
    location: lead?.location ?? "",
    qualification: lead?.qualification ?? "Unqualified",
    status: (lead?.status ?? "NEW") as BdLeadStatus,
    budgetIndication: lead?.budgetIndication ?? "",
    dealValue: lead?.dealValue != null ? String(lead.dealValue) : "",
    notes: lead?.notes ?? "",
    handoverNotes: lead?.handoverNotes ?? "",
    crmTeamLead: lead?.crmTeamLead ?? "",
    isPersonalReferral: lead?.isPersonalReferral ?? false,
    assignedToId: lead?.assignedToId ?? "",
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are required.");
      return;
    }
    setError("");
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      source: form.source,
      businessUnit: form.businessUnit,
      projectType: form.projectType,
      territory: form.territory,
      location: form.location,
      qualification: form.qualification,
      status: form.status,
      budgetIndication: form.budgetIndication || null,
      dealValue: form.dealValue ? Number(form.dealValue) : null,
      notes: form.notes || null,
      handoverNotes: form.handoverNotes || null,
      crmTeamLead: form.crmTeamLead || null,
      isPersonalReferral: form.isPersonalReferral,
      assignedToId: form.assignedToId || null,
      resubmitReferral:
        lead?.isPersonalReferral && lead.referralApproval === "REJECTED",
    };

    const res = editing
      ? await fetch(`/api/leads/${lead!.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/leads", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Could not save.");
      return;
    }
    await onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!editing && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isPersonalReferral}
            onChange={(e) =>
              setForm((f) => ({ ...f, isPersonalReferral: e.target.checked }))
            }
          />
          <span className="label text-fg-muted">
            Personal referral (needs Admin approval)
          </span>
        </label>
      )}

      <Field label="Client name *">
        <input
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone *">
          <input
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Source">
          <select
            className={inputClass}
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
          >
            {BD_SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select
            className={inputClass}
            value={form.qualification}
            onChange={(e) =>
              setForm((f) => ({ ...f, qualification: e.target.value }))
            }
          >
            {["Hot", "Warm", "Cold", "Unqualified"].map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {editing && (
        <Field label="Status">
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as BdLeadStatus,
              }))
            }
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {BD_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      )}

      {isAdmin && (
        <Field label="Assign to">
          <select
            className={inputClass}
            value={form.assignedToId}
            onChange={(e) =>
              setForm((f) => ({ ...f, assignedToId: e.target.value }))
            }
          >
            <option value="">— Unassigned —</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Notes">
        <textarea
          rows={3}
          className={clsx(inputClass, "resize-none")}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </Field>

      {error && (
        <p className="label border border-error/50 px-3 py-2 text-error">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {editing ? "Save changes" : "Add lead"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
