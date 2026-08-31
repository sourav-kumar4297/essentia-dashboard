export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Open for testing — any well-formed email can request an OTP. */
export function isAllowedLoginEmail(email: string): boolean {
  const e = normalizeEmail(email);
  if (!e.includes("@")) return false;
  const domain = e.split("@")[1] ?? "";
  return domain.includes(".");
}

export const LOGIN_EMAIL_HINT = "Enter a valid email address.";
