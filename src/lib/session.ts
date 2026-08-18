import { cookies } from "next/headers";
import { randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { signAuthJwt, verifyAuthJwt } from "@/lib/jwt";
import {
  OTP_TTL_MS,
  SESSION_COOKIE,
  type AuthUser,
  type Role,
} from "@/lib/bd-types";

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
): Promise<{ id: string; email: string; name: string; role: Role }> {
  const normalized = email.trim().toLowerCase();
  const superEmails = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const defaultSupers = [
    "admin@essentia.local",
    "souravkumar4297@gmail.com",
  ];
  const isSuper = new Set([...defaultSupers, ...superEmails]).has(normalized);
  const role: Role = isSuper ? "SUPERADMIN" : "MEMBER";

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) {
    if (isSuper && existing.role !== "SUPERADMIN") {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { role: "SUPERADMIN" },
      });
      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role as Role,
      };
    }
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role as Role,
    };
  }
  const created = await prisma.user.create({
    data: {
      email: normalized,
      name: name?.trim() || normalized.split("@")[0],
      role,
    },
  });
  return {
    id: created.id,
    email: created.email,
    name: created.name,
    role: created.role as Role,
  };
}

export async function createSession(user: {
  id: string;
  email: string;
}): Promise<string> {
  return signAuthJwt(user);
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
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
