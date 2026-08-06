import { cookies } from "next/headers";
import { randomBytes, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import {
  OTP_TTL_MS,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  type AuthUser,
  type Role,
} from "@/lib/bd-types";

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
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

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
