import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, getSessionUser } from "@/lib/session";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  type AuthUser,
  type Role,
} from "@/lib/bd-types";

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

function toUserPayload(
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    team: string;
    phone: string;
    profileSetupComplete: boolean;
  },
  impersonator?: AuthUser["impersonator"],
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    team: user.team,
    phone: user.phone ?? "",
    profileSetupComplete: user.profileSetupComplete,
    ...(impersonator ? { impersonator } : {}),
  };
}

/**
 * Super Admin only: check in as another user (no OTP), or restore own session.
 * Body: { userId: string } | { restore: true }
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      userId?: string;
      restore?: boolean;
    };

    if (body.restore === true) {
      if (!session.impersonator) {
        return NextResponse.json(
          { error: "Not checked in as another user." },
          { status: 400 },
        );
      }
      const actor = await prisma.user.findUnique({
        where: { id: session.impersonator.id },
      });
      if (!actor || actor.blocked || (actor.role as Role) !== "SUPERADMIN") {
        return NextResponse.json(
          { error: "Super Admin session is no longer valid." },
          { status: 403 },
        );
      }
      const token = await createSession({
        id: actor.id,
        email: actor.email,
      });
      const res = NextResponse.json({
        ok: true,
        user: toUserPayload(actor),
      });
      setSessionCookie(res, token);
      return res;
    }

    const targetId = body.userId?.trim();
    if (!targetId) {
      return NextResponse.json(
        { error: "userId is required." },
        { status: 400 },
      );
    }

    const actor = session.impersonator
      ? await prisma.user.findUnique({ where: { id: session.impersonator.id } })
      : session.role === "SUPERADMIN"
        ? await prisma.user.findUnique({ where: { id: session.id } })
        : null;

    if (!actor || actor.blocked || (actor.role as Role) !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can check in as another user." },
        { status: 403 },
      );
    }

    if (targetId === actor.id) {
      const token = await createSession({
        id: actor.id,
        email: actor.email,
      });
      const res = NextResponse.json({
        ok: true,
        user: toUserPayload(actor),
      });
      setSessionCookie(res, token);
      return res;
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (target.blocked) {
      return NextResponse.json(
        { error: "That account is blocked." },
        { status: 403 },
      );
    }
    if ((target.role as Role) === "SUPERADMIN") {
      return NextResponse.json(
        { error: "Cannot check in as another Super Admin." },
        { status: 400 },
      );
    }

    const token = await createSession(
      { id: target.id, email: target.email },
      { actorId: actor.id, actorEmail: actor.email },
    );

    const res = NextResponse.json({
      ok: true,
      user: toUserPayload(target, {
        id: actor.id,
        email: actor.email,
        name: actor.name,
      }),
    });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    console.error("[auth/switch-user]", err);
    return NextResponse.json(
      { error: "Could not switch user." },
      { status: 500 },
    );
  }
}
