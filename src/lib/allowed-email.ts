const ALLOWED_DOMAINS = [
  "essentiahome.com",
  "essentia.in",
  "essentiaenvironments.com",
] as const;

const ALLOWED_EMAILS = ["souravkumar4297@gmail.com"] as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowedLoginEmail(email: string): boolean {
  const e = normalizeEmail(email);
  if (!e.includes("@")) return false;
  if ((ALLOWED_EMAILS as readonly string[]).includes(e)) return true;
  const domain = e.split("@")[1] ?? "";
  return (ALLOWED_DOMAINS as readonly string[]).includes(domain);
}

export const LOGIN_EMAIL_HINT =
  "Use an @essentiahome.com, @essentia.in, or @essentiaenvironments.com email.";
