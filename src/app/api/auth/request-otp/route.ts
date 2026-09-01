import { NextResponse } from "next/server";
import { createOtp } from "@/lib/session";
import { sendOtpEmail } from "@/lib/otp-mail";
import {
  isAllowedLoginEmail,
  LOGIN_EMAIL_HINT,
  normalizeEmail,
} from "@/lib/allowed-email";
import { signInTestAccount } from "@/lib/test-login";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/bd-types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = normalizeEmail(body.email ?? "");
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 },
      );
    }

    if (!isAllowedLoginEmail(email)) {
      return NextResponse.json({ error: LOGIN_EMAIL_HINT }, { status: 400 });
    }

    const signedIn = await signInTestAccount(email);
    if (signedIn) {
      const res = NextResponse.json({
        ok: true,
        email,
        directLogin: true,
        user: signedIn.user,
      });
      res.cookies.set(SESSION_COOKIE, signedIn.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_TTL_MS / 1000,
      });
      return res;
    }

    const code = await createOtp(email);
    const delivery = await sendOtpEmail(email, code);
    const allowPreview = process.env.ALLOW_DEV_OTP === "true";

    if (!delivery.delivered) {
      if (allowPreview) {
        return NextResponse.json({
          ok: true,
          email,
          delivered: false,
          previewCode: code,
          hint: delivery.error,
        });
      }
      return NextResponse.json({ error: delivery.error }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      email,
      delivered: true,
    });
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
      { error: "Could not send OTP." },
      { status: 500 },
    );
  }
}
