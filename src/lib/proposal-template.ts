/** Editable commercial design-fee proposal (Laburnum PDF structure). */

export interface ProposalServiceLine {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  areaSqft: number;
  standardRate: number;
  privilegedRate: number;
}

export interface ProposalMilestone {
  id: string;
  percent: number;
  label: string;
  trigger: string;
}

export interface ProposalInclusion {
  id: string;
  title: string;
  body: string;
}

export interface ProposalTerm {
  id: string;
  title: string;
  body: string;
}

export interface FeeProposalDoc {
  id: string;
  updatedAt: string;
  /** Cover */
  eyebrow: string;
  title: string;
  confidentialLabel: string;
  dateLabel: string;
  clientName: string;
  clientCompany: string;
  pointOfContact: string;
  officeAreaLabel: string;
  officeAddress: string;
  referredBy: string;
  partnerLine: string;
  /** Sections */
  noteHeading: string;
  noteLead: string;
  noteBody: string;
  quoteAttribution: string;
  quoteText: string;
  projectHeading: string;
  projectSub: string;
  projectBody: string;
  concernsHeading: string;
  concernsSub: string;
  concerns: { id: string; title: string; body: string }[];
  investmentHeading: string;
  investmentSub: string;
  services: ProposalServiceLine[];
  usePrivileged: boolean;
  privilegeBadge: string;
  privilegeTitle: string;
  privilegeBody: string;
  privilegeValidityDays: number;
  inclusionsHeading: string;
  inclusions: ProposalInclusion[];
  rendersNote: string;
  extraRenderRate: number;
  includedRenders: number;
  paymentHeading: string;
  paymentIntro: string;
  milestones: ProposalMilestone[];
  feeProtection: string;
  termsHeading: string;
  terms: ProposalTerm[];
  nextHeading: string;
  nextBody: string;
  preparedByRole: string;
  preparedByName: string;
  acceptedByRole: string;
  acceptedByName: string;
  footerTagline: string;
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function lineInvestment(
  line: ProposalServiceLine,
  usePrivileged: boolean,
): number {
  if (!line.enabled) return 0;
  const rate = usePrivileged ? line.privilegedRate : line.standardRate;
  return line.areaSqft * rate;
}

export function calcProposal(doc: FeeProposalDoc) {
  const lines = doc.services
    .filter((s) => s.enabled)
    .map((s) => ({
      ...s,
      standardAmount: s.areaSqft * s.standardRate,
      privilegedAmount: s.areaSqft * s.privilegedRate,
      investment: lineInvestment(s, doc.usePrivileged),
    }));

  const standardTotal = lines.reduce((a, l) => a + l.standardAmount, 0);
  const privilegedTotal = lines.reduce((a, l) => a + l.privilegedAmount, 0);
  const total = doc.usePrivileged ? privilegedTotal : standardTotal;
  const savings = Math.max(0, standardTotal - total);

  const milestoneAmounts = doc.milestones.map((m) => ({
    ...m,
    amount: Math.round((total * m.percent) / 100),
  }));

  return {
    lines,
    standardTotal,
    privilegedTotal,
    total,
    savings,
    milestoneAmounts,
  };
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Default template seeded from Laburnum Developer sample PDF. */
export function createLaburnumTemplate(): FeeProposalDoc {
  const area = 10000;
  return {
    id: uid("prop"),
    updatedAt: new Date().toISOString(),
    eyebrow: "DESIGN FEE PROPOSAL · COMMERCIAL WORKSPACE",
    title: "Design Fee Proposal",
    confidentialLabel: "Confidential",
    dateLabel: "June 2026",
    clientName: "Mr. Vipin Kaushik",
    clientCompany: "Laburnum Developer",
    pointOfContact: "Mr. Ajay Sudhera",
    officeAreaLabel: "10,000 sq.ft.",
    officeAddress: "31st Floor · M3M IFC · Sector 66, Gurugram",
    referredBy: "Hardesh Chawla",
    partnerLine:
      "essentia Design & Project Partners · Sector 34, Gurugram",
    noteHeading: "01  A NOTE FROM US",
    noteLead:
      "The office your people walk into every morning shapes every decision they make inside it.",
    noteBody:
      "A 10,000 sq.ft. office on the 31st floor of M3M IFC is not a generic workspace. It is a headquarters in one of Gurugram's most visible commercial addresses. The design of this space communicates the culture, the ambition, and the standards of the organisation to every client, partner, and employee who steps off that elevator.\n\nThe organisations that understand this — that the workspace is not a cost but a signal — are the ones that attract better talent, retain it longer, and close meetings in rooms that feel like they belong to a firm that takes itself seriously. This proposal is for a workspace that sends exactly that signal.",
    quoteAttribution: "ESSENTIA ENVIRONMENTS · TO THE CLIENT",
    quoteText:
      "When a trusted introduction is made, the conversation has already begun in the best possible way — with trust that was built before we entered the room. We do not take that lightly, and we do not treat that introduction as simply another brief.",
    projectHeading: "02  THE PROJECT",
    projectSub: "What we understood. What we are proposing.",
    projectBody:
      "The brief is for the complete design, planning, and final-layer styling of the office — covering Space Planning with MEP, Interior Design with FF&E, and Staging & Styling for the Day of Occupation.\n\nThe workplace must achieve two things simultaneously. It must serve the people who work in it every day — productive, considered, built for how the team actually functions. And it must speak to the clients and partners who walk into it.",
    concernsHeading: "03  WHAT WE KNOW TO BE TRUE",
    concernsSub:
      "Three concerns that come up in every commercial workspace brief.",
    concerns: [
      {
        id: uid("c"),
        title:
          '"The design looked great in the presentation but felt different when it was built."',
        body: "This happens when a design is approved in plan and elevation but never in three dimensions before construction begins. At essentia, every zone of the workspace is walked through in photorealistic 3D before a single contractor is briefed. What is approved in the walkthrough is what gets built.",
      },
      {
        id: uid("c"),
        title:
          '"The MEP and the design conflicted and compromises were made on site."',
        body: "In commercial spaces, MEP is not an afterthought — it is half the design. HVAC zones, lighting circuits, data infrastructure, and plumbing runs must be resolved alongside the spatial plan. Space Planning and MEP drawings are produced simultaneously.",
      },
      {
        id: uid("c"),
        title:
          '"The project ran beyond the agreed timeline and disrupted our operations."',
        body: "Our milestone structure requires written approval at every gate — space plan, 3D walkthrough, GFC drawings, BOQ — before the next phase starts. The Champagne-Readiness Audit 10 days before occupation ensures the workspace is complete on move-in day.",
      },
    ],
    investmentHeading: "04  DESIGN INVESTMENT",
    investmentSub: "Configured for this engagement — with privileged pricing option.",
    services: [
      {
        id: uid("svc"),
        name: "Scope 02 — Space Planning + MEP",
        description:
          "Complete workspace space plan — zoning, circulation, workstation layouts, meeting rooms, client-facing areas, breakout zones. Full MEP drawing set: electrical, data, HVAC, plumbing.",
        enabled: true,
        areaSqft: area,
        standardRate: 250,
        privilegedRate: 106.25,
      },
      {
        id: uid("svc"),
        name: "Interior Design + FF&E",
        description:
          "Complete interior design — 3D walkthroughs of all zones, GFC drawings, material and finish schedules, and full Furniture, Furnishings & Equipment selection curated for the brand.",
        enabled: true,
        areaSqft: area,
        standardRate: 1200,
        privilegedRate: 637.5,
      },
      {
        id: uid("svc"),
        name: "Staging & Styling",
        description:
          "Final layer before occupation — art selection and placement, fragrance and sensory curation, soft furnishing installation, reception and client-zone styling. Delivered on Day of Occupation.",
        enabled: true,
        areaSqft: area,
        standardRate: 200,
        privilegedRate: 106.25,
      },
    ],
    usePrivileged: true,
    privilegeBadge: "SPECIAL PRIVILEGE",
    privilegeTitle: "A personal introduction is a personal commitment — on both sides.",
    privilegeBody:
      "As a mark of this introduction — and our commitment to every organisation that comes through it — we are extending a special privilege on the design fee for this engagement. The full scope, quality of service, and every deliverable are identical to the standard engagement in every respect.",
    privilegeValidityDays: 30,
    inclusionsHeading: "What's included",
    inclusions: [
      {
        id: uid("inc"),
        title: "Organisation Profile & Listening Session",
        body: "The design begins with a structured conversation — how the team works, how clients experience the space, what the brand must communicate.",
      },
      {
        id: uid("inc"),
        title: "25 Photorealistic 3D Renders — Included",
        body: "3D renders across principal zones — reception, workstations, meeting rooms, breakout, and client-facing areas.",
      },
      {
        id: uid("inc"),
        title: "Good for Construction Drawing Set",
        body: "Complete GFC drawings released after written approval. Every dimension and finish specified.",
      },
      {
        id: uid("inc"),
        title: "MEP Drawings — Full Set",
        body: "Electrical, data, HVAC and plumbing resolved alongside the space plan.",
      },
      {
        id: uid("inc"),
        title: "FF&E Curation — Included",
        body: "Furniture, furnishings and equipment selected for brand identity and how the team works.",
      },
      {
        id: uid("inc"),
        title: "Staging & Styling — Day of Occupation",
        body: "Art, fragrance, soft furnishings and client-zone styling delivered before the team arrives.",
      },
    ],
    includedRenders: 25,
    extraRenderRate: 45000,
    rendersNote:
      "Included renders comfortably cover a workspace of standard layout and zoning. As the space plan develops, additional areas may warrant their own render. Any renders beyond the included count are available at the stated rate per additional render — only with prior written approval.",
    paymentHeading: "05  SCHEDULE OF PAYMENTS",
    paymentIntro:
      "Eight milestones. Each payment acknowledges what was delivered. Every billing communication is sent 7–10 days before the milestone and opens by naming what was achieved — not by requesting money.",
    milestones: [
      {
        id: uid("m"),
        percent: 35,
        label: "To Begin Together",
        trigger: "Signed agreement and first instalment confirmed",
      },
      {
        id: uid("m"),
        percent: 15,
        label: "Space Planning Complete",
        trigger: "Conceptual workspace plan presented and signed off — Gate 1",
      },
      {
        id: uid("m"),
        percent: 10,
        label: "MEP Drawings Delivered",
        trigger: "Full MEP drawing set issued and coordination confirmed",
      },
      {
        id: uid("m"),
        percent: 10,
        label: "Interior 3D Presented",
        trigger: "Immersive 3D office walkthrough presented and approved — Gate 2",
      },
      {
        id: uid("m"),
        percent: 10,
        label: "Good for Construction Drawings",
        trigger: "GFC drawing set released to site contractor — production begins",
      },
      {
        id: uid("m"),
        percent: 10,
        label: "FF&E Selections Confirmed",
        trigger: "Furniture, furnishings and equipment procurement commences",
      },
      {
        id: uid("m"),
        percent: 5,
        label: "Staging & Styling Commences",
        trigger: "Specialist brigade mobilised — final layer of the office begins",
      },
      {
        id: uid("m"),
        percent: 5,
        label: "Day of Recognition",
        trigger: "The team walks into their completed workspace",
      },
    ],
    feeProtection:
      "The privileged investment is valid for the stated days. A signed agreement locks this rate — including the special privilege — for the full engagement regardless of subsequent rate reviews.",
    termsHeading: "06  GOOD TO KNOW",
    terms: [
      {
        id: uid("t"),
        title: "Area of Responsibility",
        body: "The design fee covers design, documentation, and supervision of all elements specified. Civil and MEP execution by the client's contractor — coordinated through GFC drawings.",
      },
      {
        id: uid("t"),
        title: "5% Area Tolerance",
        body: "Actual measured area may vary by up to 5% without fee revision. Area beyond the 5% tolerance is billed at the same privileged rate per square foot.",
      },
      {
        id: uid("t"),
        title: "Shop Drawings",
        body: "Structural, fabrication and vendor-specific shop drawings are the responsibility of the respective contractors. Our GFC drawings set the design intent and the standard to be met.",
      },
      {
        id: uid("t"),
        title: "The Triangle of Agreement",
        body: "Nothing moves to the next phase without written sign-off: 3D Visual Approval → GFC Drawings → Bill of Quantities. What is approved in writing is what gets built.",
      },
      {
        id: uid("t"),
        title: "Revision Rounds",
        body: "Two revision rounds included at each design stage within the agreed scope. Changes after GFC release are documented as variation orders before work begins.",
      },
      {
        id: uid("t"),
        title: "24-Month Support",
        body: "All in-house manufactured items carry a 24-month support commitment from the Day of Recognition. One point of contact. 24-hour response on all support requests.",
      },
    ],
    nextHeading: "07  TO BEGIN TOGETHER",
    nextBody:
      "We confirm the scope, sign the agreement, and the client makes the first instalment. From that day, the engagement begins: a call from your Engagement Team Lead within 48 hours, a structured Organisation Profile session in the first two weeks, and a workspace plan that reflects how the team actually works.",
    preparedByRole: "PREPARED BY — CLIENT ADVISOR",
    preparedByName: "Preeti Vashisht",
    acceptedByRole: "ACCEPTED BY — CLIENT",
    acceptedByName: "Mr. Vipin Kaushik",
    footerTagline: "Every client returns.",
  };
}

export function createBlankCommercialTemplate(): FeeProposalDoc {
  const doc = createLaburnumTemplate();
  return {
    ...doc,
    id: uid("prop"),
    updatedAt: new Date().toISOString(),
    clientName: "",
    clientCompany: "",
    pointOfContact: "",
    officeAreaLabel: "",
    officeAddress: "",
    referredBy: "",
    dateLabel: new Date().toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    }),
    preparedByName: "",
    acceptedByName: "",
    usePrivileged: false,
    services: doc.services.map((s) => ({
      ...s,
      id: uid("svc"),
      areaSqft: 5000,
    })),
  };
}

export const PROPOSAL_STORAGE_KEY = "essentia_fee_proposals_v1";
