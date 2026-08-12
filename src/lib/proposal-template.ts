/** Multi-type editable design-fee proposals (Residence / Corporate / Club House / Commercial). */

export type FeeProjectType =
  | "residence"
  | "corporate_office"
  | "club_house"
  | "commercial_space";

export const FEE_PROJECT_TYPES: {
  id: FeeProjectType;
  label: string;
  short: string;
}[] = [
  { id: "residence", label: "Residence", short: "residence" },
  { id: "corporate_office", label: "Corporate Office", short: "corporate office" },
  { id: "club_house", label: "Club House", short: "club house" },
  { id: "commercial_space", label: "Commercial Space", short: "commercial space" },
];

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

export interface ProposalImage {
  src: string;
  caption: string;
}

export interface FeeProposalDoc {
  id: string;
  updatedAt: string;
  projectType: FeeProjectType;
  /** Cover */
  eyebrow: string;
  title: string;
  heroHeadline: string;
  confidentialLabel: string;
  dateLabel: string;
  clientName: string;
  clientCompany: string;
  pointOfContact: string;
  officeAreaLabel: string;
  officeAddress: string;
  referredBy: string;
  partnerLine: string;
  advisorPhone: string;
  advisorEmail: string;
  /** Selected work images */
  images: ProposalImage[];
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
  privilegePercentLabel: string;
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

const PARTNER =
  "essentia Design & Project Partners · Sector 34, Gurugram · Since 1999";

function defaultTerms(): ProposalTerm[] {
  return [
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
  ];
}

function eightMilestones(): ProposalMilestone[] {
  return [
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
      trigger: "Conceptual plan presented and signed off — Gate 1",
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
      trigger: "Immersive 3D walkthrough presented and approved — Gate 2",
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
      trigger: "Final layer of the project begins",
    },
    {
      id: uid("m"),
      percent: 5,
      label: "Day of Recognition",
      trigger: "Client walks into the completed space",
    },
  ];
}

function sevenMilestonesNoFacade(): ProposalMilestone[] {
  return [
    {
      id: uid("m"),
      percent: 35,
      label: "To Begin Together",
      trigger: "Signed agreement and first instalment confirmed",
    },
    {
      id: uid("m"),
      percent: 25,
      label: "Space Planning Complete",
      trigger: "Conceptual plan presented and signed off — Gate 1",
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
      trigger: "Immersive 3D walkthrough presented and approved — Gate 2",
    },
    {
      id: uid("m"),
      percent: 10,
      label: "Good for Construction Drawings",
      trigger: "GFC drawing set released — production begins",
    },
    {
      id: uid("m"),
      percent: 5,
      label: "FF&E Selections Confirmed",
      trigger: "Procurement of furniture, furnishings and equipment begins",
    },
    {
      id: uid("m"),
      percent: 5,
      label: "Day of Recognition",
      trigger: "Members / occupants walk into the completed building",
    },
  ];
}

function imgs(prefix: string, captions: string[]): ProposalImage[] {
  return captions.map((caption, i) => ({
    src: `/proposals/${prefix}-${i + 1}.jpg`,
    caption,
  }));
}

