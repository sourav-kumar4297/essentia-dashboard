import type { AuthUser } from "@/lib/bd-types";

/** Client-safe copy of needsProfileSetup (no server imports). */
export function needsProfileSetup(user: AuthUser): boolean {
  if (user.role === "SUPERADMIN") return false;
  if (user.impersonator) return false;
  return !user.profileSetupComplete;
}
