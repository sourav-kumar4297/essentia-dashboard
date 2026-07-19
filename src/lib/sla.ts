import type { Lead } from "./types";

/** Approximate business-hour elapsed since capture (excludes rough nights/weekends for POC). */
export function businessHoursSince(iso: string, now = Date.now()): number {
  const start = new Date(iso).getTime();
  let cursor = start;
  let hours = 0;
  const end = now;
  const step = 30 * 60 * 1000; // 30 min steps
  while (cursor < end) {
    const d = new Date(cursor);
    const day = d.getDay();
    const h = d.getHours();
    const isWeekend = day === 0 || day === 6;
    const isBiz = !isWeekend && h >= 10 && h < 19;
    if (isBiz) hours += 0.5;
    cursor += step;
  }
  return hours;
}

export function slaStatus(lead: Lead): {
  breached: boolean;
  ageing: boolean;
  hoursUncontacted: number;
  label: string;
} {
  if (lead.firstContactedAt) {
    const daysSinceFollowUp = lead.lastFollowUpAt
      ? (Date.now() - new Date(lead.lastFollowUpAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    return {
      breached: false,
      ageing: daysSinceFollowUp >= 7,
      hoursUncontacted: 0,
      label: daysSinceFollowUp >= 7 ? "Ageing — no follow-up 7+ days" : "SLA met",
    };
  }
  const hours = businessHoursSince(lead.capturedAt);
  const breached = hours > 4;
  return {
    breached,
    ageing: false,
    hoursUncontacted: hours,
    label: breached
      ? `SLA breached · ${hours.toFixed(1)} biz hrs uncontacted`
      : `${Math.max(0, 4 - hours).toFixed(1)} biz hrs left`,
  };
}

export function stageLabel(stage: Lead["stage"]): string {
  const map: Record<Lead["stage"], string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    handed_to_acquisition: "With Acquisition",
    consultation: "Consultation",
    profile_sent: "Profile Sent",
    proposal_draft: "Proposal Draft",
    proposal_sent: "Proposal Sent",
    accepted: "Accepted",
    handed_to_engagement: "Handoff Ready",
  };
  return map[stage];
}
