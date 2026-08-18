import { Resend } from "resend";

export type OtpSendResult =
  | { delivered: true }
  | { delivered: false; error: string };

function resendKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim() ?? "";
  if (!key || key === "re_xxxxxxxx" || key === "re_xxxxxxxxx") return null;
  return key;
}

export async function sendOtpEmail(
  email: string,
  code: string,
): Promise<OtpSendResult> {
  const key = resendKey();
  if (!key) {
    return {
      delivered: false,
      error:
        "Email is not configured. Add a real RESEND_API_KEY from resend.com to .env.",
    };
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    "Essentia <onboarding@resend.dev>";

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Welcome to Essentia dashboard",
      html: `
        <div style="font-family: Lato, Helvetica, Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; color: #111;">
          <p style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #666; margin: 0 0 16px;">Essentia</p>
          <h1 style="font-size: 22px; font-weight: 400; margin: 0 0 12px;">Welcome to Essentia dashboard</h1>
          <p style="font-size: 14px; color: #444; margin: 0 0 24px;">Your login OTP code is</p>
          <p style="font-size: 32px; letter-spacing: 0.35em; font-weight: 300; margin: 0 0 24px;">${code}</p>
          <p style="font-size: 12px; color: #888; margin: 0;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
      text: `Welcome to Essentia dashboard.\n\nYour login OTP code is ${code}.\n\nIt expires in 10 minutes.`,
    });

    if (error) {
      console.error("[OTP] Resend error", error.message);
      return {
        delivered: false,
        error: error.message || "Failed to send email.",
      };
    }

    return { delivered: true };
  } catch (err) {
    console.error("[OTP] send failed", err);
    return { delivered: false, error: "Failed to send email." };
  }
}
