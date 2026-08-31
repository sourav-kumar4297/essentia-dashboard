import { NextResponse } from "next/server";
import { createSession, ensureUser, verifyOtp } from "@/lib/session";
import {
  isAllowedLoginEmail,
  LOGIN_EMAIL_HINT,
  normalizeEmail,
} from "@/lib/allowed-email";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/bd-types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; code?: string };
    const email = normalizeEmail(body.email ?? "");
    const code = body.code?.trim();
    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required." },
        { status: 400 },
      );
    }

    if (!isAllowedLoginEmail(email)) {
      return NextResponse.json({ error: LOGIN_EMAIL_HINT }, { status: 400 });
    }

    const ok = await verifyOtp(email, code);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired code." },
        { status: 401 },
      );
    }

    const user = await ensureUser(email);
    const token = await createSession(user);

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
    const message = err instanceof Error ? err.message : "";
    if (message === "ACCOUNT_BLOCKED") {
      return NextResponse.json(
        { error: "This account is blocked. Contact a Super Admin." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: "Could not verify OTP." },
      { status: 500 },
    );
  }
}
