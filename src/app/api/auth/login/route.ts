import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, ensureUser } from "@/lib/session";
import { SESSION_COOKIE, SESSION_TTL_MS, type Role } from "@/lib/bd-types";

/** Demo portal credentials — single account for the team. */
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "password123";
const DEMO_EMAIL = "admin@essentia.local";
const DEMO_NAME = "Super Admin";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      username?: string;
      password?: string;
      demo?: boolean;
    };

    const isDemoTap = body.demo === true;
    const username = (body.username ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    const ok =
      isDemoTap ||
      ((username === DEMO_USERNAME || username === DEMO_EMAIL) &&
        password === DEMO_PASSWORD);

    if (!ok) {
      return NextResponse.json(
        { error: "Use the demo account on this screen to sign in." },
        { status: 401 },
      );
    }

    const base = await ensureUser(DEMO_EMAIL, DEMO_NAME);
    const user = await prisma.user.update({
      where: { id: base.id },
      data: { name: DEMO_NAME, role: "SUPERADMIN" },
    });

    const token = await createSession({
      id: user.id,
      email: user.email,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
      },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    const message =
      err instanceof Error &&
      /DATABASE_URL|Can't reach|P1001|P1017/i.test(err.message)
        ? "Database is not configured on the server. Set DATABASE_URL (Neon) in Vercel env."
        : "Could not sign in. Check DATABASE_URL / Neon connection, then try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
