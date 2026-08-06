import { Resend } from "resend";

export type OtpSendResult =
  | { delivered: true }
  | { delivered: false; devCode: string }
  | { delivered: false; error: string };

/**
 * Send OTP via Resend.
 * - Production: RESEND_API_KEY required
 * - Local without key: returns/logs OTP when ALLOW_DEV_OTP=true (default in development)
 */
export async function sendOtpEmail(
  email: string,
  code: string,
): Promise<OtpSendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const allowDev =
    process.env.ALLOW_DEV_OTP === "true" ||
    (!key && process.env.NODE_ENV !== "production");

  if (!key) {
    if (allowDev) {
      console.log(`[OTP DEV] ${email} → ${code}`);
      return { delivered: false, devCode: code };
    }
    return {
      delivered: false,
      error:
        "Email is not configured. Add RESEND_API_KEY to .env (see README setup).",
    };
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    "BD Portal <onboarding@resend.dev>";

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Your BD Portal sign-in code",
      html: `
        <div style="font-family: Lato, Helvetica, Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; color: #111;">
          <p style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #666; margin: 0 0 16px;">BD Portal</p>
          <h1 style="font-size: 22px; font-weight: 400; margin: 0 0 12px;">Your sign-in code</h1>
          <p style="font-size: 14px; color: #444; margin: 0 0 24px;">Use this one-time code to enter the portal. It expires in 10 minutes.</p>
          <p style="font-size: 32px; letter-spacing: 0.35em; font-weight: 300; margin: 0 0 24px;">${code}</p>
          <p style="font-size: 12px; color: #888; margin: 0;">If you did not request this, you can ignore this email.</p>
        </div>
      `,
      text: `Your BD Portal sign-in code is ${code}. It expires in 10 minutes.`,
    });

    if (error) {
      console.error("[OTP] Resend error", error);
      if (allowDev) {
        console.log(`[OTP DEV FALLBACK] ${email} → ${code}`);
        return { delivered: false, devCode: code };
      }
      return {
        delivered: false,
        error: error.message || "Failed to send email.",
      };
    }

    return { delivered: true };
  } catch (err) {
    console.error("[OTP] send failed", err);
    if (allowDev) {
      return { delivered: false, devCode: code };
    }
    return { delivered: false, error: "Failed to send email." };
  }
}
