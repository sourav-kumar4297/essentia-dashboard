export type Territory = "Delhi" | "Gurugram" | "Mumbai";
export type BusinessUnit = "EE" | "EH";
export type ProjectType = "residential" | "corporate" | "commercial" | "hospitality";
export type Qualification = "Hot" | "Warm" | "Cold" | "Unqualified";
export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "handed_to_acquisition"
  | "consultation"
  | "profile_sent"
  | "proposal_draft"
  | "proposal_sent"
  | "accepted"
  | "handed_to_engagement";

export type Archetype =
  | "The Visionary"
  | "The Controller"
  | "The Delegator"
  | "The Status Client"
  | "The Legacy Builder";

export type SourceChannel =
  | "Website"
  | "Instagram"
  | "Referral"
  | "Walk-In"
  | "Exhibition"
  | "WhatsApp"
  | "Google Ads"
  | "Meta Ads"
  | "E-commerce";

export interface Advisor {
  id: string;
  name: string;
  role: "growth" | "acquisition";
  territories: Territory[];
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: SourceChannel;
  businessUnit: BusinessUnit;
  projectType: ProjectType;
  location: string;
  territory: Territory;
  budgetIndication?: string;
  capturedAt: string;
  qualification: Qualification;
  stage: LeadStage;
  assignedAdvisorId: string | null;
  lastFollowUpAt: string | null;
  firstContactedAt: string | null;
  priorEngagement: boolean;
  /** Active with both EE & EH */
  crossSell: boolean;
  signed: boolean;
  areaSqft?: number;
  notes?: string;
}

export interface Consultation {
  leadId: string;
  budgetRange: string;
  timeline: string;
  projectType: ProjectType;
  decisionMaker: string;
  archetype?: Archetype;
  familyNames: string;
  preferences: string;
  summary: string;
  sqft: number;
  propertyState: string;
  location: string;
  completedAt: string;
}

export interface CompanyProfileDoc {
  id: string;
  leadId: string;
  projectType: ProjectType;
  status: "draft" | "sent";
  createdAt: string;
  sentAt?: string;
  notes?: string;
}

export type DesignServiceId =
  | "space_with_facade"
  | "space_without_facade"
  | "lighting"
  | "landscape"
  | "staging"
  | "structural"
  | "extra_renders";

export interface ProposalLine {
  serviceId: DesignServiceId;
  sqft?: number;
  quantity?: number;
  unitRate: number;
  amount: number;
}

export interface DesignFeeProposal {
  id: string;
  leadId: string;
  status: "draft" | "sent" | "accepted";
  lines: ProposalLine[];
  privilegedPricing: boolean;
  friendsFamily: boolean;
  discountPercent: number;
  subtotal: number;
  total: number;
  advisorNotes: string;
  commissionNote: string;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
}

export interface OrderConfirmation {
  id: string;
  proposalId: string;
  leadId: string;
  advisorId: string;
  instalmentConfirmed: boolean;
  handoffReady: boolean;
  handoffSummary: string;
  createdAt: string;
  handoffAt?: string;
}

export const CHANNEL_ORDER: SourceChannel[] = [
  "Website",
  "Instagram",
  "Referral",
  "Walk-In",
  "Exhibition",
  "WhatsApp",
  "Google Ads",
  "Meta Ads",
  "E-commerce",
];
