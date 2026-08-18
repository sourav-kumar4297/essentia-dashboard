"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { clsx } from "clsx";
import { useNavProgress } from "@/components/RouteProgress";

interface NotifLead {
  id: string;
  name: string;
  source: string;
  createdAt: string;
}

export function NotificationsMenu() {
  const { startNav } = useNavProgress();
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<NotifLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/leads?limit=6&offset=0&since=today", {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { leads?: NotifLead[]; total?: number } | null) => {
        if (cancelled || !data) return;
        setLeads(data.leads ?? []);
        setTotal(data.total ?? 0);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        title="Notifications"
        className="relative inline-flex items-center justify-center border border-line p-2 text-fg transition hover:border-line-strong hover:bg-surface"
      >
        <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-accent px-1 font-body text-[9px] font-normal text-accent-fg">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] max-w-[calc(100vw-2rem)] border border-line bg-bg shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
              <p className="label text-fg">Notifications</p>
              <p className="metric text-fg-dim">
                {loaded ? `${total} today` : "…"}
              </p>
            </div>
            <ul className="max-h-[320px] overflow-y-auto">
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
                <li key={lead.id}>
                  <Link
                    href={`/leads?focus=${lead.id}`}
                    onClick={() => {
                      startNav(`/leads?focus=${lead.id}`);
                      setOpen(false);
                    }}
                    className="block px-3.5 py-2.5 transition hover:bg-surface-hover"
                  >
                    <p className="label truncate text-fg">{lead.name}</p>
                    <p className="metric mt-0.5 truncate text-fg-dim">
                      {lead.source} ·{" "}
                      {format(new Date(lead.createdAt), "HH:mm")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/leads"
              onClick={() => {
                startNav("/leads");
                setOpen(false);
              }}
              className={clsx(
                "label block border-t border-line px-3.5 py-2.5 text-fg-muted transition hover:bg-surface-hover hover:text-fg",
              )}
            >
              Open all leads →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
