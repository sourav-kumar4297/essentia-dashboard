/** Canonical BD lead source channels (HubSpot + manual). */
export const BD_CHANNEL_ORDER = [
  "Website",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "Referral",
  "CRM_UI",
  "Brand Advocate",
  "Walk-In",
  "WhatsApp",
  "Google Ads",
  "Meta Ads",
  "Exhibition",
  "E-commerce",
  "Other",
] as const;

export type BdChannel = (typeof BD_CHANNEL_ORDER)[number];

/** Website brand sites rolled into the Website channel. */
export const WEBSITE_SITES = [
  {
    id: "ee",
    label: "essentiaenvironments.com",
    url: "https://essentiaenvironments.com",
    source: "Website · essentiaenvironments.com",
    match: /essentiaenvironments\.com/i,
    businessUnit: "EE",
  },
  {
    id: "eh",
    label: "essentiahome.com",
    url: "https://essentiahome.com",
    source: "Website · essentiahome.com",
    match: /essentiahome\.com/i,
    businessUnit: "EH",
  },
] as const;

export type WebsiteSite = (typeof WEBSITE_SITES)[number];

/** Options for create/edit lead source dropdown. */
export const BD_SOURCE_OPTIONS: string[] = [
  ...WEBSITE_SITES.map((s) => s.source),
  ...BD_CHANNEL_ORDER.filter((c) => c !== "Website"),
];

export function matchWebsiteSite(
  value: string | null | undefined,
): WebsiteSite | null {
  if (!value) return null;
  for (const site of WEBSITE_SITES) {
    if (site.match.test(value) || value === site.source) return site;
  }
  return null;
}

export function isWebsiteSource(source: string): boolean {
  if (source === "Website" || source.startsWith("Website")) return true;
  return Boolean(matchWebsiteSite(source));
}

export function websiteSourceLabel(source: string): string {
  const site = matchWebsiteSite(source);
  if (site) return site.source;
  if (source === "Website" || source.startsWith("Website")) {
    return WEBSITE_SITES[0].source;
  }
  return source;
}
