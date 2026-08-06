"use client";

import { useCallback, useEffect, useState } from "react";

export interface LeadStatsChannel {
  channel: string;
  count: number;
}

export interface LeadStatsRecent {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  businessUnit: string;
  territory: string;
  createdAt: string;
}

export interface LeadStatsWebsiteSite {
  id: string;
  label: string;
  url: string;
  source: string;
  count: number;
}

export interface LeadStats {
  total: number;
  won: number;
  winRate: number;
  thisMonth: number;
  ee: number;
  eh: number;
  cc: number;
  statusCounts: Record<string, number>;
  topChannel: string;
  topChannelCount: number;
  activeChannels: number;
  channels: LeadStatsChannel[];
  websiteSites: LeadStatsWebsiteSite[];
  recent: LeadStatsRecent[];
}

export function useLeadStats() {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load dashboard stats");
      setStats((await res.json()) as LeadStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}
