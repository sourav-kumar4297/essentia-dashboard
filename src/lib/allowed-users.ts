import type { Role } from "@/lib/bd-types";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Emails allowed to sign in, with role pre-assigned by Super Admin. */
export const ALLOWED_LOGIN_USERS: Record<
  string,
  { role: Role; name: string; team?: string }
> = {
  "pkv@essentia.in": {
    role: "ADMIN",
    name: "PKV",
    team: "business-development",
  },
  "lavanya@essentia.in": {
    role: "MEMBER",
    name: "Lavanya",
    team: "business-development",
  },
  "executive@essentia.in": {
    role: "MEMBER",
    name: "Executive",
    team: "business-development",
  },
};

/** Test accounts (no OTP when ALLOW_TEST_LOGIN is enabled). */
export const TEST_LOGIN_USERS: Record<
  string,
  { role: Role; name: string; team?: string }
> = {
  "admin@essentia.com": {
    role: "ADMIN",
    name: "Team Leader",
    team: "business-development",
  },
  "member@essentia.com": {
    role: "MEMBER",
    name: "Executive",
    team: "business-development",
  },
};

export function getPresetUser(email: string) {
  const e = normalizeEmail(email);
  return ALLOWED_LOGIN_USERS[e] ?? TEST_LOGIN_USERS[e] ?? null;
}

export function isPresetAllowedEmail(email: string): boolean {
  const e = normalizeEmail(email);
  if (ALLOWED_LOGIN_USERS[e]) return true;
  if (process.env.ALLOW_TEST_LOGIN === "false") return false;
  return Boolean(TEST_LOGIN_USERS[e]);
}