/** Residence — Ashley Khilwani / Bhopal sample */
export function createResidenceTemplate(): FeeProposalDoc {
  const area = 15000;
  return {
    id: uid("prop"),
    updatedAt: new Date().toISOString(),
    projectType: "residence",
    eyebrow: "DESIGN FEE PROPOSAL · PRIVATE RESIDENCE",
    title: "Design Fee Proposal",
    heroHeadline: "A house that reads as one house.",
    confidentialLabel: "Confidential",
    dateLabel: new Date().toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    }),
    clientName: "Mr. Ashley Khilwani",
    clientCompany: "",
    pointOfContact: "Ms. Preeti Vashist",
    officeAreaLabel: "15,000 sq.ft.",
    officeAddress: "Private Residence · Bhopal, Madhya Pradesh · Ground + Two Floors, with Basement",
    referredBy: "",
    partnerLine: PARTNER,
    advisorPhone: "+91 88009 96501",
    advisorEmail: "pkv@essentia.in",
    images: imgs("residence", [
      "Selected work — a house seen the way everyone will actually see yours — from the road, in passing, all at once.",
      "The face of the house — elevation and plan designed together rather than in sequence.",
      "Interiors — proportion first, finishes second.",
      "Joinery & FF&E — designed as part of the scope, not as an add-on.",
    ]),
    noteHeading: "02  A NOTE FROM US",
    noteLead:
      "Fifteen thousand square feet is not a bigger version of a smaller house. It is a different problem.",
    noteBody:
      "At this scale the risk is not that any single room will disappoint. The risk is that the house never becomes one house — four levels, each planned in its own meeting, each approved separately, and what finally stands is a collection of good rooms that do not speak to one another.\n\nHolding four levels as a single idea is a discipline. It means the basement is planned in the same breath as the second floor, the staircase is designed as the spine it actually is, and the material logic that starts at the gate is still recognisably itself in a bedroom three floors up.\n\nYou have asked us for the outside as well as the inside. A facade designed after the plan is settled always looks like what it is: an elevation drawn around windows that were placed for other reasons.",
    quoteAttribution: "EVERY CLIENT RETURNS",
    quoteText:
      "Not every client is delighted on every single day of a two-year build — that would be a promise no honest firm could make. But every one of them comes back.",
    projectHeading: "03  THE PROJECT",
    projectSub: "Space Planning with Facade Design & MEP · Interior Design including FF&E",
    projectBody:
      "Complete design for a private residence across basement, ground and two floors — space planning, facade / exterior elevation, MEP coordination, and full interior design including FF&E as one coherent package.",
    concernsHeading: "04  WHAT WE KNOW TO BE TRUE",
    concernsSub: "Concerns that come up in every serious residential brief.",
    concerns: [
      {
        id: uid("c"),
        title: '"The renders will be beautiful. The house will be something else."',
        body: "Every zone is walked through in photorealistic 3D and signed off before construction drawings. What is approved is what gets built — one version-controlled truth.",
      },
      {
        id: uid("c"),
        title: '"Distance will make coordination impossible."',
        body: "A firm that serves a distant site on visits alone will struggle. Work is drawn in the design room, made in our facility, and delivered in sequence against the site programme, with a team stationed as required.",
      },
      {
        id: uid("c"),
        title: '"I will become the switchboard between everyone."',
        body: "One named Client Advisor and one number, from this conversation to the Day of Recognition and beyond, with the full studio behind them.",
      },
    ],
    investmentHeading: "05  INVESTMENT SUMMARY",
    investmentSub: "The design fee — configured for this residence.",
    services: [
      {
        id: uid("svc"),
        name: "Space Planning with Facade Design & MEP",
        description:
          "Space planning across all four levels — basement, ground and two floors above — plus exterior elevation / facade treatment, and plumbing, electrical and HVAC coordination.",
        enabled: true,
        areaSqft: area,
        standardRate: 250,
        privilegedRate: 200, // 37,50,000 / 15000 ≈ 250 std; privilege stacks on total 20% in sample — use line rates that sum correctly
      },
      {
        id: uid("svc"),
        name: "Interior Design — including FF&E",
        description:
          "Full interior scope as one package: 3D interiors, GFC drawings, materials and finishes, furniture, furnishings, equipment and art.",
        enabled: true,
        areaSqft: area,
        standardRate: 1200,
        privilegedRate: 960, // 20% off
      },
    ],
    usePrivileged: true,
    privilegePercentLabel: "20%",
    privilegeBadge: "PRIVILEGE BENEFIT · 20%",
    privilegeTitle: "A considered privilege on the design fee for this engagement.",
    privilegeBody:
      "The full scope, quality of service, and every deliverable are identical to the standard engagement. The privilege is valid for 30 days from the date of this proposal and locks on signed agreement.",
    privilegeValidityDays: 30,
    inclusionsHeading: "What's included",
    inclusions: [
      {
        id: uid("inc"),
        title: "Organisation Profile & Listening Session",
        body: "How this house will actually be lived in — by whom, at what hours — before a single plan is drawn.",
      },
      {
        id: uid("inc"),
        title: "Facade & exterior elevation",
        body: "The face of the house designed with the plan, not after it.",
      },
      {
        id: uid("inc"),
        title: "Photorealistic 3D — included",
        body: "Enough views to cover principal rooms and elevations before construction begins.",
      },
      {
        id: uid("inc"),
        title: "GFC + MEP drawing sets",
        body: "Version-controlled packages for contractor and consultants.",
      },
      {
        id: uid("inc"),
        title: "FF&E curation — included",
        body: "Furniture, furnishings, equipment and art as part of interior scope — never an add-on.",
      },
      {
        id: uid("inc"),
        title: "Day of Recognition",
        body: "Not a handover — the moment you walk in and recognise the house as entirely yours.",
      },
    ],
    includedRenders: 34,
    extraRenderRate: 45000,
    rendersNote:
      "Included views cover a house of this scale. Additional specialised moments may warrant their own render — only with prior written approval.",
    paymentHeading: "08  SCHEDULE OF PAYMENTS",
    paymentIntro:
      "Eight milestones. Each payment acknowledges what was delivered.",
    milestones: eightMilestones(),
    feeProtection:
      "The privileged investment is valid for 30 days. A signed agreement locks this rate for the full engagement.",
    termsHeading: "GOOD TO KNOW",
    terms: defaultTerms(),
    nextHeading: "TO BEGIN TOGETHER",
    nextBody:
      "Confirm the scope, sign the agreement, and make the first instalment of 35%. From that day, the engagement begins — a call from your Client Advisor, a structured listening session, and a house planned as one idea across all levels.",
    preparedByRole: "PREPARED BY — CLIENT ADVISOR",
    preparedByName: "Ms. Preeti Vashist",
    acceptedByRole: "ACCEPTED BY — CLIENT",
    acceptedByName: "Mr. Ashley Khilwani",
    footerTagline: "Every client returns.",
  };
}

