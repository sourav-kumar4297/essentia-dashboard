"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BdLeadStatus, ReferralApproval } from "@/lib/bd-types";

export interface BdLeadRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: BdLeadStatus;
  referralApproval: ReferralApproval;
  isPersonalReferral: boolean;
  qualification: string;
  location: string;
  territory: string;
  businessUnit: string;
  projectType: string;
  budgetIndication: string | null;
  dealValue: number | null;
  notes: string | null;
  assignedToId: string | null;
  createdById: string | null;
  pioReleased: boolean;
  firstPaymentReceived: boolean;
  docsComplete: boolean;
  handoverComplete: boolean;
  handoverNotes: string | null;
  crmTeamLead: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; name: string; email: string; role?: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
  activities?: {
    id: string;
    type: string;
    body: string;
    createdAt: string;
    createdBy?: { id: string; name: string } | null;
  }[];
}

/** Lightweight total only — safe for sidebar */
export function useLeadTotal() {
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/leads?limit=1&offset=0", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { total?: number };
      setTotal(data.total ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { total, refresh };
}

/** Paginated leads for All Leads table */
export function useBdLeadsPage(
  page: number,
  pageSize: number,
  opts?: {
    status?: string;
    q?: string;
    sort?: string;
    since?: string;
    source?: string;
    qualification?: string;
    pool?: string;
  },
) {
  const [leads, setLeads] = useState<BdLeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const offset = Math.max(0, (page - 1) * pageSize);
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
      });
      if (opts?.status && opts.status !== "all") {
        params.set("status", opts.status);
      }
      if (opts?.q?.trim()) params.set("q", opts.q.trim());
      if (opts?.sort && opts.sort !== "newest") params.set("sort", opts.sort);
      if (opts?.since && opts.since !== "all") params.set("since", opts.since);
      if (opts?.source && opts.source !== "all") {
        params.set("source", opts.source);
      }
      if (opts?.qualification && opts.qualification !== "all") {
        params.set("qualification", opts.qualification);
      }
      if (opts?.pool && opts.pool !== "all") {
        params.set("pool", opts.pool);
      }

      const res = await fetch(`/api/leads?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load leads");
      const data = (await res.json()) as {
        leads: BdLeadRow[];
        total: number;
      };
      setLeads(data.leads);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    opts?.status,
    opts?.q,
    opts?.sort,
    opts?.since,
    opts?.source,
    opts?.qualification,
    opts?.pool,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { leads, total, loading, error, refresh, setLeads };
}

/** Pull HubSpot while a leads view is open (every minute after an initial 14-day catch-up). */
export function useHubspotLiveSync(onSynced: () => void, enabled = true) {
  const onSyncedRef = useRef(onSynced);
  onSyncedRef.current = onSynced;

  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    async function tick(lookbackHours: number) {
      try {
        await fetch("/api/hubspot/sync", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recent: true, lookbackHours }),
        });
      } catch {
        /* ignore */
      }
      if (!stop) onSyncedRef.current();
    }
    void tick(14 * 24);
    const id = window.setInterval(() => void tick(2), 60_000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [enabled]);
}

/** @deprecated prefer useBdLeadsPage — kept for board/simple lists (first 500) */
export function useBdLeads() {
  const [leads, setLeads] = useState<BdLeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads?limit=500&offset=0", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load leads");
      const data = (await res.json()) as {
        leads: BdLeadRow[];
        total: number;
      };
      setLeads(data.leads);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    leads,
    total,
    loading,
    loadingMore,
    error,
    refresh,
    setLeads,
  };
}
