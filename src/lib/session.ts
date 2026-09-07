import { cookies } from "next/headers";
import { randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { signAuthJwt, verifyAuthJwt } from "@/lib/jwt";
import { getPresetUser } from "@/lib/allowed-users";
import {
  OTP_TTL_MS,
  SESSION_COOKIE,
  type AuthUser,
  type Role,
} from "@/lib/bd-types";

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  team: string;
  phone: string;
  profileSetupComplete: boolean;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    team: user.team ?? "",
    phone: user.phone ?? "",
    profileSetupComplete: Boolean(user.profileSetupComplete),
  };
}

function resolveBuiltinRole(email: string): {
  role: Role;
  name: string;
  team: string;
  skipSetup: boolean;
} | null {
  const normalized = email.trim().toLowerCase();
  const superEmails = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const defaultSupers = ["souravkumar4297@gmail.com"];
  if (new Set([...defaultSupers, ...superEmails]).has(normalized)) {
    return {
      role: "SUPERADMIN",
      name: normalized.split("@")[0] || "Super Admin",
      team: "business-development",
      skipSetup: true,
    };
  }
  const preset = getPresetUser(normalized);
  if (!preset) return null;
  return {
    role: preset.role,
    name: preset.name,
    team: preset.team || "business-development",
    skipSetup: false,
  };
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export async function createOtp(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpCode.updateMany({
    where: { email: normalized, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.otpCode.create({
    data: { email: normalized, code, expiresAt },
  });

  return code;
}

export async function verifyOtp(
  email: string,
  code: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const row = await prisma.otpCode.findFirst({
    where: {
      email: normalized,
      code: code.trim(),
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return false;
  await prisma.otpCode.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return true;
}

export async function ensureUser(
  email: string,
  name?: string,
): Promise<AuthUser> {
  const normalized = email.trim().toLowerCase();
  const builtin = resolveBuiltinRole(normalized);
  if (!builtin) {
    throw new Error("EMAIL_NOT_ALLOWED");
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) {
    if (existing.blocked) {
      throw new Error("ACCOUNT_BLOCKED");
    }
    const data: {
      role?: Role;
      team?: string;
      profileSetupComplete?: boolean;
      name?: string;
    } = {};
    if (existing.role !== builtin.role) data.role = builtin.role;
    if (!existing.team && builtin.team) data.team = builtin.team;
    if (builtin.skipSetup && !existing.profileSetupComplete) {
      data.profileSetupComplete = true;
    }
    if (Object.keys(data).length) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data,
      });
      return toAuthUser(updated);
    }
    return toAuthUser(existing);
  }

  const created = await prisma.user.create({
    data: {
      email: normalized,
      name: name?.trim() || builtin.name,
      role: builtin.role,
      team: builtin.team,
      phone: "",
      profileSetupComplete: builtin.skipSetup,
    },
  });
  return toAuthUser(created);
}

export async function createSession(
  user: {
    id: string;
    email: string;
  },
  opts?: { actorId?: string; actorEmail?: string },
): Promise<string> {
  return signAuthJwt(user, opts);
}

export async function destroySession(_token: string): Promise<void> {
  void _token;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = verifyAuthJwt(token);
  if (!claims) return null;

  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (!user || user.blocked) return null;

  const auth = toAuthUser(user);

  if (claims.actorId) {
    const actor = await prisma.user.findUnique({
      where: { id: claims.actorId },
    });
    if (
      !actor ||
      actor.blocked ||
      (actor.role as Role) !== "SUPERADMIN"
    ) {
      return null;
    }
    auth.impersonator = {
      id: actor.id,
      email: actor.email,
      name: actor.name,
    };
  }

  return auth;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

/** Needs first-time name + phone setup. */
export function needsProfileSetup(user: AuthUser): boolean {
  if (user.role === "SUPERADMIN") return false;
  if (user.impersonator) return false;
  return !user.profileSetupComplete;
}
