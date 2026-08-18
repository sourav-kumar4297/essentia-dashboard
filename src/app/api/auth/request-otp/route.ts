import { NextResponse } from "next/server";
import { createOtp } from "@/lib/session";
import { sendOtpEmail } from "@/lib/otp-mail";
import {
  isAllowedLoginEmail,
  LOGIN_EMAIL_HINT,
  normalizeEmail,
} from "@/lib/allowed-email";

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
      return NextResponse.json({ error: LOGIN_EMAIL_HINT }, { status: 403 });
    }

    const code = await createOtp(email);
    const delivery = await sendOtpEmail(email, code);

    if (!delivery.delivered) {
      return NextResponse.json({ error: delivery.error }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      email,
      delivered: true,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not send OTP." },
      { status: 500 },
    );
  }
}
