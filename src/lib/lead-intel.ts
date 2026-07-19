import type { Lead, SourceChannel } from "./types";
import { CHANNEL_ORDER } from "./types";

export function channelCounts(leads: Lead[]): { channel: SourceChannel; count: number }[] {
  const map = new Map<SourceChannel, number>();
  for (const c of CHANNEL_ORDER) map.set(c, 0);
  for (const lead of leads) {
    map.set(lead.source, (map.get(lead.source) ?? 0) + 1);
  }
  return CHANNEL_ORDER.map((channel) => ({
    channel,
    count: map.get(channel) ?? 0,
  }));
}

export function leadIntelligence(leads: Lead[]) {
  const total = leads.length;
  const ee = leads.filter((l) => l.businessUnit === "EE").length;
  const eh = leads.filter((l) => l.businessUnit === "EH").length;
  const signed = leads.filter((l) => l.signed).length;
  const winRate = total ? Math.round((signed / total) * 100) : 0;
  const crossSell = leads.filter((l) => l.crossSell).length;
  const channels = channelCounts(leads);
  const top = [...channels].sort((a, b) => b.count - a.count)[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = leads.filter(
    (l) => new Date(l.capturedAt) >= monthStart,
  ).length;

  return {
    total,
    ee,
    eh,
    winRate,
    signed,
    crossSell,
    topChannel: top?.channel ?? "—",
    topChannelCount: top?.count ?? 0,
    thisMonth,
    channels,
  };
}

export function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return hours <= 1 ? "1h ago" : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
