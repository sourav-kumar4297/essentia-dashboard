import type { DesignServiceId, ProposalLine } from "./types";

export interface RateCardItem {
  id: DesignServiceId;
  name: string;
  rateLabel: string;
  unitRate: number;
  unit: "sqft" | "view" | "percent_addon";
  covers: string;
  isScope1: boolean;
  requiresScope1: boolean;
  structuralAddonPercent?: number;
}

export const RATE_CARD: RateCardItem[] = [
  {
    id: "space_with_facade",
    name: "Space Plan — with Façade Design",
    rateLabel: "₹250 / sqft",
    unitRate: 250,
    unit: "sqft",
    covers: "Space planning + façade design + MEP, with exterior 3D renders",
    isScope1: true,
    requiresScope1: false,
  },
  {
    id: "space_without_facade",
    name: "Space Plan — without Façade Design",
    rateLabel: "₹200 / sqft",
    unitRate: 200,
    unit: "sqft",
    covers: "Space planning + MEP, no exterior renders (saves 5–6 weeks)",
    isScope1: true,
    requiresScope1: false,
  },
  {
    id: "lighting",
    name: "Lighting Design",
    rateLabel: "₹200 / sqft",
    unitRate: 200,
    unit: "sqft",
    covers: "Standalone lighting design scope",
    isScope1: false,
    requiresScope1: true,
  },
  {
    id: "landscape",
    name: "Landscape Design",
    rateLabel: "₹200 / sqft",
    unitRate: 200,
    unit: "sqft",
    covers: "Standalone landscape design scope",
    isScope1: false,
    requiresScope1: true,
  },
  {
    id: "staging",
    name: "Staging Design",
    rateLabel: "₹200 / sqft",
    unitRate: 200,
    unit: "sqft",
    covers: "Standalone staging design scope",
    isScope1: false,
    requiresScope1: true,
  },
  {
    id: "structural",
    name: "Structural Design",
    rateLabel: "₹55 / sqft + 10%",
    unitRate: 55,
    unit: "percent_addon",
    structuralAddonPercent: 10,
    covers: "Structural engineering scope",
    isScope1: false,
    requiresScope1: true,
  },
  {
    id: "extra_renders",
    name: "Extra Renders",
    rateLabel: "₹45,000 / view",
    unitRate: 45000,
    unit: "view",
    covers: "Additional visualisation beyond standard inclusions",
    isScope1: false,
    requiresScope1: true,
  },
];

export const PRIVILEGED_DEFAULT = 8;
export const FRIENDS_FAMILY_DEFAULT = 12;

export function hasScope1(selected: DesignServiceId[]): boolean {
  return selected.some((id) => RATE_CARD.find((r) => r.id === id)?.isScope1);
}

export function canSelectService(
  serviceId: DesignServiceId,
  selected: DesignServiceId[],
): { ok: boolean; warning?: string } {
  const item = RATE_CARD.find((r) => r.id === serviceId);
  if (!item) return { ok: false, warning: "Unknown service" };
  if (item.requiresScope1 && !hasScope1(selected) && !selected.includes(serviceId)) {
    return {
      ok: false,
      warning: "Scope 1 (Space Plan) must be selected before Scope 2 or Scope 3 services.",
    };
  }
  // mutually exclusive space plans
  if (serviceId === "space_with_facade" && selected.includes("space_without_facade")) {
    return { ok: true };
  }
  if (serviceId === "space_without_facade" && selected.includes("space_with_facade")) {
    return { ok: true };
  }
  return { ok: true };
}

export function calculateLine(
  serviceId: DesignServiceId,
  sqft: number,
  quantity = 1,
  baseSubtotalForStructural = 0,
): ProposalLine {
  const item = RATE_CARD.find((r) => r.id === serviceId)!;
  let amount = 0;
  if (item.unit === "sqft") {
    amount = item.unitRate * sqft;
  } else if (item.unit === "view") {
    amount = item.unitRate * quantity;
  } else if (item.unit === "percent_addon") {
    const base = item.unitRate * sqft;
    const addon = (baseSubtotalForStructural + base) * ((item.structuralAddonPercent ?? 0) / 100);
    amount = base + addon;
  }
  return {
    serviceId,
    sqft: item.unit === "view" ? undefined : sqft,
    quantity: item.unit === "view" ? quantity : undefined,
    unitRate: item.unitRate,
    amount: Math.round(amount),
  };
}

export function calculateProposal(
  selected: DesignServiceId[],
  sqft: number,
  renderQty: number,
  privileged: boolean,
  friendsFamily: boolean,
): { lines: ProposalLine[]; subtotal: number; discountPercent: number; total: number } {
  // Enforce mutual exclusion of space plan variants
  let services = [...selected];
  if (services.includes("space_with_facade") && services.includes("space_without_facade")) {
    services = services.filter((s) => s !== "space_without_facade");
  }

  const nonStructural = services.filter((s) => s !== "structural" && s !== "extra_renders");
  const lines: ProposalLine[] = [];
  let running = 0;

  for (const id of nonStructural) {
    const line = calculateLine(id, sqft);
    lines.push(line);
    running += line.amount;
  }

  if (services.includes("structural")) {
    const line = calculateLine("structural", sqft, 1, running);
    lines.push(line);
    running += line.amount;
  }

  if (services.includes("extra_renders")) {
    const line = calculateLine("extra_renders", sqft, renderQty);
    lines.push(line);
    running += line.amount;
  }

  let discountPercent = 0;
  if (privileged) discountPercent += PRIVILEGED_DEFAULT;
  if (friendsFamily) discountPercent += FRIENDS_FAMILY_DEFAULT;
  discountPercent = Math.min(discountPercent, 25);

  const total = Math.round(running * (1 - discountPercent / 100));
  return { lines, subtotal: running, discountPercent, total };
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
