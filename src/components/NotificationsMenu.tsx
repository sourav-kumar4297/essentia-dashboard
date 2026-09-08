"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";
import { useNavProgress } from "@/components/RouteProgress";
import { useAuth } from "@/lib/auth-context";
import { canAssignLeads } from "@/lib/rbac";
import { emitLeadsChanged } from "@/lib/leads-events";

interface NotifLead {
  id: string;
  name: string;
  source: string;
  createdAt: string;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
}

interface InboxNotif {
  id: string;
  type: string;
  title: string;
  body: string;
  leadId: string | null;
  readAt: string | null;
  createdAt: string;
}

interface MemberOpt {
  id: string;
  name: string;
  role: string;
}

export function NotificationsMenu() {
  const { startNav } = useNavProgress();
  const { user } = useAuth();
  const canAssign = Boolean(user && canAssignLeads(user.role));
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<NotifLead[]>([]);
  const [total, setTotal] = useState(0);
  const [inbox, setInbox] = useState<InboxNotif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [members, setMembers] = useState<MemberOpt[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [msg, setMsg] = useState("");

  async function loadTodayLeads() {
    try {
      const res = await fetch("/api/leads?limit=6&offset=0&since=today", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        leads?: NotifLead[];
        total?: number;
      };
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
    } catch {
      /* ignore */
    }
  }

  async function loadInbox() {
    try {
      const res = await fetch("/api/notifications?limit=20", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications?: InboxNotif[];
        unread?: number;
      };
      setInbox(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* ignore */
    }
  }

  async function refreshPanel() {
    try {
      if (canAssign) await loadTodayLeads();
      await loadInbox();
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    void refreshPanel();
    const id = window.setInterval(() => void loadInbox(), 45_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAssign, user?.id]);

  useEffect(() => {
    if (!open || !canAssign) return;
    void fetch("/api/users", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { users?: MemberOpt[] }) => {
        setMembers((d.users ?? []).filter((u) => u.role === "MEMBER"));
      })
      .catch(() => undefined);
  }, [open, canAssign]);

  useEffect(() => {
    if (!open) return;
    void refreshPanel();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent | TouchEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function markRead(ids?: string[]) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids?.length ? { ids } : { all: true }),
      });
      await loadInbox();
    } catch {
      /* ignore */
    }
  }

  async function assignLead(leadId: string) {
    const memberId = picks[leadId];
    if (!memberId) return;
    setBusyId(leadId);
    setMsg("");
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToId: memberId === "__none" ? null : memberId,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        lead?: NotifLead;
      };
      if (!res.ok) {
        setMsg(data.error || "Could not assign.");
        setBusyId("");
        return;
      }
      const assignee =
        memberId === "__none"
          ? null
          : members.find((m) => m.id === memberId) ?? null;
      setLeads((list) =>
        list.map((l) =>
          l.id === leadId
            ? {
                ...l,
                assignedToId: assignee?.id ?? null,
                assignedTo: assignee
                  ? { id: assignee.id, name: assignee.name }
                  : null,
                ...(data.lead ?? {}),
              }
            : l,
        ),
      );
      setPicks((p) => {
        const next = { ...p };
        delete next[leadId];
        return next;
      });
      setMsg(
        assignee
          ? `Assigned to ${assignee.name}.`
          : "Unassigned.",
      );
      emitLeadsChanged();
      await loadTodayLeads();
    } catch {
      setMsg("Network error.");
    } finally {
      setBusyId("");
    }
  }

  const badge = canAssign ? total : unread;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        title="Notifications"
        aria-expanded={open}
        className="relative inline-flex items-center justify-center border border-line p-2 text-fg transition hover:border-line-strong hover:bg-surface"
      >
        <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-fg px-1 font-body text-[9px] font-light text-bg">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div
          className={clsx(
            "absolute right-0 top-[calc(100%+8px)] z-50 max-w-[calc(100vw-2rem)] border border-line bg-bg shadow-xl",
            canAssign ? "w-[360px]" : "w-[320px]",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <p className="label text-fg">Notifications</p>
            <p className="metric text-fg-dim">
              {loaded
                ? canAssign
                  ? `${total} today`
                  : unread
                    ? `${unread} unread`
                    : "up to date"
                : "…"}
            </p>
          </div>

          {!canAssign && (
            <ul className="max-h-[380px] overflow-y-auto">
              {!loaded && (
                <li className="label px-3.5 py-6 text-center text-fg-dim">
                  Loading…
                </li>
              )}
              {loaded && inbox.length === 0 && (
                <li className="label px-3.5 py-6 text-center text-fg-dim">
                  No notifications yet.
                </li>
              )}
              {inbox.map((n) => (
                <li key={n.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={n.leadId ? `/leads?focus=${n.leadId}` : "/leads"}
                    onClick={() => {
                      startNav(n.leadId ? `/leads?focus=${n.leadId}` : "/leads");
                      setOpen(false);
                      if (!n.readAt) void markRead([n.id]);
                    }}
                    className={clsx(
                      "block px-3.5 py-2.5 transition hover:bg-surface-hover",
                      !n.readAt && "bg-surface",
                    )}
                  >
                    <p className="label truncate text-fg">{n.title}</p>
                    <p className="metric mt-0.5 text-fg-dim">{n.body}</p>
                    <p className="metric mt-0.5 text-fg-dim">
                      {format(new Date(n.createdAt), "dd MMM · HH:mm")}
                    </p>
                  </Link>
                </li>
              ))}
              {inbox.some((n) => !n.readAt) && (
                <li>
                  <button
                    type="button"
                    className="label w-full border-t border-line px-3.5 py-2 text-left text-fg-muted transition hover:bg-surface-hover hover:text-fg"
                    onClick={() => void markRead()}
                  >
                    Mark all as read
                  </button>
                </li>
              )}
            </ul>
          )}

          {canAssign && (
            <ul className="max-h-[380px] overflow-y-auto">
              {!loaded && (
                <li className="label px-3.5 py-6 text-center text-fg-dim">
                  Loading…
                </li>
              )}
              {loaded && leads.length === 0 && (
                <li className="label px-3.5 py-6 text-center text-fg-dim">
                  No new leads today.
                </li>
              )}
              {leads.map((lead) => (
                <li key={lead.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/leads?focus=${lead.id}`}
                    onClick={() => {
                      startNav(`/leads?focus=${lead.id}`);
                      setOpen(false);
                    }}
                    className="block px-3.5 pt-2.5 transition hover:bg-surface-hover"
                  >
                    <p className="label truncate text-fg">{lead.name}</p>
                    <p className="metric mt-0.5 truncate text-fg-dim">
                      {lead.source} ·{" "}
                      {format(new Date(lead.createdAt), "HH:mm")}
                      {lead.assignedTo
                        ? ` · Assigned to ${lead.assignedTo.name}`
                        : " · Unassigned"}
                    </p>
                  </Link>
                  <div
                    className="flex items-center gap-1.5 px-3.5 pb-2.5 pt-1.5"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <select
                      className="min-w-0 flex-1 border border-line bg-transparent px-1.5 py-1 font-body text-[11px] text-fg outline-none"
                      value={picks[lead.id] ?? (lead.assignedToId || "")}
                      disabled={busyId === lead.id}
                      onChange={(e) =>
                        setPicks((p) => ({
                          ...p,
                          [lead.id]: e.target.value,
                        }))
                      }
                      aria-label={`Assign ${lead.name}`}
                    >
                      <option value="">Assign to…</option>
                      <option value="__none">— Unassigned —</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={
                        busyId === lead.id ||
                        !(picks[lead.id] ?? "") ||
                        (picks[lead.id] ?? "") === (lead.assignedToId || "")
                      }
                      onClick={() => void assignLead(lead.id)}
                      className="shrink-0 bg-fg px-2 py-1 font-body text-[10px] lowercase tracking-[0.12em] text-bg enabled:hover:opacity-90 disabled:opacity-40"
                    >
                      {busyId === lead.id ? "…" : "Assign"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {msg && (
            <p className="label border-t border-line px-3.5 py-2 text-fg-dim">
              {msg}
            </p>
          )}
          <Link
            href="/leads"
            onClick={() => {
              startNav("/leads");
              setOpen(false);
              emitLeadsChanged();
            }}
            className="label block border-t border-line px-3.5 py-2.5 text-fg-muted transition hover:bg-surface-hover hover:text-fg"
          >
            Open all leads →
          </Link>
        </div>
      )}
    </div>
  );
}
