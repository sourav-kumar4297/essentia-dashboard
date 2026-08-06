/**
 * HubSpot CRM Contacts → BD Portal leads (chunked).
 */

import { prisma } from "@/lib/db";
import {
  WEBSITE_SITES,
  matchWebsiteSite,
  type WebsiteSite,
} from "@/lib/bd-channels";

const HUBSPOT_API = "https://api.hubapi.com";
const CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "mobilephone",
  "company",
  "city",
  "state",
  "hs_lead_status",
  "lifecyclestage",
  "hs_analytics_source",
  "hs_analytics_source_data_1",
  "hs_analytics_first_url",
  "hs_analytics_last_url",
  "hs_latest_source",
  "hs_latest_source_data_1",
] as const;

type HubspotContact = {
  id: string;
  properties: Record<string, string | null | undefined>;
};

export function isHubspotConfigured(): boolean {
  return Boolean(process.env.HUBSPOT_ACCESS_TOKEN?.trim());
}

function token(): string {
  const t = process.env.HUBSPOT_ACCESS_TOKEN?.trim();
  if (!t) throw new Error("HUBSPOT_ACCESS_TOKEN is not configured.");
  return t;
}

function detectWebsiteSite(
  ...parts: Array<string | null | undefined>
): WebsiteSite | null {
  const blob = parts.filter(Boolean).join(" ");
  return matchWebsiteSite(blob);
}

function mapSourceAndUnit(p: HubspotContact["properties"]): {
  source: string;
  businessUnit: string;
} {
  const site = detectWebsiteSite(
    p.hs_analytics_source_data_1,
    p.hs_analytics_source,
    p.hs_analytics_first_url,
    p.hs_analytics_last_url,
    p.hs_latest_source_data_1,
    p.hs_latest_source,
  );
  if (site) {
    return { source: site.source, businessUnit: site.businessUnit };
  }

  const s = (
    p.hs_analytics_source_data_1 ||
    p.hs_analytics_source ||
    p.hs_latest_source_data_1 ||
    p.hs_latest_source ||
    ""
  ).toLowerCase();

  if (s.includes("instagram")) return { source: "Instagram", businessUnit: "EE" };
  if (s.includes("facebook") || s === "meta")
    return { source: "Facebook", businessUnit: "EE" };
  if (s.includes("linkedin")) return { source: "LinkedIn", businessUnit: "EE" };
  if (s.includes("referral") || s.includes("advocate"))
    return { source: "Referral", businessUnit: "EE" };
  if (s.includes("crm")) return { source: "CRM_UI", businessUnit: "EE" };
  if (
    s.includes("organic") ||
    s.includes("direct") ||
    s.includes("website") ||
    s.includes("offline")
  ) {
    // Generic website / organic traffic → EE site by default
    return {
      source: WEBSITE_SITES[0].source,
      businessUnit: "EE",
    };
  }
  if (s.includes("google") || s.includes("paid_search"))
    return { source: "Google Ads", businessUnit: "EE" };
  if (s.includes("paid_social") || s.includes("meta ads"))
    return { source: "Meta Ads", businessUnit: "EE" };
  if (s.includes("whatsapp")) return { source: "WhatsApp", businessUnit: "EE" };
  if (s.includes("walk")) return { source: "Walk-In", businessUnit: "EE" };
  if (s.includes("exhibition") || s.includes("event"))
    return { source: "Exhibition", businessUnit: "EE" };
  if (s.includes("ecommerce") || s.includes("e-commerce") || s.includes("shop"))
    return { source: "E-commerce", businessUnit: "EH" };

  const raw = (
    p.hs_analytics_source_data_1 ||
    p.hs_analytics_source ||
    ""
  ).trim();
  return { source: raw || "Other", businessUnit: "EE" };
}

function mapStatus(hsLeadStatus?: string | null, lifecycle?: string | null) {
  const h = (hsLeadStatus || "").toUpperCase().replace(/\s+/g, "_");
  const l = (lifecycle || "").toLowerCase();
  if (h.includes("UNQUALIFIED") || h === "BAD_TIMING") return "LOST";
  if (h.includes("OPEN") || h === "NEW") return "NEW";
  if (h.includes("ATTEMPTED") || h.includes("CONNECT")) return "CONTACTED";
  if (h.includes("IN_PROGRESS") || h.includes("QUALIFIED")) return "IN_DISCUSSION";
  if (h.includes("PRESENTATION") || h.includes("DECISION")) return "PROPOSAL_SENT";
  if (h.includes("CUSTOMER") || l === "customer" || l === "evangelist") return "WON";
  if (l === "opportunity") return "IN_DISCUSSION";
  return "NEW";
}

function contactName(p: HubspotContact["properties"]): string {
  const full = [p.firstname, p.lastname].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (p.company?.trim()) return p.company.trim();
  if (p.email) return p.email;
  return "HubSpot contact";
}

