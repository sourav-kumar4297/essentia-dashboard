export type Role = "SUPERADMIN" | "ADMIN" | "MEMBER";

export type BdLeadStatus =
  | "NEW"
  | "CONTACTED"
  | "IN_DISCUSSION"
  | "PROPOSAL_SENT"
  | "WON"
  | "LOST"
  | "HOLD";

export type ReferralApproval = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type ActivityType =
  | "CALL"
  | "EMAIL"
  | "WHATSAPP"
  | "MEETING"
  | "NOTE"
  | "STATUS";

export const BD_STATUS_ORDER: BdLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "IN_DISCUSSION",
  "PROPOSAL_SENT",
  "WON",
];

export const BD_STATUS_LABELS: Record<BdLeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  IN_DISCUSSION: "In Discussion",
  PROPOSAL_SENT: "Proposal Sent",
  WON: "Won",
  LOST: "Lost",
  HOLD: "Hold",
};

export const SESSION_COOKIE = "essentia_session";
export const OTP_TTL_MS = 10 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
