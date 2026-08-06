import type { AuthUser, Role } from "@/lib/bd-types";

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
  return isFullAccess(role);
}

export function canViewAllLeads(role: Role): boolean {
  return isFullAccess(role);
}

export function canManageUsers(role: Role): boolean {
  return role === "SUPERADMIN";
}

/** Member may only mutate assigned or self-created pending referrals. */
export function canAccessLead(
  user: AuthUser,
  lead: { assignedToId: string | null; createdById: string | null },
): boolean {
  if (isFullAccess(user.role)) return true;
  return (
    lead.assignedToId === user.id || lead.createdById === user.id
  );
}