/** Club House — Omaxe Ludhiana sample */
export function createClubHouseTemplate(): FeeProposalDoc {
  const area = 19480;
  return {
    id: uid("prop"),
    updatedAt: new Date().toISOString(),
    projectType: "club_house",
    eyebrow: "DESIGN FEE PROPOSAL · CLUB HOUSE",
    title: "Design Fee Proposal",
    heroHeadline: "A clubhouse they keep coming back to.",
    confidentialLabel: "Confidential",
    dateLabel: new Date().toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    }),
    clientName: "",
    clientCompany: "Omaxe Limited",
    pointOfContact: "Ms. Preeti Vashist",
    officeAreaLabel: "19,480 sq.ft.",
    officeAddress:
      "Clubhouse · Ludhiana, Punjab · GF 15,750 sq.ft. · FF 3,730 sq.ft.",
    referredBy: "",
    partnerLine: PARTNER,
    advisorPhone: "+91 88009 96501",
    advisorEmail: "pkv@essentia.in",
    images: imgs("clubhouse", [
      "Arrival at dusk — a building is judged first from the drive.",
      "The space between the rooms — courtyards and pause points decided on the plan.",
      "Member-facing interiors built for honest daily wear.",
      "Facade and volume — tolerances that leave nowhere to hide.",
    ]),
    noteHeading: "02  A NOTE FROM US",
    noteLead:
      "The building will open on a single evening. It will be judged on every evening after that.",
    noteBody:
      "A clubhouse is the one building on an estate that is never finished being used. Members arrive expecting something, and they decide — quietly, in the first thirty seconds, and then again every time they return — whether this is a place they want to be in.\n\nThat is the real brief. Not nineteen thousand square feet of finishes. A place that holds a Sunday morning and a Saturday night with equal grace; that looks as considered in its fourth year as in its first week.\n\nWhat most concerns a promoter is whether the building that finally opens will be the building that was shown — and whether surfaces, seating, lighting and joinery will still hold up under the honest wear of a few hundred people a day.",
    quoteAttribution: "EVERY CLIENT RETURNS",
    quoteText:
      "For a clubhouse, that promise has a second life — because your members must return too.",
    projectHeading: "03  THE PROJECT",
    projectSub: "Space Planning & MEP · Interior Design including FF&E",
    projectBody:
      "Complete design for a clubhouse across ground and first floor — space planning with MEP coordination, and full interior design including FF&E. Facade/exterior design can be added as a separate option where required.",
    concernsHeading: "04  WHAT WE KNOW TO BE TRUE",
    concernsSub: "Concerns that come up on every clubhouse brief.",
    concerns: [
      {
        id: uid("c"),
        title: '"Renders always look good. Will the building match?"',
        body: "We close the gap between design and the thing that finally gets built and used — version-controlled approvals at every gate.",
      },
      {
        id: uid("c"),
        title: '"Public space will wear out in three years."',
        body: "Nineteen thousand square feet of public-facing space is designed against footfall — traffic-rated flooring, contract-grade upholstery, lighting and joinery specified for use.",
      },
      {
        id: uid("c"),
        title: '"We will be routed between departments."',
        body: "One named Client Advisor from this conversation to the Day of Recognition, with the full studio and in-house facility behind them.",
      },
    ],
    investmentHeading: "05  INVESTMENT SUMMARY",
    investmentSub: "The design fee — configured for this clubhouse.",
    services: [
      {
        id: uid("svc"),
        name: "Space Planning & MEP",
        description:
          "Space planning across both floors, with plumbing, electrical and HVAC coordination. Facade and exterior design are not in this base scope (saves 5–6 weeks).",
        enabled: true,
        areaSqft: area,
        standardRate: 200,
        privilegedRate: 130, // ≈ 38,96,000/19480 after privilege stack
      },
      {
        id: uid("svc"),
        name: "Interior Design — including FF&E",
        description:
          "Full interior scope: 3D interiors, GFC drawings, materials and finishes, FF&E for member-facing and back-of-house spaces to the same standard.",
        enabled: true,
        areaSqft: area,
        standardRate: 1200,
        privilegedRate: 780, // 35% off
      },
    ],
    usePrivileged: true,
    privilegePercentLabel: "35%",
    privilegeBadge: "PRIVILEGE BENEFIT · 35%",
    privilegeTitle: "Special privilege applied for this clubhouse engagement.",
    privilegeBody:
      "Full scope and deliverables identical to the standard engagement. Valid 30 days from issue; locked on signed agreement.",
    privilegeValidityDays: 30,
    inclusionsHeading: "What's included",
    inclusions: [
      {
        id: uid("inc"),
        title: "Listening session & brief",
        body: "How members arrive, gather and return — before the plan is drawn.",
      },
      {
        id: uid("inc"),
        title: "Photorealistic 3D — included",
        body: "Principal zones covered before construction begins.",
      },
      {
        id: uid("inc"),
        title: "GFC + MEP sets",
        body: "Contractor-ready packages with coordinated services.",
      },
      {
        id: uid("inc"),
        title: "FF&E curation — included",
        body: "Specified for daily public use, not show-home softness alone.",
      },
      {
        id: uid("inc"),
        title: "Back-of-house to the same standard",
        body: "Staff and management floors designed with the same care as member spaces.",
      },
      {
        id: uid("inc"),
        title: "Day of Recognition",
        body: "The evening the clubhouse opens — complete, not almost complete.",
      },
    ],
    includedRenders: 45,
    extraRenderRate: 45000,
    rendersNote:
      "Included views cover a clubhouse of this scale. Additional specialised zones may need extra renders — only with prior written approval.",
    paymentHeading: "08  SCHEDULE OF PAYMENTS",
    paymentIntro:
      "Seven milestones (no facade in base scope). Each payment acknowledges what was delivered.",
    milestones: sevenMilestonesNoFacade(),
    feeProtection:
      "The privileged investment is valid for 30 days. A signed agreement locks this rate for the full engagement.",
    termsHeading: "GOOD TO KNOW",
    terms: defaultTerms(),
    nextHeading: "TO BEGIN TOGETHER",
    nextBody:
      "Confirm the two services above, the Area of Reference, and whether lighting, landscape or facade design should be added before we begin. First instalment of 35% blocks design-room dates.",
    preparedByRole: "PREPARED BY — CLIENT ADVISOR",
    preparedByName: "Ms. Preeti Vashist",
    acceptedByRole: "ACCEPTED BY — CLIENT",
    acceptedByName: "Omaxe Limited",
    footerTagline: "Every client returns.",
  };
}