async function hubspotGet<T>(path: string): Promise<T> {
  const res = await fetch(`${HUBSPOT_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HubSpot ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch up to `limit` contacts starting after cursor (HubSpot max 100/page). */
export async function fetchContactsPage(opts: {
  after?: string | null;
  limit?: number;
}): Promise<{ contacts: HubspotContact[]; nextAfter: string | null }> {
  const target = Math.min(Math.max(opts.limit ?? 200, 1), 500);
  const contacts: HubspotContact[] = [];
  let after: string | undefined = opts.after || undefined;
  const props = CONTACT_PROPERTIES.join(",");

  while (contacts.length < target) {
    const pageSize = Math.min(100, target - contacts.length);
    const qs = new URLSearchParams({
      limit: String(pageSize),
      properties: props,
      archived: "false",
    });
    if (after) qs.set("after", after);

    const data = await hubspotGet<{
      results: HubspotContact[];
      paging?: { next?: { after: string } };
    }>(`/crm/v3/objects/contacts?${qs}`);

    contacts.push(...(data.results || []));
    after = data.paging?.next?.after;
    if (!after) break;
  }

  return { contacts, nextAfter: after ?? null };
}

function toLeadRow(c: HubspotContact, createdById?: string) {
  const p = c.properties || {};
  const name = contactName(p);
  const phone = (p.phone || p.mobilephone || "").trim();
  const email = (p.email || "").trim().toLowerCase();
  if (!name && !email && !phone) return null;

  const { source, businessUnit } = mapSourceAndUnit(p);
  const status = mapStatus(p.hs_lead_status, p.lifecyclestage);
  const location = [p.city, p.state].filter(Boolean).join(", ");
  const notes = [
    p.company ? `Company: ${p.company}` : null,
    p.hs_lead_status ? `HS lead status: ${p.hs_lead_status}` : null,
    p.lifecyclestage ? `Lifecycle: ${p.lifecyclestage}` : null,
    p.hs_analytics_first_url
      ? `First URL: ${p.hs_analytics_first_url}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    name: name || "HubSpot lead",
    phone: phone || "—",
    email,
    source,
    status,
    referralApproval: "NONE",
    isPersonalReferral: false,
    qualification: "Unqualified",
    location,
    territory: "Gurugram",
    businessUnit,
    projectType: "residential",
    hubspotId: c.id,
    notes: notes || "Imported from HubSpot",
    createdById: createdById ?? null,
  };
}

export type ChunkSyncResult = {
  ok: boolean;
  message: string;
  fetched: number;
  created: number;
  skipped: number;
  done: boolean;
  after: string | null;
  leadCount: number;
};

/**
 * Sync one chunk (~200 contacts). Call again with `after` until `done`.
 * Pass `reset: true` on the first call to clear existing HubSpot-imported leads.
 */
export async function syncHubspotChunk(opts: {
  after?: string | null;
  reset?: boolean;
  limit?: number;
  createdById?: string;
}): Promise<ChunkSyncResult> {
  if (!isHubspotConfigured()) {
    return {
      ok: false,
      message: "HUBSPOT_ACCESS_TOKEN is not configured in .env",
      fetched: 0,
      created: 0,
      skipped: 0,
      done: true,
      after: null,
      leadCount: 0,
    };
  }

  try {
    if (opts.reset) {
      await prisma.leadActivity.deleteMany();
      await prisma.lead.deleteMany({
        where: { OR: [{ hubspotId: { not: null } }, { notes: { contains: "Imported from HubSpot" } }] },
      });
      // Also clear any remaining for a clean re-import when user asks full refresh
      await prisma.lead.deleteMany();
    }

    const { contacts, nextAfter } = await fetchContactsPage({
      after: opts.after,
      limit: opts.limit ?? 200,
    });

    const rows = [];
    let skipped = 0;
    for (const c of contacts) {
      const row = toLeadRow(c, opts.createdById);
      if (!row) {
        skipped += 1;
        continue;
      }
      rows.push(row);
    }

    const created = rows.length
      ? (
          await prisma.lead.createMany({
            data: rows as never,
            skipDuplicates: true,
          })
        ).count
      : 0;

    const leadCount = await prisma.lead.count();
    const done = !nextAfter;

    return {
      ok: true,
      message: done
        ? `HubSpot sync complete — ${leadCount} leads in dashboard`
        : `Saved ${created} leads (batch). ${leadCount} total so far — continuing…`,
      fetched: contacts.length,
      created,
      skipped,
      done,
      after: nextAfter,
      leadCount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "HubSpot sync failed";
    console.error("[HubSpot]", message);
    return {
      ok: false,
      message,
      fetched: 0,
      created: 0,
      skipped: 0,
      done: true,
      after: null,
      leadCount: 0,
    };
  }
}

/** Full sync (blocking) — prefer chunked API from UI */
export async function syncAllHubspotContactsToLeads(opts?: {
  createdById?: string;
}) {
  let after: string | null = null;
  let reset = true;
  let created = 0;
  let fetched = 0;
  let skipped = 0;
  let leadCount = 0;

  for (let i = 0; i < 500; i++) {
    const chunk = await syncHubspotChunk({
      after,
      reset,
      limit: 200,
      createdById: opts?.createdById,
    });
    reset = false;
    if (!chunk.ok) {
      return {
        ok: false,
        message: chunk.message,
        fetched,
        created,
        updated: 0,
        skipped,
      };
    }
    created += chunk.created;
    fetched += chunk.fetched;
    skipped += chunk.skipped;
    leadCount = chunk.leadCount;
    after = chunk.after;
    if (chunk.done) break;
  }

  return {
    ok: true,
    message: `HubSpot sync done — ${leadCount} leads · ${created} new this run`,
    fetched,
    created,
    updated: 0,
    skipped,
  };
}

export async function pullRecentContacts() {
  return syncAllHubspotContactsToLeads();
}

export async function syncLeadFromHubspot(_hubspotId: string) {
  void _hubspotId;
  return syncAllHubspotContactsToLeads();
}
