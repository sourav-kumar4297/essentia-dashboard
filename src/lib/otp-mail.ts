import { Resend } from "resend";

export type OtpSendResult =
  | { delivered: true }
  | { delivered: false; error: string };

function resendKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim() ?? "";
  if (!key || key === "re_xxxxxxxx" || key === "re_xxxxxxxxx") return null;
  return key;
}

function fromAddress(): string {
  return (
    process.env.RESEND_FROM?.trim() || "Essentia <noreply@essentia.in>"
  );
}

function emailOfFrom(from: string): string {
  const angled = from.match(/<([^>]+)>/);
  return (angled?.[1] ?? from).trim().toLowerCase();
}

function isSandboxFrom(from: string): boolean {
  return emailOfFrom(from).endsWith("@resend.dev");
}

function resendErrorText(error: unknown): string {
  if (!error) return "Failed to send email.";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const e = error as { message?: string; name?: string };
    if (e.message) return e.message;
    try {
      return JSON.stringify(error);
    } catch {
      return e.name || "Failed to send email.";
    }
  }
  return "Failed to send email.";
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

  const from = fromAddress();
  if (isSandboxFrom(from)) {
    return {
      delivered: false,
      error:
        "RESEND_FROM is still onboarding@resend.dev. Verifying a domain is not enough — set RESEND_FROM to an address on that domain (example: Essentia <noreply@essentia.in>) and restart the server.",
    };
  }

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
      console.error("[OTP] Resend error", resendErrorText(error), { from });
      return {
        delivered: false,
        error: resendErrorText(error),
      };
    }

    return { delivered: true };
  } catch (err) {
    console.error("[OTP] send failed", err);
    return { delivered: false, error: "Failed to send email." };
  }
}