/** Corporate office — Laburnum-style commercial workspace */
export function createCorporateOfficeTemplate(): FeeProposalDoc {
  const area = 10000;
  return {
    id: uid("prop"),
    updatedAt: new Date().toISOString(),
    projectType: "corporate_office",
    eyebrow: "DESIGN FEE PROPOSAL · CORPORATE OFFICE",
    title: "Design Fee Proposal",
    heroHeadline: "A headquarters that signals how you work.",
    confidentialLabel: "Confidential",
    dateLabel: new Date().toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    }),
    clientName: "Mr. Vipin Kaushik",
    clientCompany: "Laburnum Developer",
    pointOfContact: "Mr. Ajay Sudhera",
    officeAreaLabel: "10,000 sq.ft.",
    officeAddress: "31st Floor · M3M IFC · Sector 66, Gurugram",
    referredBy: "Hardesh Chawla",
    partnerLine: PARTNER,
    advisorPhone: "+91 88009 96501",
    advisorEmail: "pkv@essentia.in",
    images: imgs("corporate", [
      "Selected work — corporate interiors that hold client meetings and daily work equally well.",
      "Workstation clusters resolved with MEP, not after it.",
      "Client-facing rooms that signal clarity of purpose.",
      "Material and lighting layers before a contractor is briefed.",
    ]),
    noteHeading: "01  A NOTE FROM US",
    noteLead:
      "The office your people walk into every morning shapes every decision they make inside it.",
    noteBody:
      "A headquarters in a visible commercial address is not a generic workspace. The design communicates culture, ambition and standards to every client, partner and employee who steps off the elevator.\n\nThe organisations that understand the workspace is not a cost but a signal are the ones that attract better talent and close meetings in rooms that feel like they belong to a firm that takes itself seriously.",
    quoteAttribution: "ESSENTIA ENVIRONMENTS",
    quoteText:
      "When a trusted introduction is made, the conversation has already begun — with trust built before we entered the room.",
    projectHeading: "02  THE PROJECT",
    projectSub: "Space Planning + MEP · Interior Design + FF&E · Staging & Styling",
    projectBody:
      "Complete design, planning and final-layer styling of a corporate office — employee-centric, productivity-driven, aligned with brand identity.",
    concernsHeading: "03  WHAT WE KNOW TO BE TRUE",
    concernsSub: "Three concerns that come up in every corporate workspace brief.",
    concerns: [
      {
        id: uid("c"),
        title:
          '"The design looked great in the presentation but felt different when it was built."',
        body: "Every zone is walked through in photorealistic 3D before a contractor is briefed. What is approved in the walkthrough is what gets built.",
      },
      {
        id: uid("c"),
        title:
          '"The MEP and the design conflicted and compromises were made on site."',
        body: "Space Planning and MEP drawings are produced simultaneously — HVAC, lighting, data and plumbing resolved with the plan.",
      },
      {
        id: uid("c"),
        title:
          '"The project ran beyond the agreed timeline and disrupted our operations."',
        body: "Written approval at every gate. Champagne-Readiness Audit before occupation.",
      },
    ],
    investmentHeading: "04  DESIGN INVESTMENT",
    investmentSub: "Configured for this corporate office — with privileged pricing.",
    services: [
      {
        id: uid("svc"),
        name: "Space Planning + MEP",
        description:
          "Zoning, circulation, workstations, meeting rooms, client areas, breakout zones. Full MEP set.",
        enabled: true,
        areaSqft: area,
        standardRate: 250,
        privilegedRate: 106.25,
      },
      {
        id: uid("svc"),
        name: "Interior Design + FF&E",
        description:
          "3D walkthroughs, GFC drawings, finishes, and FF&E curated for brand and culture.",
        enabled: true,
        areaSqft: area,
        standardRate: 1200,
        privilegedRate: 637.5,
      },
      {
        id: uid("svc"),
        name: "Staging & Styling",
        description:
          "Art, fragrance, soft furnishings and client-zone styling for Day of Occupation.",
        enabled: true,
        areaSqft: area,
        standardRate: 200,
        privilegedRate: 106.25,
      },
    ],
    usePrivileged: true,
    privilegePercentLabel: "special",
    privilegeBadge: "SPECIAL PRIVILEGE",
    privilegeTitle:
      "A personal introduction is a personal commitment — on both sides.",
    privilegeBody:
      "As a mark of introduction, a special privilege is extended on the design fee. Scope and deliverables remain identical to the standard engagement.",
    privilegeValidityDays: 30,
    inclusionsHeading: "What's included",
    inclusions: [
      {
        id: uid("inc"),
        title: "Organisation Profile & Listening Session",
        body: "How the team works and what the brand must communicate.",
      },
      {
        id: uid("inc"),
        title: "25 Photorealistic 3D Renders — Included",
        body: "Principal zones before a contractor is briefed.",
      },
      {
        id: uid("inc"),
        title: "GFC Drawing Set",
        body: "Released after written approval.",
      },
      {
        id: uid("inc"),
        title: "MEP Drawings — Full Set",
        body: "Electrical, data, HVAC and plumbing with the space plan.",
      },
      {
        id: uid("inc"),
        title: "FF&E Curation — Included",
        body: "Selected for brand identity and how the team works.",
      },
      {
        id: uid("inc"),
        title: "Staging — Day of Occupation",
        body: "Complete on Day One — not almost complete.",
      },
    ],
    includedRenders: 25,
    extraRenderRate: 45000,
    rendersNote:
      "Included renders cover a workspace of standard layout. Additional zones may need extra views — only with prior written approval.",
    paymentHeading: "05  SCHEDULE OF PAYMENTS",
    paymentIntro:
      "Eight milestones. Each payment acknowledges what was delivered.",
    milestones: eightMilestones(),
    feeProtection:
      "The privileged investment is valid for 30 days and locks on signed agreement.",
    termsHeading: "06  GOOD TO KNOW",
    terms: defaultTerms(),
    nextHeading: "07  TO BEGIN TOGETHER",
    nextBody:
      "Confirm the scope, sign the agreement, and make the first instalment. Engagement Team Lead calls within 48 hours.",
    preparedByRole: "PREPARED BY — CLIENT ADVISOR",
    preparedByName: "Preeti Vashisht",
    acceptedByRole: "ACCEPTED BY — CLIENT",
    acceptedByName: "Mr. Vipin Kaushik",
    footerTagline: "Every client returns.",
  };
}

