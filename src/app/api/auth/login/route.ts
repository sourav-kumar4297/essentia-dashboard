import { NextResponse } from "next/server";
import { createSession, ensureUser } from "@/lib/session";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/bd-types";

/** Temporary demo credentials (same as early portal). */
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "password123";
const DEMO_EMAIL = "admin@essentia.local";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username?: string;
      password?: string;
    };
    const username = body.username?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    const validUser =
      username === DEMO_USERNAME ||
      username === DEMO_EMAIL ||
      username === "admin@essentia.local";

    if (!validUser || password !== DEMO_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    const user = await ensureUser(DEMO_EMAIL, "Super Admin");
    const token = await createSession(user.id);

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
    console.error(err);
    return NextResponse.json(
      { error: "Could not sign in." },
      { status: 500 },
    );
  }
}
