import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, ensureUser } from "@/lib/session";
import { SESSION_COOKIE, SESSION_TTL_MS, type Role } from "@/lib/bd-types";

/** Demo portal credentials — single account for the team. */
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "password123";
const DEMO_EMAIL = "admin@essentia.local";
const DEMO_NAME = "Super Admin";

function isDbUnreachable(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return /DATABASE_URL|Can't reach|ECONNREFUSED|ETIMEDOUT|P1001|P1017|P1000|Environment variable not found/i.test(
    message,
  );
}

async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isDbUnreachable(err)) throw err;
    await new Promise((r) => setTimeout(r, 600));
    return fn();
  }
}

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

    const user = await withDbRetry(async () => {
      const base = await ensureUser(DEMO_EMAIL, DEMO_NAME);
      return prisma.user.update({
        where: { id: base.id },
        data: { name: DEMO_NAME, role: "SUPERADMIN" },
      });
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
    const message = err instanceof Error ? err.message : "";
    if (isDbUnreachable(err)) {
      return NextResponse.json(
        {
          error:
            "Database is not reachable. Confirm DATABASE_URL (Neon) in Vercel env, then retry.",
        },
        { status: 500 },
      );
    }
    if (/AUTH_SECRET/i.test(message)) {
      return NextResponse.json(
        { error: "Auth is not configured. Set AUTH_SECRET in Vercel env." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Could not sign in. Please try again." },
      { status: 500 },
    );
  }
}
