import { prisma } from "@/lib/db";
import { createSession, ensureUser } from "@/lib/session";
import type { Role } from "@/lib/bd-types";

const TEST_ACCOUNTS: Record<string, { name: string; role: Role }> = {
  "admin@essentia.com": { name: "BD Admin", role: "ADMIN" },
  "member@essentia.com": { name: "BD Member", role: "MEMBER" },
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
    data: { name: account.name, role: account.role },
  });

  if (user.blocked) {
    throw new Error("ACCOUNT_BLOCKED");
  }

  const token = await createSession({
    id: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    },
  };
}
