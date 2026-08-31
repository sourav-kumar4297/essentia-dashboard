import type { AuthUser, BdLeadStatus, Role } from "@/lib/bd-types";

export const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "BD Admin",
  MEMBER: "BD Member",
};

export function isFullAccess(role: Role): boolean {
  return role === "SUPERADMIN" || role === "ADMIN";
}

export function canAssignLeads(role: Role): boolean {
  return isFullAccess(role);
}

export function canApproveReferrals(role: Role): boolean {
  return isFullAccess(role);
}

export function canSyncHubspot(role: Role): boolean {
  return role === "SUPERADMIN";
}

export function canViewAllLeads(role: Role): boolean {
  return isFullAccess(role);
}

export function canManageUsers(role: Role): boolean {
  return role === "SUPERADMIN";
}

/** Statuses a BD member may set while working a call. */
export const MEMBER_STATUSES: BdLeadStatus[] = [
  "NEW",
  "CONTACTED",
  "IN_DISCUSSION",
  "HOLD",
  "LOST",
];

export function memberCanSetStatus(status: string): boolean {
  return MEMBER_STATUSES.includes(status as BdLeadStatus);
}

export function isHotOrWarm(qualification: string): boolean {
  return qualification === "Hot" || qualification === "Warm";
}

/** Prisma where: member sees assigned work + own pending referrals. */
export function memberLeadWhere(userId: string) {
  return {
    OR: [
      { assignedToId: userId },
      {
        createdById: userId,
        isPersonalReferral: true,
        referralApproval: "PENDING",
      },
    ],
  };
}

/** Member may only work leads assigned to them (or pending self-referrals). */
export function canAccessLead(
  user: AuthUser,
  lead: {
    assignedToId: string | null;
    createdById: string | null;
    isPersonalReferral?: boolean;
    referralApproval?: string;
  },
): boolean {
  if (isFullAccess(user.role)) return true;
  if (lead.assignedToId === user.id) return true;
  return (
    lead.createdById === user.id &&
    lead.isPersonalReferral === true &&
    lead.referralApproval === "PENDING"
  );
}
