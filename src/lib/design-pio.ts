/** Design PIO document — matches Essentia paper template. */

export interface PioTeamMember {
  department: string;
  name: string;
}

export interface PioPaymentItem {
  percent: string;
  description: string;
  date: string;
}

export interface DesignPioData {
  pioNo: string;
  site: string;
  areas: string;
  teamLabel: string;
  docTitle: string;
  scopeTitle: string;
  scopeItems: string[];
  scheduleTitle: string;
  scheduleItems: string[];
  scheduleNote: string;
  paymentsTitle: string;
  signUpFeeNote: string;
  payments: PioPaymentItem[];
  paymentNote: string;
  team: PioTeamMember[];
  signedDate: string;
}

export function defaultPioNo(now = new Date()): string {
  const y = now.getFullYear();
  const yy = String(y).slice(2);
  const next = String(y + 1).slice(2);
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `ED/${yy}-${next}/${seq}`;
}

export function buildDefaultDesignPio(lead: {
  name: string;
  location?: string | null;
}): DesignPioData {
  const site =
    (lead.location && lead.location.trim()) ||
    lead.name ||
    "Apartment / site — TBD";

  return {
    pioNo: defaultPioNo(),
    site,
    areas: "1335 SQFT",
    teamLabel: "DESIGN-PRODUCT",
    scopeTitle: "ESSENTIA SCOPE OF WORK :-",
    scopeItems: [
      "Interior Design Services (Furniture and Furnishings Selection) - Ground floor and First floor.",
      "10 No. 3D Rendered views / Presentation.",
    ],
    scheduleTitle: "SCHEDULE OF COMPLETION:",
    scheduleItems: [
      "First cut of space planning within 3-4 weeks of receiving sign-up amount / go-ahead.",
      "Release of SLDs for electrical, plumbing and HVAC within 2-3 weeks after space planning approval.",
      "Release of first cut of 3D presentation within 7-8 weeks.",
      "Release of working drawings within 7-8 weeks after interior approval and receipt of funds.",
    ],
    scheduleNote:
      "Revised and technical drawings shared with site execution team within 48 hours of demand.",
    paymentsTitle: "SCHEDULE OF PAYMENTS:",
    signUpFeeNote:
      "10% of total billing as sign-up fee to block design dates and initiate space planning (non-refundable).",
    payments: [
      {
        percent: "30%",
        description:
          "post approval on space planning and mood boards (without 3Ds).",
        date: "",
      },
      {
        percent: "10%",
        description: "on approval of 3D renders and material finishes.",
        date: "",
      },
      {
        percent: "20%",
        description:
          "post delivering SLD drawings for plumbing, electrical, etc.",
        date: "",
      },
      {
        percent: "20%",
        description: "on ongoing basis based on release of working drawings.",
        date: "",
      },
      {
        percent: "10%",
        description: "to be paid before releasing the paint schedule.",
        date: "",
      },
    ],
    paymentNote: "Installments to be paid within 3-4 days of written request.",
    team: [
      { department: "ID", name: "VISHAKHA" },
      { department: "3D", name: "GAGAN SINGH RAJPUT" },
      { department: "ARCH.", name: "YOGINDER SHARMA" },
      { department: "DÉCOR", name: "AMRITA SANDHU" },
    ],
    signedDate: "",
    docTitle: "PIO FOR DESIGN WORK:-",
  };
}

export function normalizeDesignPio(raw: unknown, lead: {
  name: string;
  location?: string | null;
}): DesignPioData {
  const base = buildDefaultDesignPio(lead);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  const str = (v: unknown, fallback: string) =>
    typeof v === "string" ? v : fallback;

  const strList = (v: unknown, fallback: string[]) =>
    Array.isArray(v) && v.every((x) => typeof x === "string")
      ? (v as string[])
      : fallback;

  const payments = Array.isArray(o.payments)
    ? o.payments.map((p, i) => {
        const item = (p && typeof p === "object" ? p : {}) as Record<
          string,
          unknown
        >;
        const fb = base.payments[i] ?? base.payments[0];
        return {
          percent: str(item.percent, fb.percent),
          description: str(item.description, fb.description),
          date: str(item.date, ""),
        };
      })
    : base.payments;

  const team = Array.isArray(o.team)
    ? o.team.map((t, i) => {
        const item = (t && typeof t === "object" ? t : {}) as Record<
          string,
          unknown
        >;
        const fb = base.team[i] ?? { department: "", name: "" };
        return {
          department: str(item.department, fb.department),
          name: str(item.name, fb.name),
        };
      })
    : base.team;

  return {
    pioNo: str(o.pioNo, base.pioNo),
    site: str(o.site, base.site),
    areas: str(o.areas, base.areas),
    teamLabel: str(o.teamLabel, base.teamLabel),
    docTitle: str(o.docTitle, base.docTitle),
    scopeTitle: str(o.scopeTitle, base.scopeTitle),
    scopeItems: strList(o.scopeItems, base.scopeItems),
    scheduleTitle: str(o.scheduleTitle, base.scheduleTitle),
    scheduleItems: strList(o.scheduleItems, base.scheduleItems),
    scheduleNote: str(o.scheduleNote, base.scheduleNote),
    paymentsTitle: str(o.paymentsTitle, base.paymentsTitle),
    signUpFeeNote: str(o.signUpFeeNote, base.signUpFeeNote),
    payments,
    paymentNote: str(o.paymentNote, base.paymentNote),
    team,
    signedDate: str(o.signedDate, base.signedDate),
  };
}