/** Commercial space — sales gallery / retail / commercial fit-out */
export function createCommercialSpaceTemplate(): FeeProposalDoc {
  const base = createCorporateOfficeTemplate();
  return {
    ...base,
    id: uid("prop"),
    projectType: "commercial_space",
    eyebrow: "DESIGN FEE PROPOSAL · COMMERCIAL SPACE",
    heroHeadline: "A commercial space that sells the brand before anyone speaks.",
    clientName: "",
    clientCompany: "Commercial Client",
    pointOfContact: "",
    officeAreaLabel: "8,000 sq.ft.",
    officeAddress: "Sales gallery / commercial fit-out · City TBD",
    referredBy: "",
    images: imgs("commercial", [
      "Selected work — commercial interiors that convert visitors.",
      "Brand-led planning for galleries, retail and experience centres.",
      "Lighting and material layers that photograph and perform.",
      "FF&E curated for high footfall and brand clarity.",
    ]),
    noteLead:
      "A commercial space is judged in the first thirty seconds — by customers who owe you nothing.",
    noteBody:
      "Whether a sales gallery, experience centre or retail floor, the brief is dual: operational clarity for the team, and an unmistakable brand signal for every visitor.\n\nWe plan circulation, product / display moments, meeting pods and service routes as one system — with MEP resolved alongside the plan so site compromises do not dilute the brand.",
    projectSub: "Space Planning + MEP · Interior Design + FF&E · Staging",
    projectBody:
      "Complete design for a commercial space — visitor journey, brand expression, and back-of-house efficiency in one engagement.",
    services: base.services.map((s) => ({
      ...s,
      id: uid("svc"),
      areaSqft: 8000,
    })),
    acceptedByName: "",
  };
}

export function createTemplateForType(type: FeeProjectType): FeeProposalDoc {
  switch (type) {
    case "residence":
      return createResidenceTemplate();
    case "club_house":
      return createClubHouseTemplate();
    case "corporate_office":
      return createCorporateOfficeTemplate();
    case "commercial_space":
      return createCommercialSpaceTemplate();
    default:
      return createCorporateOfficeTemplate();
  }
}

/** @deprecated use createCorporateOfficeTemplate / createTemplateForType */
export function createLaburnumTemplate(): FeeProposalDoc {
  return createCorporateOfficeTemplate();
}

export function createBlankCommercialTemplate(): FeeProposalDoc {
  const doc = createCorporateOfficeTemplate();
  return {
    ...doc,
    id: uid("prop"),
    clientName: "",
    clientCompany: "",
    pointOfContact: "",
    officeAreaLabel: "",
    officeAddress: "",
    referredBy: "",
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

export const PROPOSAL_STORAGE_KEY = "essentia_fee_proposals_v2";
