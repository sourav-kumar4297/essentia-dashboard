import { prisma } from "@/lib/db";
import { createSession, ensureUser } from "@/lib/session";
import type { AuthUser, Role } from "@/lib/bd-types";

const TEST_ACCOUNTS: Record<string, { name: string; role: Role }> = {
  "admin@essentia.com": { name: "Team Leader", role: "ADMIN" },
  "member@essentia.com": { name: "Executive", role: "MEMBER" },
};

export function isTestLoginEnabled(): boolean {
  return process.env.ALLOW_TEST_LOGIN !== "false";
}

export function getTestAccount(email: string) {
  if (!isTestLoginEnabled()) return null;
  const normalized = email.trim().toLowerCase();
  const account = TEST_ACCOUNTS[normalized];
  if (!account) return null;
  return { email: normalized, ...account };
}

export async function signInTestAccount(email: string) {
  const account = getTestAccount(email);
  if (!account) return null;

  const base = await ensureUser(account.email, account.name);
  const user = await prisma.user.update({
    where: { id: base.id },
    data: {
      role: account.role,
      team: base.team || "business-development",
      // Keep profileSetupComplete as-is so first-time onboarding still runs
      ...(base.profileSetupComplete
        ? { name: account.name }
        : {}),
    },
  });

  if (user.blocked) {
    throw new Error("ACCOUNT_BLOCKED");
  }

  const token = await createSession({
    id: user.id,
    email: user.email,
  });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    team: user.team,
    phone: user.phone,
    profileSetupComplete: user.profileSetupComplete,
  };

  return {
    token,
    user: authUser,
  };
}
