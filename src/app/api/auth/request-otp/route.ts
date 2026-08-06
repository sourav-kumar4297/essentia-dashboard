import { NextResponse } from "next/server";
import { createOtp, ensureUser } from "@/lib/session";
import { sendOtpEmail } from "@/lib/otp-mail";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; name?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 },
      );
    }

    await ensureUser(email, body.name);
    const code = await createOtp(email);
    const delivery = await sendOtpEmail(email, code);

    if (!delivery.delivered && "error" in delivery && delivery.error) {
      return NextResponse.json({ error: delivery.error }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      email,
      delivered: delivery.delivered,
      // Only when Resend is off / failed and ALLOW_DEV_OTP is on
      ...("devCode" in delivery && delivery.devCode
        ? { devCode: delivery.devCode }
        : {}),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not send OTP." },
      { status: 500 },
    );
  }
}
